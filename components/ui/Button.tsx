import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "gold" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: "bg-royal text-white hover:bg-royal/90 shadow-soft",
  gold: "bg-gold-gradient text-white hover:brightness-105 shadow-glow",
  secondary: "bg-lightblue text-royal hover:bg-lightblue/70",
  ghost: "bg-transparent text-navy hover:bg-navy/5",
  danger: "bg-red-50 text-red-600 hover:bg-red-100",
};

const sizes: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 rounded-lg",
  md: "text-sm px-4 py-2.5 rounded-xl",
  lg: "text-base px-6 py-3 rounded-2xl",
};

export function Button({ variant = "primary", size = "md", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
