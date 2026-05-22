'use client'

import { useState, useEffect } from 'react'
import { Trash2, Sparkles } from 'lucide-react'
import { getSavedOutfits, getAllClothing, deleteOutfit, type Outfit, type ClothingItem } from '@/lib/db'

function OutfitCard({ outfit, itemMap, onDelete }: { outfit: Outfit; itemMap: Record<string, ClothingItem>; onDelete: () => void }) {
  const items = outfit.itemIds.map((id) => itemMap[id]).filter(Boolean)

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 4).map((item) => (
          <div key={item.id} className="h-20 w-16 overflow-hidden rounded-xl bg-secondary">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl">👗</div>
            )}
          </div>
        ))}
        {items.length > 4 && (
          <div className="flex h-20 w-16 items-center justify-center rounded-xl bg-secondary text-sm text-muted-foreground">
            +{items.length - 4}
          </div>
        )}
      </div>
      {outfit.aiReasoning && (
        <p className="mt-2 flex items-start gap-1 text-xs italic text-muted-foreground">
          <Sparkles size={10} className="mt-0.5 shrink-0" />
          {outfit.aiReasoning}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{new Date(outfit.createdAt).toLocaleDateString()}</p>
        <button
          onClick={onDelete}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export default function LooksPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [itemMap, setItemMap] = useState<Record<string, ClothingItem>>({})
  const [loading, setLoading] = useState(true)

  async function load() {
    const [savedOutfits, allItems] = await Promise.all([getSavedOutfits(), getAllClothing()])
    setOutfits(savedOutfits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    setItemMap(Object.fromEntries(allItems.map((i) => [i.id, i])))
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDelete(id: string) {
    await deleteOutfit(id)
    await load()
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <h1 className="text-xl font-semibold">Saved Looks</h1>

      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : outfits.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="text-5xl">📚</div>
          <p className="font-semibold">No saved looks yet</p>
          <p className="text-sm text-muted-foreground">Tap "Save look" on the Today tab to bookmark an outfit</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {outfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              itemMap={itemMap}
              onDelete={() => handleDelete(outfit.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
