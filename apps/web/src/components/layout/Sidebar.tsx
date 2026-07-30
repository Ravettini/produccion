import { NavLink } from "react-router-dom";
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  X,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { RoleBadge } from "../ui/RoleBadge";
import type { Role } from "../../types";

const navItems = [
  { to: "/", label: "Eventos", icon: LayoutDashboard, end: true },
  { to: "/calendar", label: "Calendario", icon: CalendarDays, end: false },
];

interface SidebarProps {
  isAdmin: boolean;
  userName?: string;
  userRole?: Role | string;
  onLogout: () => void;
  open?: boolean;
  onClose?: () => void;
  /** Cantidad de eventos que esperan una acción del usuario. */
  pendingCount?: number;
}

export function Sidebar({
  isAdmin,
  userName,
  userRole,
  onLogout,
  open = false,
  onClose,
  pendingCount = 0,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "w-64 flex-shrink-0 bg-sidebar text-white z-50 flex flex-col",
        "fixed inset-y-0 left-0 h-screen max-h-screen transform transition-transform duration-300 ease-out",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Brand */}
      <div className="px-5 py-5 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-900/30">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">Eventos</p>
            <p className="text-xs text-slate-400 truncate">Gestión institucional</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-sidebar-hover"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-brand-600/20 text-white ring-1 ring-brand-500/30"
                  : "text-slate-400 hover:text-white hover:bg-sidebar-hover"
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0 opacity-80" aria-hidden />
            <span className="flex-1">{item.label}</span>
            {item.to === "/" && pendingCount > 0 && (
              <span
                className="inline-flex min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-slate-900"
                title={`${pendingCount} evento(s) esperan una acción tuya`}
              >
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-brand-600/20 text-white ring-1 ring-brand-500/30"
                  : "text-slate-400 hover:text-white hover:bg-sidebar-hover"
              )
            }
          >
            <Settings className="w-5 h-5 flex-shrink-0 opacity-80" aria-hidden />
            Administración
          </NavLink>
        )}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="rounded-xl bg-sidebar-hover/80 p-3 mb-2">
          <p className="text-sm font-medium text-white truncate">{userName ?? "Usuario"}</p>
          {userRole && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <RoleBadge role={userRole} />
              {userRole === "ADMIN" && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                  <Shield className="w-3 h-3" aria-hidden />
                  Aprobar / Rechazar
                </span>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-sidebar-hover transition-colors"
        >
          <LogOut className="w-4 h-4" aria-hidden />
          Salir
        </button>
      </div>
    </aside>
  );
}
