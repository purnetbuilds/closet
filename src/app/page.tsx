'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Check, Bookmark, Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useWeather } from '@/hooks/useWeather'
import { useOutfitOfDay } from '@/hooks/useOutfitOfDay'
import { useWearLog } from '@/hooks/useWearLog'
import { OutfitDisplay } from '@/components/OutfitDisplay'
import { OccasionPicker } from '@/components/OccasionPicker'
import { WeatherBadge } from '@/components/WeatherBadge'
import { SwipeArea } from '@/components/SwipeArea'
import { HoldButton } from '@/components/HoldButton'
import { WearInsight } from '@/components/WearInsight'
import { toast } from '@/components/Toaster'
import { getAllClothing, saveOutfit, type ClothingItem, type Occasion } from '@/lib/db'
import { getWearLogForDate } from '@/lib/storage'
import type { GeneratedOutfit } from '@/lib/outfit-generator'
import { weatherTheme } from '@/lib/weather-theme'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
const UserPhotoPanel = dynamic(
  () => import('@/components/UserPhotoPanel').then((m) => m.UserPhotoPanel),
  { ssr: false }
)
import { format } from 'date-fns'

function todayLogExists(): boolean {
  if (typeof window === 'undefined') return false
  const today = new Date().toISOString().split('T')[0]
  return !!getWearLogForDate(today)
}

