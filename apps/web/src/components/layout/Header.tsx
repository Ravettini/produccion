import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const routeTitles: Record<string, string> = {
  "/": "Eventos",
  "/calendar": "Calendario",
  "/admin": "Administración",
  "/events/new": "Nuevo evento",
};

function getTitle(pathname: string): string | undefined {
  if (routeTitles[pathname]) return routeTitles[pathname];
  if (pathname.startsWith("/events/") && pathname.endsWith("/edit")) return "Editar evento";
  if (pathname.startsWith("/events/")) return "Detalle del evento";
  if (pathname.startsWith("/proposals/")) return "Detalle de propuesta";
  return undefined;
}

export function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const title = getTitle(pathname);

  return (
    <header className="h-14 flex-shrink-0 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-600"
          aria-label="Abrir menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link to="/" className="font-semibold text-slate-800 truncate text-sm sm:text-base">
          Gestión de Eventos
        </Link>
        {title && (
          <span className="text-slate-500 text-sm hidden sm:inline truncate">— {title}</span>
        )}
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <span
          className="text-slate-600 text-xs sm:text-sm truncate max-w-[80px] sm:max-w-[140px]"
          title={`${user?.name} (${user?.role})`}
        >
          {user?.name}
        </span>
        <button
          type="button"
          onClick={logout}
          className="text-slate-500 hover:text-slate-800 text-xs sm:text-sm font-medium whitespace-nowrap"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
