// components/ActionToolbar.tsx
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";
import { Search } from "lucide-react";

interface ActionToolbarProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  actions?: React.ReactNode;
  className?: string;
}

export default function ActionToolbar({
  searchTerm,
  onSearchChange,
  actions,
  className,
}: ActionToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between",
        className
      )}
    >
      {onSearchChange && (
        <div className="relative w-full lg:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 h-10 border-input focus:ring-2 focus:ring-ring"
            aria-label="Search"
          />
        </div>
      )}
      {actions && <div className="w-full lg:w-auto">{actions}</div>}
    </div>
  );
}
