"use client"

import { ArrowUpDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const options = [
  ['featured', 'Featured'], ['newest', 'Newest arrivals'], ['price-asc', 'Price: Low to high'],
  ['price-desc', 'Price: High to low'], ['name', 'Name: A–Z'],
]

export function CatalogSort({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <Select value={value} onValueChange={onChange}>
    <SelectTrigger aria-label="Sort products" className="h-12! min-w-0 flex-1 rounded-xl border-input bg-card! px-3 text-card-foreground shadow-none hover:border-primary sm:w-60 sm:flex-none">
      <span className="flex min-w-0 items-center gap-2"><ArrowUpDown aria-hidden="true" className="h-4 w-4 shrink-0" /><span className="hidden text-muted-foreground sm:inline">Sort:</span><SelectValue /></span>
    </SelectTrigger>
    <SelectContent align="end" position="popper" className="z-[80] min-w-60 rounded-xl border-border bg-popover p-1.5 text-popover-foreground shadow-xl">
      {options.map(([key, label]) => <SelectItem key={key} value={key} className="min-h-11 cursor-pointer rounded-lg pr-9 pl-3 text-sm focus:bg-accent focus:text-accent-foreground data-[state=checked]:bg-accent data-[state=checked]:font-semibold data-[state=checked]:text-primary">{label}</SelectItem>)}
    </SelectContent>
  </Select>
}
