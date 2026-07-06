import { cn } from "../../utils/cn";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  variant?: "underline" | "pills";
}

export function Tabs({ tabs, active, onChange, variant = "pills" }: TabsProps) {
  if (variant === "pills") {
    return (
      <div className="bg-slate-100/80 p-1 rounded-xl inline-flex gap-1 overflow-x-auto max-w-full">
        <nav className="flex gap-1 min-w-0" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active === tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap",
                active === tab.id
                  ? "bg-white text-brand-700 shadow-sm ring-1 ring-slate-200/80"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="border-b border-slate-200 overflow-x-auto">
      <nav className="flex gap-6 min-w-0" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px",
              active === tab.id
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
