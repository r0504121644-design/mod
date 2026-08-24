"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./navConfig";
import { cn } from "@/lib/cn";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-navy/10 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-6">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-royal" : "text-navy/40"
              )}
            >
              <Icon size={20} />
              <span className="leading-none text-center">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
