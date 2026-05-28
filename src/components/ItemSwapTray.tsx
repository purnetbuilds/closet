'use client'

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ItemCard } from './ItemCard'
import type { ClothingItem, Category } from '@/lib/db'
import { CATEGORY_LABELS } from '@/lib/outfit-utils'
import { Shirt } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  category: Category
  currentItemId: string | null
  availableItems: ClothingItem[]
  onSelect: (item: ClothingItem) => void
}

export function ItemSwapTray({
  open,
  onClose,
  category,
  currentItemId,
  availableItems,
  onSelect,
}: Props) {
  const filtered = availableItems.filter(
    (i) => i.category === category && i.laundryStatus === 'clean'
  )

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className="max-h-[70vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>Swap {CATEGORY_LABELS[category]}</DrawerTitle>
          <p className="text-xs text-muted-foreground">
            {filtered.length} clean {filtered.length === 1 ? 'option' : 'options'}
          </p>
        </DrawerHeader>
        <ScrollArea className="h-full px-4 pb-safe-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <Shirt size={28} strokeWidth={1.4} />
              <p className="text-sm">
                No other {CATEGORY_LABELS[category].toLowerCase()} available
              </p>
            </div>
          ) : (
            <div className="cascade flex flex-wrap justify-center gap-3 pb-8 pt-2">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  className="press-sm rounded-2xl outline-none"
                  onClick={() => {
                    onSelect(item)
                    onClose()
                  }}
                >
                  <ItemCard item={item} selected={item.id === currentItemId} />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  )
}
