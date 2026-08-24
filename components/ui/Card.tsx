import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white/90 backdrop-blur-sm shadow-card border border-navy/5 p-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-bold text-navy mb-3", className)} {...props}>
      {children}
    </h3>
  );
}
