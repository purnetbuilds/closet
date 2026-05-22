'use client'

import { useState } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { ItemCard } from './ItemCard'
import { ItemSwapTray } from './ItemSwapTray'
import type { ClothingItem, Category } from '@/lib/db'
import type { GeneratedOutfit } from '@/lib/outfit-generator'

interface Props {
  suggestion: GeneratedOutfit
  allItems: ClothingItem[]
  onSwap: (oldItemId: string, newItem: ClothingItem) => void
  lockedIds: Set<string>
  onToggleLock: (id: string) => void
}

export function OutfitDisplay({ suggestion, allItems, onSwap, lockedIds, onToggleLock }: Props) {
  const [swapTray, setSwapTray] = useState<{ category: Category; currentId: string } | null>(null)

  const items = suggestion.itemIds
    .map((id) => allItems.find((i) => i.id === id))
    .filter(Boolean) as ClothingItem[]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-center gap-3">
        {items.map((item) => {
          const locked = lockedIds.has(item.id)
          return (
            <div key={item.id} className="relative">
              <ItemCard
                item={item}
                size="lg"
                onClick={() => setSwapTray({ category: item.category, currentId: item.id })}
              />
              <button
                onClick={() => onToggleLock(item.id)}
                className={`absolute left-1 top-1 rounded-full p-1 shadow-sm backdrop-blur-sm transition-colors ${
                  locked ? 'bg-foreground text-background' : 'bg-background/80 text-muted-foreground'
                }`}
                title={locked ? 'Unlock item' : 'Lock item'}
              >
                {locked ? <Lock size={12} /> : <Unlock size={12} />}
              </button>
            </div>
          )
        })}
      </div>

      {suggestion.reasoning && (
        <p className="text-center text-sm italic text-muted-foreground">
          {suggestion.reasoning}
        </p>
      )}

      {swapTray && (
        <ItemSwapTray
          open={!!swapTray}
          onClose={() => setSwapTray(null)}
          category={swapTray.category}
          currentItemId={swapTray.currentId}
          availableItems={allItems}
          onSelect={(newItem) => {
            onSwap(swapTray.currentId, newItem)
            setSwapTray(null)
          }}
        />
      )}
    </div>
  )
}
