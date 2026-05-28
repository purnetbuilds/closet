'use client'

import { useState } from 'react'
import { TrendingUp, RotateCcw, Sun } from 'lucide-react'
import type { ClothingItem } from '@/lib/db'
import { getUnwornItems } from '@/lib/outfit-utils'
import { getWearLogs } from '@/lib/storage'

interface Props {
  items: ClothingItem[]
}

interface Stats {
  logCount: number
  recentDays: number
}

function readStats(): Stats {
  const logs = getWearLogs()
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recent = logs.filter((l) => new Date(l.date).getTime() >= cutoff)
  return { logCount: logs.length, recentDays: recent.length }
}

/**
 * Small contextual nudge — picks the most relevant insight from wear history.
 */
export function WearInsight({ items }: Props) {
  // Lazy initializer keeps reads off the render path and avoids effect-setState
  const [stats] = useState<Stats>(() =>
    typeof window === 'undefined' ? { logCount: 0, recentDays: 0 } : readStats()
  )

  if (items.length === 0) return null

  const unworn = getUnwornItems(items, 60)

  let icon = TrendingUp
  let text = ''

  if (stats.recentDays >= 5) {
    icon = TrendingUp
    text = `On a roll — ${stats.recentDays} fits logged this week`
  } else if (unworn.length >= 3) {
    icon = RotateCcw
    text = `${unworn.length} pieces forgotten in your closet`
  } else if (stats.logCount === 0) {
    icon = Sun
    text = 'Log your first fit to start your style story'
  } else {
    return null
  }

  const Icon = icon

  return (
    <div className="flex items-center gap-2 self-start rounded-full bg-secondary/60 px-3 py-1.5 text-xs text-muted-foreground">
      <Icon size={12} className="text-[var(--accent-warm)]" strokeWidth={2.2} />
      <span>{text}</span>
    </div>
  )
}
