'use client'

import { useState } from 'react'
import { ItemCard } from './ItemCard'
import type { ClothingItem, Category, Occasion } from '@/lib/db'
import { CATEGORY_LABELS } from '@/lib/outfit-utils'

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
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              categoryFilter === c
                ? 'bg-foreground text-background'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {c === 'all' ? 'All' : CATEGORY_LABELS[c]}
          </button>
        ))}
        <button
          onClick={() => setShowDirty(!showDirty)}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            !showDirty
              ? 'bg-foreground text-background'
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          💧 Hide dirty
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-4xl">👗</p>
          <p className="mt-2 text-sm">No items yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
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
