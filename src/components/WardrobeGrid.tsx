'use client'

import { useState } from 'react'
import { Shirt, Droplets } from 'lucide-react'
import { ItemCard } from './ItemCard'
import type { ClothingItem, Category } from '@/lib/db'
import { CATEGORY_LABELS } from '@/lib/outfit-utils'
import { cn } from '@/lib/utils'

const categories: (Category | 'all')[] = [
  'all', 'top', 'bottom', 'dress', 'outerwear', 'shoes', 'bag', 'accessory', 'other',
]

interface Props {
  items: ClothingItem[]
  onItemClick?: (item: ClothingItem) => void
  onToggleLaundry?: (id: string) => void
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectToggle?: (id: string) => void
}

export function WardrobeGrid({
  items,
  onItemClick,
  onToggleLaundry,
  selectable,
  selectedIds,
  onSelectToggle,
}: Props) {
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all')
  const [showDirty, setShowDirty] = useState(true)

  const filtered = items.filter((i) => {
    if (!showDirty && i.laundryStatus === 'dirty') return false
    if (categoryFilter !== 'all' && i.category !== categoryFilter) return false
    return true
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategoryFilter(c)}
            className={cn(
              'press-sm shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              categoryFilter === c
                ? 'bg-foreground text-background'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
          </button>
        ))}
        <button
          onClick={() => setShowDirty(!showDirty)}
          className={cn(
            'press-sm flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
            !showDirty
              ? 'bg-foreground text-background'
              : 'bg-secondary text-secondary-foreground'
          )}
        >
          <Droplets size={12} strokeWidth={2.2} />
          Hide dirty
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
          <Shirt size={32} strokeWidth={1.3} />
          <p className="text-sm">No items yet</p>
        </div>
      ) : (
        <div className="cascade grid grid-cols-3 gap-3">
          {filtered.map((item) => (
            <div key={item.id} className="flex justify-center">
              <ItemCard
                item={item}
                onToggleLaundry={onToggleLaundry ? () => onToggleLaundry(item.id) : undefined}
                onClick={
                  selectable && onSelectToggle
                    ? () => onSelectToggle(item.id)
                    : onItemClick
                    ? () => onItemClick(item)
                    : undefined
                }
                selected={selectable ? selectedIds?.has(item.id) : false}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
