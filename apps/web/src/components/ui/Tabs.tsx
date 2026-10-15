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
  panelId?: string;
}

export function Tabs({ tabs, active, onChange, variant = "pills", panelId }: TabsProps) {
  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    onChange(tabs[next].id);
    const buttons = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role=tab]");
    buttons?.[next]?.focus();
  };
  if (variant === "pills") {
    return (
      <div className="bg-slate-100/80 p-1 rounded-xl inline-flex gap-1 overflow-x-auto max-w-full">
        <nav className="flex gap-1 min-w-0" role="tablist">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active === tab.id}
              aria-controls={panelId}
              tabIndex={active === tab.id ? 0 : -1}
              onKeyDown={(event) => onKeyDown(event, index)}
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
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            aria-controls={panelId}
            tabIndex={active === tab.id ? 0 : -1}
            onKeyDown={(event) => onKeyDown(event, index)}
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
