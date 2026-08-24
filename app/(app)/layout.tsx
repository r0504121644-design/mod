import { Sidebar } from "@/components/shell/Sidebar";
import { BottomNav } from "@/components/shell/BottomNav";
import { Footer } from "@/components/shell/Footer";
import { AgentFAB } from "@/components/shell/AgentFAB";
import { AgentDrawer } from "@/components/agent/AgentDrawer";
import { SubscriptionModal } from "@/components/agent/SubscriptionModal";
import { AuthGuard } from "@/components/shell/AuthGuard";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <main className="flex-1 pb-24 lg:pb-0">{children}</main>
          <Footer />
        </div>
      </div>
      <BottomNav />
      <AgentFAB />
      <AgentDrawer />
      <SubscriptionModal />
    </AuthGuard>
  );
}
