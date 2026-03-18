import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

/**
 * Mobile-friendly Select that opens as a bottom sheet on all screen sizes.
 *
 * Props:
 *   value      - current selected value
 *   onChange   - (value) => void
 *   options    - [{ value, label }]
 *   placeholder - string shown when nothing selected
 *   className   - extra classes for the trigger button
 */
export default function MobileSelect({ value, onChange, options = [], placeholder = "Select…", className = "" }) {
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder;

  return (
    <>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={placeholder}
        onClick={() => setOpen(true)}
        className={`flex items-center justify-between gap-2 h-11 px-4 rounded-xl border bg-white border-slate-200 text-sm font-medium transition-colors active:bg-slate-50 ${className}`}
        style={{ color: "#1a2f42", minHeight: "44px", minWidth: "44px" }}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className="w-4 h-4 flex-shrink-0 text-slate-400" />
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[70vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-base" style={{ color: "#151528" }}>{placeholder}</DrawerTitle>
          </DrawerHeader>

          <div className="overflow-y-auto px-4 pb-8" role="listbox" aria-label={placeholder}>
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-4 rounded-xl mb-1 transition-colors text-left text-sm font-medium active:bg-slate-50"
                  style={{
                    minHeight: 52,
                    background: isSelected ? "rgba(124,111,224,0.08)" : "transparent",
                    color: isSelected ? "#7C6FE0" : "#1a2f42",
                    border: isSelected ? "1px solid rgba(124,111,224,0.25)" : "1px solid transparent",
                  }}
                >
                  {opt.label}
                  {isSelected && <Check className="w-4 h-4 text-[#7C6FE0]" />}
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}