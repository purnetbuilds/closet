'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, getDay } from 'date-fns'
import { getWearLogs } from '@/lib/storage'
import type { Outfit } from '@/lib/db'
import { cn } from '@/lib/utils'

interface Props {
  outfits: Outfit[]
  itemImageMap: Record<string, string>
}

export function CalendarView({ outfits, itemImageMap }: Props) {
  const [current, setCurrent] = useState(new Date())
  const logs = getWearLogs()
  const logsByDate = Object.fromEntries(logs.map((l) => [l.date, l]))

  const days = eachDayOfInterval({ start: startOfMonth(current), end: endOfMonth(current) })
  const firstDayOfWeek = getDay(startOfMonth(current))

  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const selectedLog = selectedDate ? logsByDate[selectedDate] : null
  const selectedOutfit = selectedLog ? outfits.find((o) => o.id === selectedLog.outfitId) : null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() - 1))}
          className="press rounded-full p-2 hover:bg-secondary"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-base font-semibold">{format(current, 'MMMM yyyy')}</h2>
        <button
          onClick={() => setCurrent((d) => new Date(d.getFullYear(), d.getMonth() + 1))}
          className="press rounded-full p-2 hover:bg-secondary"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        key={format(current, 'yyyy-MM')}
        className="cascade grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground"
      >
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="py-1 font-medium">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const hasLog = !!logsByDate[dateStr]
          const isSelected = selectedDate === dateStr
          const today = isToday(day)

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={cn(
                'press-sm flex flex-col items-center rounded-lg py-1.5 text-sm transition-colors',
                isSelected
                  ? 'bg-foreground text-background'
                  : today
                  ? 'bg-[var(--accent-warm-soft)] font-semibold text-foreground'
                  : 'hover:bg-secondary/50'
              )}
              style={{ transitionTimingFunction: 'var(--ease-out-strong)' }}
            >
              <span>{format(day, 'd')}</span>
              {hasLog && (
                <span
                  className={cn(
                    'mt-0.5 h-1.5 w-1.5 rounded-full',
                    isSelected ? 'bg-background' : 'bg-foreground'
                  )}
                />
              )}
            </button>
          )
        })}
      </div>

      {selectedLog && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-medium">
            {format(new Date(selectedDate!), 'EEEE, MMMM d')}
          </p>
          {selectedLog.weatherSummary && (
            <p className="mb-2 text-xs text-muted-foreground">{selectedLog.weatherSummary}</p>
          )}
          {selectedOutfit ? (
            <div className="flex flex-wrap gap-2">
              {selectedOutfit.itemIds.slice(0, 4).map((id) => (
                <div key={id} className="h-16 w-14 overflow-hidden rounded-lg bg-secondary">
                  {itemImageMap[id] && (
                    <img src={itemImageMap[id]} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Look no longer in wardrobe</p>
          )}
        </div>
      )}
    </div>
  )
}
