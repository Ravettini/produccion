import { cn } from "../../utils/cn";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="border-b border-slate-200 overflow-x-auto">
      <nav className="flex gap-1 min-w-0" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-3 sm:px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex-shrink-0",
              active === tab.id
                ? "bg-white border border-slate-200 border-b-white -mb-px text-gov-800"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
