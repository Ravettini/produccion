import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { cn } from "../../utils/cn";
import { useAuth } from "../../hooks/useAuth";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const { user, loading, isAdmin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600 animate-pulse" />
          <p className="text-slate-500 text-sm">Cargando…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-surface">
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <Sidebar
        isAdmin={isAdmin}
        userName={user.name}
        userRole={user.role}
        onLogout={logout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden sticky top-0 z-30 h-14 flex items-center gap-3 px-4 border-b border-slate-200 bg-white/90 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-1 rounded-xl hover:bg-slate-100 text-slate-600"
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-semibold text-slate-800 truncate">Eventos institucionales</span>
        </div>
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
