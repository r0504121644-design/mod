"use client";

import { HeartHandshake } from "lucide-react";
import { useAppStore } from "@/lib/store";

export function AgentFAB() {
  const openAgentDrawer = useAppStore((s) => s.openAgentDrawer);
  const isOpen = useAppStore((s) => s.isAgentDrawerOpen);

  if (isOpen) return null;

  return (
    <button
      onClick={openAgentDrawer}
      className="fixed bottom-20 lg:bottom-8 start-4 lg:start-8 z-40 flex items-center gap-2.5 rounded-full bg-royal-gradient px-5 py-3.5 text-white shadow-glow hover:brightness-110 active:scale-95 transition-all"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber" />
      </span>
      <HeartHandshake size={20} />
      <span className="text-sm font-bold">שאלו את לב המעבר</span>
    </button>
  );
}
