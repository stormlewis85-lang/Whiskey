import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
  description?: string
  metadata?: Record<string, unknown>
}

interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange: (value: string, option?: ComboboxOption) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  loading?: boolean
  onAddNew?: () => void
  addNewText?: string
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  disabled = false,
  loading = false,
  onAddNew,
  addNewText = "Add new",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedOption = options.find((option) => option.value === value)

  // Filter options based on search
  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    const lowerSearch = search.toLowerCase()
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(lowerSearch) ||
        option.description?.toLowerCase().includes(lowerSearch)
    )
  }, [options, search])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled || loading}
        >
          {loading ? (
            <span className="text-muted-foreground">Loading...</span>
          ) : selectedOption ? (
            <span className="truncate">{selectedOption.label}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {emptyText}
              {onAddNew && (
                <Button
                  variant="ghost"
                  className="mt-2 w-full"
                  onClick={() => {
                    setOpen(false)
                    onAddNew()
                  }}
                >
                  {addNewText}
                </Button>
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onValueChange(option.value, option)
                    setOpen(false)
                    setSearch("")
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
              {onAddNew && filteredOptions.length > 0 && (
                <CommandItem
                  onSelect={() => {
                    setOpen(false)
                    setSearch("")
                    onAddNew()
                  }}
                  className="cursor-pointer border-t"
                >
                  <span className="text-foreground">{addNewText}</span>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
