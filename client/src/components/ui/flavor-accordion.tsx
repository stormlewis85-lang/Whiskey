import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { FlavorChipGroup } from "./flavor-chip";
import { motion, AnimatePresence } from "framer-motion";

// Category icons as emoji for simplicity and universal support
const CATEGORY_ICONS: Record<string, string> = {
  sweet: "🍯",
  spice: "🌶️",
  fruit: "🍎",
  wood: "🪵",
  grain: "🌾",
  floral: "🌸",
  other: "✨",
};

interface FlavorCategory {
  id: string;
  label: string;
  icon?: string;
  options: { value: string; label: string }[];
}

interface FlavorAccordionProps {
  categories: FlavorCategory[];
  selected: string[];
  onToggle: (value: string) => void;
  className?: string;
  defaultOpen?: string[];
}

export function FlavorAccordion({
  categories,
  selected,
  onToggle,
  className,
  defaultOpen = [],
}: FlavorAccordionProps) {
  const [openCategories, setOpenCategories] = useState<string[]>(defaultOpen);

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const getSelectedCount = (category: FlavorCategory) => {
    return category.options.filter((opt) => selected.includes(opt.value)).length;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {categories.map((category) => {
        const isOpen = openCategories.includes(category.id);
        const selectedCount = getSelectedCount(category);
        const icon = category.icon || CATEGORY_ICONS[category.id] || CATEGORY_ICONS.other;

        return (
          <div
            key={category.id}
            className="border border-border/50 rounded-lg overflow-hidden bg-card/50"
          >
            {/* Accordion Header */}
            <button
              type="button"
              onClick={() => toggleCategory(category.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3",
                "text-left transition-colors hover:bg-accent/50",
                isOpen && "bg-accent/30"
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg" role="img" aria-label={category.label}>
                  {icon}
                </span>
                <span className="font-medium text-foreground">{category.label}</span>
                {selectedCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground">
                    {selectedCount}
                  </span>
                )}
              </div>
              <ChevronDown
                className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>

            {/* Accordion Content */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-2">
                    <FlavorChipGroup
                      options={category.options}
                      selected={selected}
                      onToggle={onToggle}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// Pre-configured accordion for the standard aroma/flavor categories
interface StandardFlavorAccordionProps {
  selected: string[];
  onToggle: (value: string) => void;
  className?: string;
}

export function StandardFlavorAccordion({
  selected,
  onToggle,
  className,
}: StandardFlavorAccordionProps) {
  const categories: FlavorCategory[] = [
    {
      id: "sweet",
      label: "Sweet",
      icon: "🍯",
      options: [
        { value: "vanilla", label: "Vanilla" },
        { value: "caramel", label: "Caramel" },
        { value: "butterscotch", label: "Butterscotch" },
        { value: "honey", label: "Honey" },
        { value: "maple", label: "Maple" },
        { value: "brown-sugar", label: "Brown Sugar" },
        { value: "toffee", label: "Toffee" },
        { value: "molasses", label: "Molasses" },
        { value: "chocolate", label: "Chocolate" },
      ],
    },
    {
      id: "spice",
      label: "Spice",
      icon: "🌶️",
      options: [
        { value: "cinnamon", label: "Cinnamon" },
        { value: "clove", label: "Clove" },
        { value: "nutmeg", label: "Nutmeg" },
        { value: "allspice", label: "Allspice" },
        { value: "pepper", label: "Pepper" },
        { value: "ginger", label: "Ginger" },
        { value: "anise", label: "Anise" },
        { value: "licorice", label: "Licorice" },
        { value: "cardamom", label: "Cardamom" },
      ],
    },
    {
      id: "fruit",
      label: "Fruit",
      icon: "🍎",
      options: [
        { value: "apple", label: "Apple" },
        { value: "pear", label: "Pear" },
        { value: "banana", label: "Banana" },
        { value: "cherry", label: "Cherry" },
        { value: "orange", label: "Orange" },
        { value: "lemon", label: "Lemon" },
        { value: "apricot", label: "Apricot" },
        { value: "peach", label: "Peach" },
        { value: "raisin", label: "Raisin" },
        { value: "plum", label: "Plum" },
        { value: "fig", label: "Fig" },
      ],
    },
    {
      id: "wood",
      label: "Wood & Smoke",
      icon: "🪵",
      options: [
        { value: "oak", label: "Oak" },
        { value: "cedar", label: "Cedar" },
        { value: "tobacco", label: "Tobacco" },
        { value: "leather", label: "Leather" },
        { value: "toasted-wood", label: "Toasted Wood" },
        { value: "char", label: "Char" },
        { value: "smoke", label: "Smoke" },
        { value: "sandalwood", label: "Sandalwood" },
        { value: "sawdust", label: "Sawdust" },
      ],
    },
    {
      id: "grain",
      label: "Grain & Cereal",
      icon: "🌾",
      options: [
        { value: "corn", label: "Corn" },
        { value: "rye", label: "Rye" },
        { value: "wheat", label: "Wheat" },
        { value: "barley", label: "Barley" },
        { value: "malt", label: "Malt" },
        { value: "cereal", label: "Cereal" },
        { value: "bread", label: "Bread" },
        { value: "toast", label: "Toast" },
        { value: "popcorn", label: "Popcorn" },
      ],
    },
  ];

  return (
    <FlavorAccordion
      categories={categories}
      selected={selected}
      onToggle={onToggle}
      className={className}
    />
  );
}
