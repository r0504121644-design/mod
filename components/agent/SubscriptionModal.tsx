"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/lib/store";
import { Sparkles, Check, HeartHandshake } from "lucide-react";

const PERKS = [
  "סיכומים חכמים של מדדים ומגמות בריאות",
  "ניסוח שאלות מותאם לקראת כל תור רופא",
  "איתור פערים ואיזון הוגן של תורנויות",
  "התראות מלאי תרופות ומועדי חידוש מרשם",
];

export function SubscriptionModal() {
  const isOpen = useAppStore((s) => s.isSubscriptionModalOpen);
  const close = useAppStore((s) => s.closeSubscriptionModal);
  const setPremium = useAppStore((s) => s.setPremium);

  return (
    <Modal open={isOpen} onClose={close} maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center gap-4 pt-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-gradient text-white shadow-glow">
          <HeartHandshake size={28} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-navy">פתיחת לב המעבר</h3>
          <p className="mt-1.5 text-sm text-navy/60 leading-relaxed">
            הצטרפות רגועה ומכובדת לליווי חכם יותר עבור כל המשפחה — בקצב שלכם, בלי לחץ.
          </p>
        </div>

        <ul className="w-full space-y-2.5 text-start">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-2.5 text-sm text-navy/75">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-turquoise/15 text-turquoise">
                <Check size={13} />
              </span>
              {perk}
            </li>
          ))}
        </ul>

        <div className="w-full rounded-xl bg-cream border border-amber-100 px-4 py-3 text-xs text-navy/50">
          ניתן לבטל בכל עת. אין התחייבות. זהו שירות ליווי וארגון — לא ייעוץ רפואי או משפטי.
        </div>

        <div className="flex w-full flex-col gap-2">
          <Button
            variant="gold"
            size="lg"
            className="w-full"
            onClick={() => {
              setPremium(true);
              close();
            }}
          >
            <Sparkles size={17} />
            פתיחת לב המעבר פרימיום
          </Button>
          <Button variant="ghost" size="md" className="w-full" onClick={close}>
            אולי בפעם אחרת
          </Button>
        </div>
      </div>
    </Modal>
  );
}
