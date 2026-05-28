'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Trash2, Droplets, Shirt } from 'lucide-react'
import { getClothingItem, saveClothingItem, deleteClothingItem, type ClothingItem, type Category, type Season, type Occasion } from '@/lib/db'
import { CATEGORY_LABELS, OCCASION_LABELS } from '@/lib/outfit-utils'
import { toast } from '@/components/Toaster'
import { cn } from '@/lib/utils'

const categories: Category[] = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'bag', 'accessory', 'other']
const seasons: Season[] = ['spring', 'summer', 'fall', 'winter']
const occasions: Occasion[] = ['work', 'casual', 'formal', 'date', 'gym']

export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [item, setItem] = useState<ClothingItem | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getClothingItem(id).then((i) => i && setItem(i))
  }, [id])

  if (!item) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Item not found</p>
      </div>
    )
  }

  function toggleSeason(s: Season) {
    setItem((prev) => prev && {
      ...prev,
      season: prev.season.includes(s) ? prev.season.filter((x) => x !== s) : [...prev.season, s],
    })
  }

  function toggleOccasion(o: Occasion) {
    setItem((prev) => prev && {
      ...prev,
      occasions: prev.occasions.includes(o) ? prev.occasions.filter((x) => x !== o) : [...prev.occasions, o],
    })
  }

  async function handleSave() {
    if (!item) return
    setSaving(true)
    await saveClothingItem(item)
    setSaving(false)
    router.back()
  }

  async function handleDelete() {
    if (!item) return
    const snapshot = item
    await deleteClothingItem(item.id)
    let undone = false
    toast.success(`${snapshot.name} removed`, {
      action: {
        label: 'Undo',
        onClick: async () => {
          undone = true
          await saveClothingItem(snapshot)
          setItem(snapshot)
        },
      },
    })
    window.setTimeout(() => {
      if (!undone) router.push('/wardrobe')
    }, 600)
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="press rounded-full p-1 hover:bg-secondary"
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={handleDelete}
          className="press rounded-full p-2 text-destructive hover:bg-destructive/10"
          aria-label="Delete item"
        >
          <Trash2 size={18} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="h-52 w-44 overflow-hidden rounded-2xl bg-secondary shadow-md">
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
                <Shirt size={48} strokeWidth={1.2} />
              </div>
            )}
          </div>
          <button
            onClick={() =>
              setItem((prev) =>
                prev && {
                  ...prev,
                  laundryStatus: prev.laundryStatus === 'clean' ? 'dirty' : 'clean',
                }
              )
            }
            className={cn(
              'press-sm absolute bottom-2 right-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium shadow backdrop-blur-sm',
              item.laundryStatus === 'dirty'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                : 'bg-background/80 text-muted-foreground'
            )}
          >
            <Droplets size={12} />
            {item.laundryStatus === 'dirty' ? 'Dirty' : 'Clean'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Name</label>
          <input
            value={item.name}
            onChange={(e) => setItem((prev) => prev && { ...prev, name: e.target.value })}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setItem((prev) => prev && { ...prev, category: c })}
                className={cn(
                  'press-sm rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  item.category === c
                    ? 'bg-foreground text-background'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Season</label>
          <div className="flex gap-2">
            {seasons.map((s) => (
              <button
                key={s}
                onClick={() => toggleSeason(s)}
                className={cn(
                  'press-sm flex-1 rounded-full py-1.5 text-sm font-medium capitalize transition-colors',
                  item.season.includes(s)
                    ? 'bg-foreground text-background'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Occasion</label>
          <div className="flex flex-wrap gap-2">
            {occasions.map((o) => (
              <button
                key={o}
                onClick={() => toggleOccasion(o)}
                className={cn(
                  'press-sm rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  item.occasions.includes(o)
                    ? 'bg-foreground text-background'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                {OCCASION_LABELS[o]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-secondary p-3">
            <p className="text-muted-foreground">Times worn</p>
            <p className="mt-0.5 text-lg font-semibold">{item.wearCount}</p>
          </div>
          <div className="rounded-xl bg-secondary p-3">
            <p className="text-muted-foreground">Last worn</p>
            <p className="mt-0.5 font-medium">
              {item.lastWorn ? new Date(item.lastWorn).toLocaleDateString() : 'Never'}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="press mt-2 rounded-xl bg-foreground py-3.5 text-sm font-semibold text-background disabled:opacity-40"
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  )
}
