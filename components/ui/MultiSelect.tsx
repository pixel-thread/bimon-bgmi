// components/ui/MultiSelect.tsx
import { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  isMulti?: boolean;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  isMulti = false,
  className = "",
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter options based on search
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) setSearch(""); // Reset search when opening
  };

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map((option) => option.value));
    }
  };

  const handleClearSelection = () => {
    onChange([]);
  };

  const handleOptionChange = (value: string) => {
    if (isMulti) {
      if (selected.includes(value)) {
        onChange(selected.filter((item) => item !== value));
      } else {
        onChange([...selected, value]);
      }
    } else {
      onChange([value]);
      setIsOpen(false);
    }
  };

  const handleRemoveSelected = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  return (
    <div className={"relative w-full" + " " + className} ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <div
        className="flex items-center justify-between w-full p-2 border border-slate-300 rounded-md cursor-pointer bg-white"
        onClick={toggleDropdown}
      >
        <span className="text-sm">
          {selected.length > 0 ? `${selected.length} selected` : placeholder}
        </span>
        {isOpen ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
      </div>

      {/* Selected Players as Chips */}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((value) => {
            const option = options.find((opt) => opt.value === value);
            return (
              <div
                key={value}
                className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                <span>{option?.label}</span>
                <FiX
                  className="h-4 w-4 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent dropdown from toggling
                    handleRemoveSelected(value);
                  }}
                />
              </div>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation(); // Prevent dropdown from toggling
              handleClearSelection();
            }}
            className="ml-2"
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-[512px] overflow-y-auto">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-200">
            <Input
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full"
              onClick={(e) => e.stopPropagation()} // Prevent dropdown from closing
            />
          </div>
          {/* Select All Option */}
          {isMulti && (
            <div className="p-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selected.length === options.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm">Select All ({options.length} players)</span>
              </div>
            </div>
          )}
          {/* Options List */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-center gap-2 p-2 hover:bg-slate-100 cursor-pointer"
                onClick={() => handleOptionChange(option.value)}
              >
                {isMulti && (
                  <Checkbox
                    checked={selected.includes(option.value)}
                    onCheckedChange={() => handleOptionChange(option.value)}
                  />
                )}
                <span className="text-sm">{option.label}</span>
              </div>
            ))
          ) : (
            <div className="p-2 text-sm text-gray-500">No players found.</div>
          )}
        </div>
      )}
    </div>
  );
}