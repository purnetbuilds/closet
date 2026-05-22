'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getAllCapsules, getAllClothing, deleteCapsule, type Capsule, type ClothingItem } from '@/lib/db'

export default function CapsulesPage() {
  const [capsules, setCapsules] = useState<Capsule[]>([])
  const [itemMap, setItemMap] = useState<Record<string, ClothingItem>>({})
  const [loading, setLoading] = useState(true)

  async function load() {
    const [all, items] = await Promise.all([getAllCapsules(), getAllClothing()])
    setCapsules(all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    setItemMap(Object.fromEntries(items.map((i) => [i.id, i])))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this capsule?')) return
    await deleteCapsule(id)
    await load()
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Trips & Capsules</h1>
        <Link
          href="/capsules/new"
          className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          <Plus size={16} />
          New
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      ) : capsules.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="text-5xl">🧳</div>
          <p className="font-semibold">No capsules yet</p>
          <p className="text-sm text-muted-foreground">Create a trip capsule to pack smart and plan outfits day by day</p>
          <Link
            href="/capsules/new"
            className="mt-2 flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
          >
            <Plus size={16} />
            Create capsule
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {capsules.map((capsule) => {
            const items = capsule.itemIds.slice(0, 5).map((id) => itemMap[id]).filter(Boolean)
            return (
              <div key={capsule.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{capsule.name}</p>
                    {capsule.dateRange && (
                      <p className="text-xs text-muted-foreground">
                        {capsule.dateRange.start} → {capsule.dateRange.end}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">{capsule.itemIds.length} items</p>
                  </div>
                  <button
                    onClick={() => handleDelete(capsule.id)}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-3 flex gap-1.5">
                  {items.map((item) => (
                    <div key={item.id} className="h-12 w-10 overflow-hidden rounded-lg bg-secondary">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                      )}
                    </div>
                  ))}
                </div>
                {capsule.generatedPlan && (
                  <div className="mt-3 border-t border-border pt-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">PACKING PLAN</p>
                    <div className="flex flex-col gap-1">
                      {capsule.generatedPlan.map((day) => (
                        <div key={day.date} className="flex items-center gap-2">
                          <span className="w-20 text-xs text-muted-foreground">{day.date}</span>
                          <div className="flex gap-1">
                            {day.itemIds.slice(0, 3).map((id) => {
                              const item = itemMap[id]
                              return item ? (
                                <div key={id} className="h-6 w-5 overflow-hidden rounded bg-secondary">
                                  {item.imageUrl && (
                                    <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                                  )}
                                </div>
                              ) : null
                            })}
                          </div>
                          <p className="flex-1 truncate text-xs text-muted-foreground">{day.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
