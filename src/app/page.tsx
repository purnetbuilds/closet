'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Check, Bookmark, ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useWeather } from '@/hooks/useWeather'
import { useOutfitOfDay } from '@/hooks/useOutfitOfDay'
import { useWearLog } from '@/hooks/useWearLog'
import { OutfitDisplay } from '@/components/OutfitDisplay'
import { OccasionPicker } from '@/components/OccasionPicker'
import { WeatherBadge } from '@/components/WeatherBadge'
import { getAllClothing, saveOutfit, type ClothingItem, type Occasion } from '@/lib/db'
import type { GeneratedOutfit } from '@/lib/outfit-generator'
import dynamic from 'next/dynamic'
const UserPhotoPanel = dynamic(
  () => import('@/components/UserPhotoPanel').then((m) => m.UserPhotoPanel),
  { ssr: false }
)
import { format } from 'date-fns'

export default function TodayPage() {
  const { weather, loading: weatherLoading } = useWeather()
  const { suggestions, loading: outfitLoading, error, generate } = useOutfitOfDay()
  const { logWear, getTodayLog } = useWearLog()

  const [allItems, setAllItems] = useState<ClothingItem[]>([])
  const [occasion, setOccasion] = useState<Occasion | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [localSuggestion, setLocalSuggestion] = useState<GeneratedOutfit | null>(null)
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set())
  const [wornToday, setWornToday] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    getAllClothing().then(setAllItems)
  }, [])

  useEffect(() => {
    const log = getTodayLog()
    setWornToday(!!log)
  }, [getTodayLog])

  useEffect(() => {
    if (!weatherLoading && allItems.length > 0) {
      generate(weather, occasion)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather, weatherLoading, occasion, allItems.length])

  useEffect(() => {
    if (suggestions.length > 0) {
      setCurrentIdx(0)
      setLocalSuggestion(null)
    }
  }, [suggestions])

  const activeSuggestion = localSuggestion ?? suggestions[currentIdx] ?? null

  const handleSwap = useCallback(
    (oldItemId: string, newItem: ClothingItem) => {
      if (!activeSuggestion) return
      setLocalSuggestion({
        ...activeSuggestion,
        itemIds: activeSuggestion.itemIds.map((id) => (id === oldItemId ? newItem.id : id)),
      })
    },
    [activeSuggestion]
  )

  const handleToggleLock = useCallback((id: string) => {
    setLockedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleWearToday = useCallback(async () => {
    if (!activeSuggestion) return
    setSaving(true)
    const outfitId = `outfit-${Date.now()}`
    const items = activeSuggestion.itemIds
      .map((id) => allItems.find((i) => i.id === id))
      .filter(Boolean) as ClothingItem[]
    await logWear(outfitId, items, weather ? `${weather.temp}°C, ${weather.condition}` : undefined)
    setWornToday(true)
    setSaving(false)
    setSaveMsg('Logged! ✓')
    setTimeout(() => setSaveMsg(''), 2000)
  }, [activeSuggestion, allItems, weather, logWear])

  const handleSaveLook = useCallback(async () => {
    if (!activeSuggestion) return
    setSaving(true)
    await saveOutfit({
      id: `outfit-${Date.now()}`,
      itemIds: activeSuggestion.itemIds,
      occasion: occasion ?? undefined,
      createdAt: new Date().toISOString(),
      isSaved: true,
      aiReasoning: activeSuggestion.reasoning,
    })
    setSaving(false)
    setSaveMsg('Saved ✓')
    setTimeout(() => setSaveMsg(''), 2000)
  }, [activeSuggestion, occasion])

  const isEmptyWardrobe = !outfitLoading && allItems.length < 2
  const isLoading = outfitLoading || weatherLoading

  return (
    <div className="flex min-h-screen flex-col gap-5 px-4 py-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Today</h1>
          <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
        </div>
        <WeatherBadge weather={weather} />
      </div>

      <OccasionPicker selected={occasion} onChange={setOccasion} />

      {isEmptyWardrobe ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="text-6xl">👗</div>
          <div>
            <p className="font-semibold">Your wardrobe is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">Add at least 2 items to get outfit suggestions</p>
          </div>
          <Link
            href="/wardrobe/add"
            className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
          >
            <Plus size={16} />
            Add clothes
          </Link>
        </div>
      ) : isLoading ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3">
          <Loader2 size={32} className="animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Picking your look...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={() => generate(weather, occasion)} className="mt-2 text-sm underline">
            Try again
          </button>
        </div>
      ) : activeSuggestion ? (
        <>
          <UserPhotoPanel>
            <OutfitDisplay
              suggestion={activeSuggestion}
              allItems={allItems}
              onSwap={handleSwap}
              lockedIds={lockedIds}
              onToggleLock={handleToggleLock}
            />
          </UserPhotoPanel>

          {suggestions.length > 1 && !localSuggestion && (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
                className="rounded-full p-2 hover:bg-secondary disabled:opacity-30"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm text-muted-foreground">
                {currentIdx + 1} / {suggestions.length}
              </span>
              <button
                onClick={() => setCurrentIdx((i) => Math.min(suggestions.length - 1, i + 1))}
                disabled={currentIdx === suggestions.length - 1}
                className="rounded-full p-2 hover:bg-secondary disabled:opacity-30"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          <button
            onClick={() => generate(weather, occasion)}
            className="mx-auto flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <RefreshCw size={14} />
            Reshuffle
          </button>

          {saveMsg ? (
            <p className="text-center text-sm font-medium text-green-600">{saveMsg}</p>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleSaveLook}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium transition-colors hover:bg-secondary"
              >
                <Bookmark size={16} />
                Save look
              </button>
              <button
                onClick={handleWearToday}
                disabled={saving || wornToday}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-medium text-background transition-opacity disabled:opacity-50"
              >
                <Check size={16} />
                {wornToday ? 'Logged ✓' : 'Wear today'}
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
