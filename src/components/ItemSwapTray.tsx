'use client'

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ItemCard } from './ItemCard'
import type { ClothingItem, Category } from '@/lib/db'
import { CATEGORY_LABELS } from '@/lib/outfit-utils'

interface Props {
  open: boolean
  onClose: () => void
  category: Category
  currentItemId: string | null
  availableItems: ClothingItem[]
  onSelect: (item: ClothingItem) => void
}

export function ItemSwapTray({ open, onClose, category, currentItemId, availableItems, onSelect }: Props) {
  const filtered = availableItems.filter((i) => i.category === category && i.laundryStatus === 'clean')

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className="max-h-[70vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>Swap {CATEGORY_LABELS[category]}</DrawerTitle>
        </DrawerHeader>
        <ScrollArea className="h-full px-4 pb-safe-4">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No other {CATEGORY_LABELS[category].toLowerCase()} available
            </p>
          ) : (
            <div className="flex flex-wrap gap-3 pb-8 pt-2">
              {filtered.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  selected={item.id === currentItemId}
                  onClick={() => {
                    onSelect(item)
                    onClose()
                  }}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  )
}
