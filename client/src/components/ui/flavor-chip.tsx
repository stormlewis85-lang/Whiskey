import * as React from "react";
import { cn } from "@/lib/utils";

interface FlavorChipProps {
  label: string;
  value: string;
  selected: boolean;
  onToggle: (value: string) => void;
  colorHex?: string;
  disabled?: boolean;
}

export function FlavorChip({
  label,
  value,
  selected,
  onToggle,
  colorHex,
  disabled = false,
}: FlavorChipProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onToggle(value)}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
        "transition-all duration-200 ease-out",
        "border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        "active:scale-95",
        selected
          ? "bg-primary text-primary-foreground border-primary shadow-warm-sm"
          : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-accent/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {colorHex && (
        <span
          className={cn(
            "w-3 h-3 rounded-full flex-shrink-0 border",
            selected ? "border-primary-foreground/30" : "border-border"
          )}
          style={{ backgroundColor: colorHex }}
        />
      )}
      <span>{label}</span>
    </button>
  );
}

interface FlavorChipGroupProps {
  options: { value: string; label: string; hex?: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function FlavorChipGroup({
  options,
  selected,
  onToggle,
  className,
  disabled = false,
}: FlavorChipGroupProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <FlavorChip
          key={option.value}
          label={option.label}
          value={option.value}
          selected={selected.includes(option.value)}
          onToggle={onToggle}
          colorHex={option.hex}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

// Single selection variant
interface SingleFlavorChipGroupProps {
  options: { value: string; label: string; hex?: string }[];
  selected: string | undefined;
  onSelect: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function SingleFlavorChipGroup({
  options,
  selected,
  onSelect,
  className,
  disabled = false,
}: SingleFlavorChipGroupProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <FlavorChip
          key={option.value}
          label={option.label}
          value={option.value}
          selected={selected === option.value}
          onToggle={onSelect}
          colorHex={option.hex}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