export default function TodayPage() {
  const { weather, loading: weatherLoading } = useWeather()
  const { suggestions, loading: outfitLoading, error, generate } = useOutfitOfDay()
  const { logWear } = useWearLog()

  const [allItems, setAllItems] = useState<ClothingItem[]>([])
  const [occasion, setOccasion] = useState<Occasion | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [localSuggestion, setLocalSuggestion] = useState<GeneratedOutfit | null>(null)
  const [lockedIds, setLockedIds] = useState<Set<string>>(new Set())
  const [wornToday, setWornToday] = useState<boolean>(todayLogExists)
  const [savingLook, setSavingLook] = useState(false)
  const [savedLookId, setSavedLookId] = useState<string | null>(null)

  useEffect(() => {
    getAllClothing().then(setAllItems)
  }, [])

  useEffect(() => {
    if (!weatherLoading && allItems.length > 0) {
      generate(weather, occasion)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather, weatherLoading, occasion, allItems.length])

  // When suggestions update, reset to first option and clear any local swap.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (suggestions.length > 0) {
      setCurrentIdx(0)
      setLocalSuggestion(null)
    }
  }, [suggestions])
  /* eslint-enable react-hooks/set-state-in-effect */

  const safeIdx = Math.min(currentIdx, Math.max(0, suggestions.length - 1))
  const activeSuggestion = localSuggestion ?? suggestions[safeIdx] ?? null

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
      if (next.has(id)) {
        next.delete(id)
        toast.message('Unlocked')
      } else {
        next.add(id)
        toast.message('Locked — it’ll stay across reshuffles')
      }
      return next
    })
  }, [])

  const handleWearToday = useCallback(async () => {
    if (!activeSuggestion || wornToday) return
    const outfitId = `outfit-${Date.now()}`
    const items = activeSuggestion.itemIds
      .map((id) => allItems.find((i) => i.id === id))
      .filter(Boolean) as ClothingItem[]
    await logWear(outfitId, items, weather ? `${weather.temp}°C, ${weather.condition}` : undefined)
    setWornToday(true)
    toast.success('Logged today’s fit')
  }, [activeSuggestion, allItems, weather, logWear, wornToday])

  const handleSaveLook = useCallback(async () => {
    if (!activeSuggestion || savingLook) return
    setSavingLook(true)
    const id = `outfit-${Date.now()}`
    await saveOutfit({
      id,
      itemIds: activeSuggestion.itemIds,
      occasion: occasion ?? undefined,
      createdAt: new Date().toISOString(),
      isSaved: true,
      aiReasoning: activeSuggestion.reasoning,
    })
    setSavingLook(false)
    setSavedLookId(id)
    toast.success('Saved to Looks', {
      action: {
        label: 'View',
        onClick: () => {
          window.location.href = '/looks'
        },
      },
    })
    window.setTimeout(() => setSavedLookId(null), 1800)
  }, [activeSuggestion, occasion, savingLook])

  const goPrev = useCallback(() => {
    setCurrentIdx((i) => Math.max(0, i - 1))
  }, [])

  const goNext = useCallback(() => {
    setCurrentIdx((i) => Math.min(suggestions.length - 1, i + 1))
  }, [suggestions.length])

  const isEmptyWardrobe = !outfitLoading && allItems.length < 2
  const isLoading = outfitLoading || weatherLoading

  const theme = weatherTheme(weather)

  return (
    <div
      className="weather-bg flex min-h-screen flex-col gap-5 px-4 py-5"
      style={
        {
          '--weather-from': theme.light.from,
          '--weather-via': theme.light.via,
          '--weather-to': theme.light.to,
        } as React.CSSProperties
      }
    >
      {/* Hero header */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight leading-tight">Today</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>
        <WeatherBadge weather={weather} />
      </header>

      <WearInsight items={allItems} />

      <OccasionPicker selected={occasion} onChange={setOccasion} />

      {isEmptyWardrobe ? (
        <EmptyWardrobe />
      ) : isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState onRetry={() => generate(weather, occasion)} message={error} />
      ) : activeSuggestion ? (
        <>
          <SwipeArea
            onSwipeLeft={goNext}
            onSwipeRight={goPrev}
          >
            <UserPhotoPanel>
              <OutfitDisplay
                suggestion={activeSuggestion}
                allItems={allItems}
                onSwap={handleSwap}
                lockedIds={lockedIds}
                onToggleLock={handleToggleLock}
              />
            </UserPhotoPanel>
          </SwipeArea>

          {/* Pagination dots */}
          {suggestions.length > 1 && !localSuggestion && (
            <div className="flex items-center justify-center gap-2">
              {suggestions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  aria-label={`Suggestion ${i + 1}`}
                  className={cn(
                    'press-sm h-1.5 rounded-full transition-[width,background-color] duration-300',
                    i === safeIdx ? 'w-6 bg-foreground' : 'w-1.5 bg-muted-foreground/40'
                  )}
                  style={{ transitionTimingFunction: 'var(--ease-out-strong)' }}
                />
              ))}
            </div>
          )}

          <button
            onClick={() => generate(weather, occasion)}
            className="press mx-auto flex items-center gap-2 rounded-full bg-secondary/60 px-3.5 py-1.5 text-xs text-muted-foreground hover:bg-secondary"
          >
            <RefreshCw size={12} />
            Reshuffle
          </button>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSaveLook}
              disabled={savingLook}
              className={cn(
                'press relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl border border-border py-3 text-sm font-medium transition-colors hover:bg-secondary',
                savedLookId && 'border-emerald-400/60'
              )}
            >
              <span
                className={cn(
                  'flex items-center gap-2 transition-[opacity,filter,transform] duration-300',
                  savedLookId ? 'opacity-0 blur-sm scale-95' : 'opacity-100 blur-0'
                )}
                style={{ transitionTimingFunction: 'var(--ease-out-strong)' }}
              >
                {savingLook ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Bookmark size={16} />
                )}
                Save look
              </span>
              <span
                className={cn(
                  'absolute inset-0 flex items-center justify-center gap-2 text-emerald-600 transition-[opacity,filter,transform] duration-300',
                  savedLookId ? 'opacity-100 blur-0' : 'opacity-0 blur-sm scale-95'
                )}
                style={{ transitionTimingFunction: 'var(--ease-out-strong)' }}
              >
                <Check size={16} strokeWidth={2.6} />
                Saved
              </span>
            </button>
            <HoldButton
              onConfirm={handleWearToday}
              disabled={wornToday}
              duration={650}
              fillClassName="bg-emerald-500/90"
              className="flex flex-1 items-center justify-center gap-2 bg-foreground py-3 text-sm font-medium text-background"
            >
              <Check size={16} />
              {wornToday ? 'Logged today' : 'Hold to wear'}
            </HoldButton>
          </div>
        </>
      ) : null}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10">
      <div className="flex flex-col items-center gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="shimmer h-28 w-24 rounded-2xl"
            style={{ width: 110 - i * 6 }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">Picking your look…</p>
    </div>
  )
}

function ErrorState({ onRetry, message }: { onRetry: () => void; message: string }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-center">
      <p className="text-sm text-destructive">{message}</p>
      <button onClick={onRetry} className="press mt-2 text-sm underline">
        Try again
      </button>
    </div>
  )
}

function EmptyWardrobe() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <div>
        <p className="font-semibold">Your wardrobe is empty</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add at least 2 items to get outfit suggestions
        </p>
      </div>
      <Link
        href="/wardrobe/add"
        className="press flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
      >
        <Plus size={16} />
        Add clothes
      </Link>
    </div>
  )
}
