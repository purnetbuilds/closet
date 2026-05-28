'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Briefcase, Calendar } from 'lucide-react'
import Link from 'next/link'
import {
  getAllCapsules,
  getAllClothing,
  deleteCapsule,
  type Capsule,
  type ClothingItem,
} from '@/lib/db'
import { toast } from '@/components/Toaster'
import { cn } from '@/lib/utils'

// How long a deleted capsule can be restored before the delete is committed.
// The toast stays visible for the same window so Undo never disappears early.
const UNDO_WINDOW_MS = 5000

function CapsuleCard({
  capsule,
  itemMap,
  onDelete,
}: {
  capsule: Capsule
  itemMap: Record<string, ClothingItem>
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const items = capsule.itemIds.slice(0, 5).map((id) => itemMap[id]).filter(Boolean)

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="font-semibold">{capsule.name}</p>
          {capsule.dateRange && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar size={11} strokeWidth={2} />
              {capsule.dateRange.start} → {capsule.dateRange.end}
            </p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            {capsule.itemIds.length} items
          </p>
        </div>
        <button
          onClick={onDelete}
          className="press-sm rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label="Delete capsule"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mt-3 flex gap-1.5">
        {items.map((item) => (
          <div
            key={item.id}
            className="h-12 w-10 overflow-hidden rounded-lg bg-secondary"
          >
            {item.imageUrl && (
              <img
                src={item.imageUrl}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            )}
          </div>
        ))}
      </div>

      {/* Wallet-style stacked day plan */}
      {capsule.generatedPlan && capsule.generatedPlan.length > 0 && (
        <div className="mt-3 border-t border-border pt-3">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="press-sm flex w-full items-center justify-between text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            <span>Packing plan · {capsule.generatedPlan.length} days</span>
            <span>{expanded ? 'Hide' : 'View'}</span>
          </button>

          <div
            className={cn(
              'relative mt-2 overflow-hidden transition-[height] duration-400',
              expanded
                ? 'h-auto'
                : 'h-24'
            )}
            style={{ transitionTimingFunction: 'var(--ease-out-strong)' }}
          >
            <div
              className={cn(
                'relative flex flex-col gap-2',
                !expanded && 'pointer-events-none'
              )}
            >
              {capsule.generatedPlan.map((day, idx) => {
                // In collapsed state, stack first 3 cards with peek-through
                const collapsedTransform = !expanded
                  ? `translateY(${idx * 14}px) scale(${1 - idx * 0.04})`
                  : 'none'
                const collapsedOpacity = !expanded && idx > 2 ? 0 : 1
                return (
                  <div
                    key={day.date}
                    className={cn(
                      'rounded-xl border border-border bg-popover/90 px-3 py-2 shadow-sm backdrop-blur-sm transition-all duration-400',
                      !expanded && 'absolute inset-x-0 top-0'
                    )}
                    style={{
                      transform: collapsedTransform,
                      opacity: collapsedOpacity,
                      transitionTimingFunction: 'var(--ease-out-strong)',
                      zIndex: 10 - idx,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium">{day.date}</span>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {day.occasion}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {day.itemIds.slice(0, 4).map((id) => {
                        const item = itemMap[id]
                        return item ? (
                          <div
                            key={id}
                            className="h-8 w-7 overflow-hidden rounded bg-secondary"
                          >
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt=""
                                className="h-full w-full object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            )}
                          </div>
                        ) : null
                      })}
                      <p className="ml-1 line-clamp-1 flex-1 text-[11px] text-muted-foreground">
                        {day.reasoning}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CapsulesPage() {
  const [capsules, setCapsules] = useState<Capsule[]>([])
  const [itemMap, setItemMap] = useState<Record<string, ClothingItem>>({})
  const [loading, setLoading] = useState(true)

  async function load() {
    const [all, items] = await Promise.all([getAllCapsules(), getAllClothing()])
    setCapsules(
      all.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    )
    setItemMap(Object.fromEntries(items.map((i) => [i.id, i])))
    setLoading(false)
  }

  // Deletes that are still inside their undo window. Keyed by capsule id so we
  // can commit them immediately if the page unmounts or the tab closes —
  // otherwise a quick navigation would lose the delete and the capsule returns.
  const pendingDeletes = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [])

  useEffect(() => {
    const pending = pendingDeletes.current
    const flush = () => {
      pending.forEach((timer, id) => {
        clearTimeout(timer)
        void deleteCapsule(id)
      })
      pending.clear()
    }
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('beforeunload', flush)
      flush()
    }
  }, [])

  function handleDelete(capsule: Capsule) {
    setCapsules((prev) => prev.filter((c) => c.id !== capsule.id))

    const timer = setTimeout(() => {
      pendingDeletes.current.delete(capsule.id)
      void deleteCapsule(capsule.id)
    }, UNDO_WINDOW_MS)
    pendingDeletes.current.set(capsule.id, timer)

    toast.success('Capsule deleted', {
      duration: UNDO_WINDOW_MS,
      action: {
        label: 'Undo',
        onClick: () => {
          const pending = pendingDeletes.current.get(capsule.id)
          if (pending) {
            clearTimeout(pending)
            pendingDeletes.current.delete(capsule.id)
          }
          setCapsules((prev) =>
            [capsule, ...prev].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
          )
        },
      },
    })
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Trips</h1>
        <Link
          href="/capsules/new"
          className="press flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          <Plus size={16} />
          New
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="shimmer h-24 rounded-2xl" />
          ))}
        </div>
      ) : capsules.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Briefcase size={26} strokeWidth={1.4} />
          </div>
          <p className="font-semibold">No capsules yet</p>
          <p className="text-sm text-muted-foreground">
            Create a trip capsule to pack smart and plan outfits day by day
          </p>
          <Link
            href="/capsules/new"
            className="press mt-2 flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
          >
            <Plus size={16} />
            Create capsule
          </Link>
        </div>
      ) : (
        <div className="cascade flex flex-col gap-3">
          {capsules.map((capsule) => (
            <CapsuleCard
              key={capsule.id}
              capsule={capsule}
              itemMap={itemMap}
              onDelete={() => handleDelete(capsule)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
