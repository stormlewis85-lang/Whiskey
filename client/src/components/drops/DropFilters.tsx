import { useState } from "react";

const filters = ["All Drops", "Wishlist Matches", "Bourbon", "Scotch", "Allocated"];

interface DropFiltersProps {
  onFilterChange?: (filter: string) => void;
}

export function DropFilters({ onFilterChange }: DropFiltersProps) {
  const [activeFilter, setActiveFilter] = useState("All Drops");

  const handleClick = (filter: string) => {
    setActiveFilter(filter);
    onFilterChange?.(filter);
  };

  return (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-hide"
      style={{ padding: "0 20px 16px" }}
    >
      {filters.map((filter) => {
        const isActive = activeFilter === filter;
        return (
          <button
            key={filter}
            onClick={() => handleClick(filter)}
            className={`whitespace-nowrap font-medium border-none cursor-pointer transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
            style={{
              padding: "8px 16px",
              background: isActive
                ? "rgba(212,164,76,0.15)"
                : "hsl(var(--popover))",
              border: isActive
                ? "1px solid rgba(212,164,76,0.3)"
                : "1px solid rgba(255,255,255,0.06)",
              borderRadius: "20px",
              fontSize: "0.7rem",
            }}
          >
            {filter}
          </button>
        );
      })}
    </div>
  );
}
