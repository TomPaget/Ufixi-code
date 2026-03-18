import React, { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

/**
 * Mobile-first Select component using bottom sheet drawer
 * Replaces standard HTML select and radix Select for better mobile experience
 * 
 * Props:
 *   value       - Current selected value
 *   onChange    - (value) => void callback
 *   options     - Array of { value, label, description? }
 *   placeholder - Placeholder text
 *   label       - Optional label above trigger
 *   className   - Extra classes for trigger button
 *   disabled    - Disable the select
 *   searchable  - Enable search in bottom sheet
 */
export default function SelectBottomSheet({
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  label,
  className = "",
  disabled = false,
  searchable = true
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = options.find((o) => o.value === value);
  const selectedLabel = selectedOption?.label ?? placeholder;

  const filteredOptions = searchable
    ? options.filter((opt) =>
        (opt.label + (opt.description || ""))
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : options;

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-slate-900 mb-2">
          {label}
        </label>
      )}

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={placeholder}
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className={cn(
          "w-full flex items-center justify-between gap-2 rounded-lg border bg-white px-4 py-3 text-sm font-medium text-slate-900 transition-colors",
          "hover:bg-slate-50 active:bg-slate-100",
          "disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0",
          "border-slate-200",
          className
        )}
        style={{ minHeight: 44 }}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 flex-shrink-0 text-slate-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[70vh]">
          <DrawerHeader className="pb-3 border-b border-slate-200">
            <DrawerTitle className="text-base text-slate-900">
              {placeholder}
            </DrawerTitle>

            {searchable && (
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mt-3 w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            )}
          </DrawerHeader>

          <div
            className="overflow-y-auto px-4 pb-6 pt-4"
            role="listbox"
            aria-label={placeholder}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg mb-2 transition-colors text-left text-sm font-medium",
                      "active:bg-slate-100",
                      isSelected
                        ? "bg-blue-50 text-blue-600 border border-blue-200"
                        : "bg-slate-50 text-slate-900 border border-transparent hover:bg-slate-100"
                    )}
                    style={{ minHeight: 52 }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{opt.label}</div>
                      {opt.description && (
                        <div className="text-xs text-slate-600 mt-0.5 truncate">
                          {opt.description}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check className="w-5 h-5 flex-shrink-0 text-blue-600" />}
                  </button>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                No options found
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}