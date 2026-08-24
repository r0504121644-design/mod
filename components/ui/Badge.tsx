import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type Tone = "navy" | "royal" | "turquoise" | "gold" | "green" | "red" | "gray";

const tones: Record<Tone, string> = {
  navy: "bg-navy/10 text-navy",
  royal: "bg-royal/10 text-royal",
  turquoise: "bg-turquoise/10 text-turquoise",
  gold: "bg-amber/15 text-gold",
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-600",
  gray: "bg-gray-100 text-gray-600",
};

export function Badge({
  tone = "navy",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function PremiumBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-gold-gradient px-2.5 py-1 text-xs font-bold text-white shadow-glow",
        className
      )}
    >
      ✦ פרימיום
    </span>
  );
}
