"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";

export default function StoreHydration({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    useAppStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-3 animate-fade-up">
          <div className="h-12 w-12 rounded-full border-4 border-lightblue border-t-royal animate-spin" />
          <p className="text-navy/60 text-sm">טוען את לב המעבר…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
