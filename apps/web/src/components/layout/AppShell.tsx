import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppShell() {
  const { user, loading, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-600">Cargando…</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Overlay móvil cuando sidebar abierto */}
      <div
        className={`
          fixed inset-0 z-40 bg-black/50 lg:hidden
          ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
          transition-opacity
        `}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <Sidebar isAdmin={isAdmin} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
