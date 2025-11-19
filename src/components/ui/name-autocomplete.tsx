"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import { Input } from "@/src/components/ui/input";
// Avatar display removed for performance
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/src/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  calculateRemainingBanDuration,
  formatRemainingBanDuration,
} from "@/src/utils/banUtils";
import { ChevronDown, Loader2, Search, X } from "lucide-react";
import { useTournaments } from "@/src/hooks/tournament/useTournaments";

export interface NameAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  onPlayerSelect: (player: any | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export function NameAutocomplete({
  value,
  onValueChange,
  onPlayerSelect,
  placeholder = "Search for a player...",
  disabled = false,
  className,
  error,
}: NameAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = React.useState<any | null>(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [suggestionCache, setSuggestionCache] = React.useState<
    Record<string, any[]>
  >({});

  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const { data: tournaments } = useTournaments();

  const fetchSuggestions = React.useCallback(
    async (query: string) => {
      // Require minimum 2 characters to reduce unnecessary API calls
      if (!query.trim() || query.trim().length < 2) {
        setSuggestions([]);
        setFetchError(null);
        setLoading(false);
        return;
      }

      // Check cache first
      if (suggestionCache[query]) {
        setSuggestions(suggestionCache[query]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setFetchError(null);
    },
    [suggestionCache],
  );

  React.useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Increased debounce delay to reduce API calls and improve performance
    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 400); // Increased from 200ms to 400ms

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [value, fetchSuggestions]);

  React.useEffect(() => {
    if (selectedPlayer && selectedPlayer.name !== value) {
      setSelectedPlayer(null);
      onPlayerSelect(null);
    }
  }, [value, selectedPlayer, onPlayerSelect]);

  const handleInputChange = (newValue: string) => {
    onValueChange(newValue);
    setOpen(!!newValue.trim());
    setHighlightedIndex(-1);
  };

  const handlePlayerSelect = (player: any) => {};

  const handleClear = () => {
    onValueChange("");
    setSelectedPlayer(null);
    onPlayerSelect(null);
    setSuggestions([]);
    setOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" && !open && suggestions.length > 0) {
      setOpen(true);
      setHighlightedIndex(0);
      e.preventDefault();
      return;
    }

    if (!open) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handlePlayerSelect(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setHighlightedIndex(-1);
        handleClear();
        break;
    }
  };

  const handleInputFocus = () => {
    if (value.trim() && suggestions.length > 0) {
      setOpen(true);
    }
  };

  return (
    <div className={cn("relative space-y-2 w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative flex items-center w-full">
            <div className="absolute left-3 pointer-events-none">
              <Search
                className="h-4 w-4 text-gray-400 dark:text-gray-300"
                aria-hidden="true"
              />
            </div>
            <Input
              ref={inputRef}
              value={value}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "pl-10 pr-20 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium transition-all duration-300 ease-in-out w-full",
                error && "border-red-400 focus:ring-red-400",
                "focus:ring-2 focus:ring-offset-1 focus:ring-blue-400",
                "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400",
                error && "dark:border-red-400 dark:focus:ring-red-400",
                "dark:focus:ring-blue-400 dark:focus:ring-offset-gray-800",
              )}
              autoComplete="off"
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-describedby={error ? "name-error" : undefined}
            />
            <div className="absolute right-2 flex items-center space-x-1">
              {value && !disabled && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 dark:focus:ring-offset-gray-800 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 text-gray-500 dark:text-gray-300" />
                </button>
              )}
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500 dark:text-blue-400" />
              ) : (
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-gray-400 transition-transform duration-200 dark:text-gray-300",
                    open && "rotate-180",
                  )}
                />
              )}
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-full max-w-[min(100%,400px)] p-0 rounded-lg bg-white shadow-xl border border-gray-200 animate-in fade-in-10 zoom-in-95 duration-200 dark:bg-gray-800 dark:border-gray-600"
          align="start"
          sideOffset={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandList id="player-suggestions">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500 dark:text-blue-400 mb-2" />
                  <span className="text-sm text-gray-500 dark:text-gray-300">
                    Searching players...
                  </span>
                  <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 mt-2">
                    <div
                      className="h-1 bg-blue-500 dark:bg-blue-400 animate-pulse transition-all duration-1000"
                      style={{ width: "60%" }}
                    />
                  </div>
                </div>
              ) : fetchError ? (
                <div className="py-6 px-4 text-center text-sm text-red-500 dark:text-red-400">
                  {fetchError}
                  <button
                    className="mt-2 text-blue-500 hover:underline text-xs dark:text-blue-400 dark:hover:underline"
                    onClick={() => fetchSuggestions(value)}
                  >
                    Retry
                  </button>
                </div>
              ) : suggestions.length === 0 ? (
                <CommandEmpty className="py-6 px-4 text-center text-sm text-gray-500 dark:text-gray-300">
                  {value.trim() ? (
                    <>
                      No players found for "{value}".
                      <button
                        className="mt-2 text-blue-500 hover:underline text-xs dark:text-blue-400 dark:hover:underline"
                        onClick={() => inputRef.current?.focus()}
                      >
                        Try another search
                      </button>
                    </>
                  ) : (
                    "Start typing to search for players..."
                  )}
                </CommandEmpty>
              ) : (
                <CommandGroup className="max-h-64 overflow-y-auto">
                  {suggestions.map((player, index) => (
                    <CommandItem
                      key={player.id}
                      value={player.name}
                      onSelect={() => handlePlayerSelect(player)}
                      className={cn(
                        "flex items-center space-x-4 py-3 px-4 transition-colors duration-150 cursor-pointer",
                        player.isBanned
                          ? "bg-red-50 border-l-4 border-red-400 dark:bg-red-900/20"
                          : "",
                        index === highlightedIndex
                          ? player.isBanned
                            ? "bg-red-100 text-red-900 dark:bg-red-800 dark:text-red-100"
                            : "bg-blue-50 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                          : "text-gray-900 dark:text-gray-200",
                        player.isBanned
                          ? "hover:bg-red-100 dark:hover:bg-red-800"
                          : "hover:bg-blue-50 dark:hover:bg-blue-900",
                      )}
                      role="option"
                      aria-selected={index === highlightedIndex}
                    >
                      <div className="space-y-0.5">
                        <div
                          className={cn(
                            "font-medium text-sm",
                            player.isBanned && "text-red-700 dark:text-red-300",
                          )}
                        >
                          <span className="truncate">{player.name}</span>
                          {player.isBanned && (
                            <span className="ml-2 text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded-full font-semibold"></span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {player.category}
                          {player.isBanned && player.banReason && (
                            <span className="ml-2 italic text-red-600 dark:text-red-400">
                              • {player.banReason}
                            </span>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && (
        <p id="name-error" className="text-xs text-red-500 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
