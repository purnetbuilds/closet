'use client'

import { useState, useEffect } from 'react'
import { Trash2, Sparkles, BookOpen } from 'lucide-react'
import {
  getSavedOutfits,
  getAllClothing,
  getAllOutfits,
  deleteOutfit,
  type Outfit,
  type ClothingItem,
} from '@/lib/db'
import { getWearLogs } from '@/lib/storage'
import { toast } from '@/components/Toaster'
import { cn } from '@/lib/utils'

function OutfitCard({
  outfit,
  itemMap,
  onDelete,
}: {
  outfit: Outfit
  itemMap: Record<string, ClothingItem>
  onDelete: () => void
}) {
  const items = outfit.itemIds.map((id) => itemMap[id]).filter(Boolean)

  return (
    <div className="press group/look rounded-2xl border border-border bg-card p-3">
      <div className="flex flex-wrap gap-2">
        {items.slice(0, 4).map((item) => (
          <div
            key={item.id}
            className="h-20 w-16 overflow-hidden rounded-xl bg-secondary"
          >
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <BookOpen size={18} strokeWidth={1.4} />
              </div>
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
          <Sparkles size={10} className="mt-0.5 shrink-0 text-[var(--accent-warm)]" />
          {outfit.aiReasoning}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {new Date(outfit.createdAt).toLocaleDateString()}
        </p>
        <button
          onClick={onDelete}
          className="press-sm rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label="Delete look"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function StoriesRing({
  outfits,
  itemMap,
}: {
  outfits: Outfit[]
  itemMap: Record<string, ClothingItem>
}) {
  if (outfits.length === 0) return null
  return (
    <div className="-mx-4 px-4">
      <div className="cascade flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {outfits.map((o) => {
          const first = o.itemIds.map((id) => itemMap[id]).find(Boolean)
          return (
            <div key={o.id} className="flex shrink-0 flex-col items-center gap-1">
              <div
                className="press-sm rounded-full p-[2px]"
                style={{
                  backgroundImage:
                    'conic-gradient(from 220deg at 50% 50%, var(--accent-warm), color-mix(in oklch, var(--accent-warm) 30%, transparent), var(--accent-warm))',
                }}
              >
                <div className="size-16 overflow-hidden rounded-full border-2 border-background bg-secondary">
                  {first?.imageUrl ? (
                    <img
                      src={first.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <BookOpen size={16} strokeWidth={1.4} />
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {new Date(o.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function LooksPage() {
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([])
  const [recentWorn, setRecentWorn] = useState<Outfit[]>([])
  const [itemMap, setItemMap] = useState<Record<string, ClothingItem>>({})
  const [loading, setLoading] = useState(true)

  async function load() {
    const [saved, allOutfits, allItems] = await Promise.all([
      getSavedOutfits(),
      getAllOutfits(),
      getAllClothing(),
    ])
    setSavedOutfits(
      saved.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    )

    // Build recent worn from wear logs → outfit IDs
    const logs = getWearLogs()
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8)
    const outfitById = new Map(allOutfits.map((o) => [o.id, o]))
    const recent = logs
      .map((l) => outfitById.get(l.outfitId))
      .filter((o): o is Outfit => Boolean(o))
    setRecentWorn(recent)

    setItemMap(Object.fromEntries(allItems.map((i) => [i.id, i])))
    setLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [])

  async function handleDelete(outfit: Outfit) {
    // Optimistic delete with undo
    setSavedOutfits((prev) => prev.filter((o) => o.id !== outfit.id))
    let undone = false
    toast.success('Look deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          undone = true
          setSavedOutfits((prev) =>
            [outfit, ...prev].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          )
        },
      },
    })
    // Commit after toast lifetime
    window.setTimeout(async () => {
      if (undone) return
      await deleteOutfit(outfit.id)
    }, 3600)
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <h1 className="text-3xl font-semibold tracking-tight">Looks</h1>

      {!loading && recentWorn.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Recently worn
          </p>
          <StoriesRing outfits={recentWorn} itemMap={itemMap} />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Saved
        </p>
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shimmer h-32 rounded-2xl" />
            ))}
          </div>
        ) : savedOutfits.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <BookOpen size={26} strokeWidth={1.4} />
            </div>
            <p className="font-semibold">No saved looks yet</p>
            <p className="text-sm text-muted-foreground">
              Tap “Save look” on Today to bookmark an outfit
            </p>
          </div>
        ) : (
          <div className={cn('grid grid-cols-1 gap-4 cascade')}>
            {savedOutfits.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                itemMap={itemMap}
                onDelete={() => handleDelete(outfit)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
