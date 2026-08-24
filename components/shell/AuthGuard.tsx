"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const hasCompletedOnboarding = useAppStore((s) => s.hasCompletedOnboarding);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/welcome");
    } else if (!hasCompletedOnboarding) {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, hasCompletedOnboarding, router]);

  if (!isAuthenticated || !hasCompletedOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-10 w-10 rounded-full border-4 border-lightblue border-t-royal animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
