import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { apiRequest } from "@/lib/queryClient"

interface Distillery {
  id: number
  name: string
  location: string | null
  country: string | null
  region: string | null
  type: string | null
  yearFounded: number | null
  parentCompany: string | null
  website: string | null
  description: string | null
}

interface DistilleryComboboxProps {
  value?: number | null
  onValueChange: (distilleryId: number | null, distillery?: Distillery) => void
  onAddNew?: () => void
  className?: string
  disabled?: boolean
}

export function DistilleryCombobox({
  value,
  onValueChange,
  onAddNew,
  className,
  disabled = false,
}: DistilleryComboboxProps) {
  // Fetch all distilleries
  const { data: distilleries = [], isLoading } = useQuery<Distillery[]>({
    queryKey: ["/api/distilleries"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/distilleries")
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })

  // Convert distilleries to combobox options
  const options: ComboboxOption[] = React.useMemo(() => {
    return distilleries.map((d) => ({
      value: String(d.id),
      label: d.name,
      description: [
        d.location,
        d.parentCompany ? `(${d.parentCompany})` : null,
      ]
        .filter(Boolean)
        .join(" "),
      metadata: d as unknown as Record<string, unknown>,
    }))
  }, [distilleries])

  const handleValueChange = (selectedValue: string, option?: ComboboxOption) => {
    if (!selectedValue) {
      onValueChange(null)
      return
    }

    const id = parseInt(selectedValue)
    const distillery = option?.metadata as unknown as Distillery | undefined
    onValueChange(id, distillery)
  }

  return (
    <Combobox
      options={options}
      value={value ? String(value) : undefined}
      onValueChange={handleValueChange}
      placeholder="Select distillery..."
      searchPlaceholder="Search distilleries..."
      emptyText="No distillery found."
      className={className}
      disabled={disabled}
      loading={isLoading}
      onAddNew={onAddNew}
      addNewText="+ Add new distillery"
    />
  )
}
