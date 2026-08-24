"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./navConfig";
import { cn } from "@/lib/cn";
import { HeartHandshake } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-e border-navy/10 bg-white/70 backdrop-blur-sm px-4 py-6">
      <div className="mb-8 flex items-center gap-2.5 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal-gradient text-white shadow-soft">
          <HeartHandshake size={22} />
        </div>
        <div>
          <p className="text-sm font-bold text-navy leading-tight">לב המעבר</p>
          <p className="text-[11px] text-navy/45 leading-tight">בינה מעברית™</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-royal text-white shadow-soft" : "text-navy/70 hover:bg-navy/5"
              )}
            >
              <Icon size={19} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
