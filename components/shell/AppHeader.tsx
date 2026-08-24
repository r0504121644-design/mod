"use client";

import { HeartHandshake, Sparkles } from "lucide-react";
import { useAppStore, getMemberById } from "@/lib/store";
import { PremiumBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const familySpace = useAppStore((s) => s.familySpace);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const isPremium = useAppStore((s) => s.isPremium);
  const openSubscriptionModal = useAppStore((s) => s.openSubscriptionModal);
  const me = getMemberById(familySpace.members, currentUserId);

  return (
    <header className="border-b border-navy/10 bg-white/70 backdrop-blur-sm">
      <div className="hidden lg:flex items-center justify-between gap-3 px-6 py-2.5 text-xs text-navy/50 border-b border-navy/5">
        <span className="flex items-center gap-1.5">
          <HeartHandshake size={13} className="text-turquoise" />
          בכל מצב שמשתנה, יש מי שמלווה.
        </span>
        <span>בינה מעברית™</span>
      </div>
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6 py-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-navy">{title}</h1>
          {subtitle && <p className="text-sm text-navy/50 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {isPremium ? (
            <PremiumBadge />
          ) : (
            <button
              onClick={openSubscriptionModal}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-gold hover:bg-amber-100 transition-colors"
            >
              <Sparkles size={13} />
              פתיחת לב המעבר
            </button>
          )}
          {me && <Avatar initial={me.avatarInitial} color={me.color} size={36} />}
        </div>
      </div>
    </header>
  );
}
