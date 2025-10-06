// components/MatchDropdown.tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { ChevronDown } from "lucide-react";

interface MatchDropdownProps {
  selected?: string; // Optional, default to ""
  options: string[];
  onSelect: (value: string) => void;
  onAddMatch?: () => void;
  className?: string;
  disabled?: boolean;
}

export function MatchDropdown({
  selected = "",
  options,
  onSelect,
  onAddMatch,
  className,
  disabled,
}: MatchDropdownProps) {
  // If selected is "" or "0", display "Select Match"
  const displayLabel =
    !selected || selected === "0"
      ? "Select Match"
      : selected === "All"
      ? "All Matches"
      : `Match ${selected}`;

  // Compact label for small screens
  const compactLabel =
    !selected || selected === "0"
      ? "Sel"
      : selected === "All"
      ? "All"
      : `M${selected}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`flex justify-between items-center ${className || "w-24"}`}
          disabled={disabled}
        >
          <span className="truncate">
            <span className="hidden sm:inline">{displayLabel}</span>
            <span className="sm:hidden">{compactLabel}</span>
          </span>
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
        <DropdownMenuLabel>Select Match</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => onSelect(option)}
            className="cursor-pointer"
          >
            {option === "All" ? "All Matches" : `Match ${option}`}
          </DropdownMenuItem>
        ))}
        {onAddMatch && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onAddMatch}
              className="cursor-pointer text-blue-600 font-medium"
            >
              Add Match
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
