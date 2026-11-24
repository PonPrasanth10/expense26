import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="main-content" id="main-content" tabIndex={-1}>
        {children}
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
