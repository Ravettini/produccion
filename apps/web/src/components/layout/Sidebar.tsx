import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";

const navItems = [
  { to: "/", label: "Eventos" },
  { to: "/calendar", label: "Calendario" },
];

export function Sidebar({
  isAdmin,
  open = false,
  onClose,
}: {
  isAdmin: boolean;
  open?: boolean;
  onClose?: () => void;
}) {
  return (
    <aside
      className={cn(
        "w-56 flex-shrink-0 border-r border-slate-200 bg-white z-50",
        "lg:static lg:translate-x-0 lg:transition-none",
        "fixed inset-y-0 left-0 transform transition-transform duration-200 ease-out",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-gov-50 text-gov-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink
            to="/admin"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-gov-50 text-gov-800"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              )
            }
          >
            Administración
          </NavLink>
        )}
      </nav>
    </aside>
  );
}
