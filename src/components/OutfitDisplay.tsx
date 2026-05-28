'use client'

import { useState, useRef } from 'react'
import { Lock, ChevronDown, Sparkles } from 'lucide-react'
import { ItemCard } from './ItemCard'
import { ItemSwapTray } from './ItemSwapTray'
import type { ClothingItem, Category } from '@/lib/db'
import type { GeneratedOutfit } from '@/lib/outfit-generator'
import { cn } from '@/lib/utils'

interface Props {
  suggestion: GeneratedOutfit
  allItems: ClothingItem[]
  onSwap: (oldItemId: string, newItem: ClothingItem) => void
  lockedIds: Set<string>
  onToggleLock: (id: string) => void
  /** Detail context — exposed so each item can morph when only one changes. */
  changedIds?: Set<string>
}

// Head-to-toe vertical order — outerwear then top/dress then bottom then shoes; bags/accessories last.
const CATEGORY_ORDER: Record<Category, number> = {
  outerwear: 0,
  dress: 1,
  top: 2,
  bottom: 3,
  shoes: 4,
  bag: 5,
  accessory: 6,
  other: 7,
}

export function OutfitDisplay({
  suggestion,
  allItems,
  onSwap,
  lockedIds,
  onToggleLock,
  changedIds,
}: Props) {
  const [swapTray, setSwapTray] = useState<{ category: Category; currentId: string } | null>(null)
  const [reasoningOpen, setReasoningOpen] = useState(false)

  const items = suggestion.itemIds
    .map((id) => allItems.find((i) => i.id === id))
    .filter(Boolean) as ClothingItem[]

  const sorted = [...items].sort(
    (a, b) => CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category]
  )

  // Long-press to lock
  const pressTimer = useRef<number | null>(null)
  const longPressedRef = useRef(false)

  function startPress(id: string) {
    longPressedRef.current = false
    pressTimer.current = window.setTimeout(() => {
      longPressedRef.current = true
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(8)
      } catch {}
      onToggleLock(id)
    }, 420)
  }
  function endPress() {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Silhouette column */}
      <div className="cascade flex flex-col items-center gap-1.5">
        {sorted.map((item, idx) => {
          const locked = lockedIds.has(item.id)
          const changed = changedIds?.has(item.id)
          // Overlap upper layers slightly for silhouette feel
          const overlap = idx > 0 && idx < sorted.length - 1 ? '-mt-3' : ''
          return (
            <div
              key={item.id}
              className={cn(
                'relative transition-[transform,filter] duration-300',
                overlap,
                changed && 'animate-[slide-in-up_320ms_var(--ease-out-strong)_backwards]'
              )}
              style={{ transitionTimingFunction: 'var(--ease-out-strong)' }}
            >
              <button
                onPointerDown={() => startPress(item.id)}
                onPointerUp={endPress}
                onPointerLeave={endPress}
                onPointerCancel={endPress}
                onClick={() => {
                  if (longPressedRef.current) return
                  setSwapTray({ category: item.category, currentId: item.id })
                }}
                className={cn(
                  'press relative block rounded-2xl outline-none',
                  locked && 'ring-2 ring-[var(--accent-warm)] ring-offset-2 ring-offset-background'
                )}
                aria-label={`${item.name} — tap to swap, hold to lock`}
              >
                <ItemCard item={item} size="lg" />
                {locked && (
                  <span className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-[var(--accent-warm)] text-background shadow-md">
                    <Lock size={11} strokeWidth={2.5} />
                  </span>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Why reasoning — collapsed pill that expands on tap */}
      {suggestion.reasoning && (
        <button
          onClick={() => setReasoningOpen((o) => !o)}
          className="press group/why mx-auto flex max-w-full items-center gap-2 rounded-full bg-secondary/70 px-3.5 py-2 text-left text-xs text-secondary-foreground"
        >
          <Sparkles size={12} className="shrink-0 text-[var(--accent-warm)]" strokeWidth={2.2} />
          <span
            className={cn(
              'overflow-hidden transition-[max-height,opacity,filter] duration-300',
              reasoningOpen ? 'max-h-40 opacity-100' : 'max-h-5 opacity-80'
            )}
            style={{ transitionTimingFunction: 'var(--ease-out-strong)' }}
          >
            <span
              className={cn(
                'block leading-snug',
                !reasoningOpen && 'truncate'
              )}
            >
              {suggestion.reasoning}
            </span>
          </span>
          <ChevronDown
            size={12}
            className={cn(
              'shrink-0 text-muted-foreground transition-transform duration-300',
              reasoningOpen && 'rotate-180'
            )}
          />
        </button>
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
