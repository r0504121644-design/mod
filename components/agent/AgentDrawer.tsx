"use client";

import { useState, useRef, useEffect } from "react";
import { X, HeartHandshake, Send, ShieldCheck, ChevronDown, Sparkles } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { askAgent, AGENT_PROMPT_SHORTCUTS, AGENT_ROLE_STATEMENT } from "@/lib/agentService";
import { Button } from "@/components/ui/Button";
import { PremiumBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/cn";

const PERMISSION_LABELS: { key: "vitals" | "medications" | "appointments" | "documents" | "shifts"; label: string }[] = [
  { key: "vitals", label: "מדדים בריאותיים" },
  { key: "medications", label: "תרופות ומלאי" },
  { key: "appointments", label: "תורים ואשפוזים" },
  { key: "documents", label: "מסמכים" },
  { key: "shifts", label: "תורנויות משפחתיות" },
];

export function AgentDrawer() {
  const isOpen = useAppStore((s) => s.isAgentDrawerOpen);
  const close = useAppStore((s) => s.closeAgentDrawer);
  const messages = useAppStore((s) => s.agentMessages);
  const sendMessage = useAppStore((s) => s.sendAgentMessage);
  const permissions = useAppStore((s) => s.agentPermissions);
  const setPermission = useAppStore((s) => s.setAgentPermission);
  const isPremium = useAppStore((s) => s.isPremium);
  const openSubscriptionModal = useAppStore((s) => s.openSubscriptionModal);
  const familySpace = useAppStore((s) => s.familySpace);
  const vitals = useAppStore((s) => s.vitals);
  const medications = useAppStore((s) => s.medications);
  const shifts = useAppStore((s) => s.shifts);

  const [input, setInput] = useState("");
  const [showPermissions, setShowPermissions] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  if (!isOpen) return null;

  async function handleAsk(prompt: string) {
    if (!prompt.trim()) return;
    sendMessage({ id: `u_${Date.now()}`, role: "user", text: prompt, timestamp: new Date().toISOString() });
    setInput("");
    setIsThinking(true);
    const res = await askAgent(prompt, {
      parentAlias: familySpace.parentAlias,
      vitals,
      medications,
      shifts,
      members: familySpace.members,
    });
    setIsThinking(false);
    sendMessage({ id: `a_${Date.now()}`, role: "agent", text: res.text, timestamp: new Date().toISOString() });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end lg:justify-start">
      <div className="absolute inset-0 bg-navy/30 backdrop-blur-sm" onClick={close} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-cream shadow-2xl animate-slide-in">
        <div className="flex items-center justify-between gap-3 border-b border-navy/10 bg-royal-gradient px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <HeartHandshake size={20} />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">לב המעבר</p>
              <p className="text-[11px] text-white/70 leading-tight">מלווה, לא רופא</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPremium && <PremiumBadge />}
            <button onClick={close} className="rounded-full p-1.5 hover:bg-white/10 transition-colors" aria-label="סגור">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="border-b border-navy/10 bg-lightblue/50 px-5 py-3 text-xs leading-relaxed text-royal">
          {AGENT_ROLE_STATEMENT}
        </div>

        <button
          onClick={() => setShowPermissions((v) => !v)}
          className="flex items-center justify-between gap-2 border-b border-navy/10 px-5 py-2.5 text-xs font-semibold text-navy/60 hover:bg-white/60 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-turquoise" />
            הרשאות פרטיות לסוכן
          </span>
          <ChevronDown size={14} className={cn("transition-transform", showPermissions && "rotate-180")} />
        </button>
        {showPermissions && (
          <div className="border-b border-navy/10 bg-white px-5 py-3 space-y-2 animate-fade-up">
            {PERMISSION_LABELS.map((p) => (
              <label key={p.key} className="flex items-center justify-between text-sm text-navy/70">
                {p.label}
                <input
                  type="checkbox"
                  checked={permissions[p.key]}
                  onChange={(e) => setPermission(p.key, e.target.checked)}
                  className="h-4 w-4 accent-royal"
                />
              </label>
            ))}
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-sm text-navy/40 py-8">
              שאלו אותי כל דבר לגבי הטיפול ב{familySpace.parentAlias}, או בחרו קיצור דרך למטה.
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line",
                m.role === "user"
                  ? "ms-auto bg-royal text-white rounded-es-sm"
                  : "me-auto bg-white text-navy shadow-card rounded-ee-sm"
              )}
            >
              {m.text}
            </div>
          ))}
          {isThinking && (
            <div className="me-auto flex items-center gap-1.5 rounded-2xl bg-white px-4 py-3 shadow-card">
              <span className="h-1.5 w-1.5 rounded-full bg-navy/30 animate-pulse-soft" />
              <span className="h-1.5 w-1.5 rounded-full bg-navy/30 animate-pulse-soft [animation-delay:0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-navy/30 animate-pulse-soft [animation-delay:0.3s]" />
            </div>
          )}
        </div>

        {!isPremium && (
          <button
            onClick={openSubscriptionModal}
            className="mx-5 mb-2 flex items-center justify-center gap-1.5 rounded-xl border border-gold/30 bg-amber-50 px-3 py-2 text-xs font-semibold text-gold hover:bg-amber-100 transition-colors"
          >
            <Sparkles size={13} />
            פתחו את לב המעבר פרימיום לתובנות מתקדמות
          </button>
        )}

        <div className="px-5 pb-2 flex gap-2 overflow-x-auto no-scrollbar">
          {AGENT_PROMPT_SHORTCUTS.map((s) => (
            <button
              key={s}
              onClick={() => handleAsk(s)}
              className="shrink-0 rounded-full border border-royal/20 bg-white px-3 py-1.5 text-xs font-medium text-royal hover:bg-royal/5 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(input);
          }}
          className="flex items-center gap-2 border-t border-navy/10 bg-white px-4 py-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="כתבו שאלה ללב המעבר…"
            className="flex-1 rounded-xl border border-navy/10 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-royal/20"
          />
          <Button type="submit" size="md" className="!px-3.5">
            <Send size={17} />
          </Button>
        </form>
      </div>
    </div>
  );
}
