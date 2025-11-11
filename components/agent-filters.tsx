"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface AgentFiltersProps {
  categoryFilter: string
  onCategoryChange: (value: string) => void
}

export function AgentFilters({ categoryFilter, onCategoryChange }: AgentFiltersProps) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="category">Filtrar por Categoria</Label>
        <Select value={categoryFilter} onValueChange={onCategoryChange}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            <SelectItem value="Ato 01">Ato 01</SelectItem>
            <SelectItem value="Ato 02">Ato 02</SelectItem>
            <SelectItem value="Ato 03">Ato 03</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
