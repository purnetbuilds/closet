'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Plus, Minus, Sparkles } from 'lucide-react'
import { getAllClothing, saveCapsule, type ClothingItem, type Occasion } from '@/lib/db'
import { WardrobeGrid } from '@/components/WardrobeGrid'
import { generateCapsulePlan } from '@/lib/outfit-generator'
import { OCCASION_LABELS, getCurrentSeason } from '@/lib/outfit-utils'
import { format, addDays, parseISO } from 'date-fns'

const occasions: Occasion[] = ['work', 'casual', 'formal', 'date', 'gym']

export default function NewCapsulePage() {
  const router = useRouter()
  const [allItems, setAllItems] = useState<ClothingItem[]>([])
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [numDays, setNumDays] = useState(3)
  const [dayOccasions, setDayOccasions] = useState<Occasion[]>(['casual', 'casual', 'casual'])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAllClothing().then(setAllItems)
    setStartDate(format(new Date(), 'yyyy-MM-dd'))
  }, [])

  useEffect(() => {
    setDayOccasions((prev) => {
      const next = [...prev]
      while (next.length < numDays) next.push('casual')
      return next.slice(0, numDays)
    })
  }, [numDays])

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function setDayOccasion(idx: number, occ: Occasion) {
    setDayOccasions((prev) => {
      const next = [...prev]
      next[idx] = occ
      return next
    })
  }

  async function handleGenerateAndSave() {
    if (!name.trim() || selectedIds.size === 0) return
    const capsuleItems = allItems.filter((i) => selectedIds.has(i.id))
    const days = Array.from({ length: numDays }, (_, i) => ({
      date: format(addDays(parseISO(startDate), i), 'yyyy-MM-dd'),
      occasion: dayOccasions[i],
    }))

    let plan
    try {
      plan = generateCapsulePlan(capsuleItems, days, getCurrentSeason())
    } catch {
      plan = undefined
    }

    setSaving(true)
    await saveCapsule({
      id: `capsule-${Date.now()}`,
      name: name.trim(),
      itemIds: [...selectedIds],
      dateRange: { start: days[0].date, end: days[days.length - 1].date },
      createdAt: new Date().toISOString(),
      generatedPlan: plan,
    })
    setSaving(false)
    router.push('/capsules')
  }

  const canSave = name.trim().length > 0 && selectedIds.size > 0

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-full p-1 hover:bg-secondary">
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-xl font-semibold">New Capsule</h1>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Capsule name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Paris trip, Work week"
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-sm font-medium">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Days</label>
            <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5">
              <button onClick={() => setNumDays((n) => Math.max(1, n - 1))} className="text-muted-foreground">
                <Minus size={16} />
              </button>
              <span className="w-6 text-center text-sm font-medium">{numDays}</span>
              <button onClick={() => setNumDays((n) => Math.min(14, n + 1))} className="text-muted-foreground">
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Occasion per day</label>
          <div className="flex flex-col gap-2">
            {Array.from({ length: numDays }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-24 text-xs text-muted-foreground">
                  {startDate ? format(addDays(parseISO(startDate), i), 'EEE, MMM d') : `Day ${i + 1}`}
                </span>
                <div className="flex flex-1 gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                  {occasions.map((o) => (
                    <button
                      key={o}
                      onClick={() => setDayOccasion(i, o)}
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                        dayOccasions[i] === o ? 'bg-foreground text-background' : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {OCCASION_LABELS[o]}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Select items</label>
          <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
        </div>
        <WardrobeGrid
          items={allItems}
          selectable
          selectedIds={selectedIds}
          onSelectToggle={toggleItem}
        />
      </div>

      <button
        onClick={handleGenerateAndSave}
        disabled={!canSave || generating || saving}
        className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-sm font-semibold text-background disabled:opacity-40"
      >
        {generating ? (
          <>
            <Sparkles size={16} className="animate-spin" />
            Planning outfits...
          </>
        ) : saving ? (
          'Saving...'
        ) : (
          <>
            <Sparkles size={16} />
            Generate packing plan
          </>
        )}
      </button>
    </div>
  )
}
