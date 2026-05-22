'use client'

import type { Occasion } from '@/lib/db'
import { OCCASION_LABELS, OCCASION_EMOJIS } from '@/lib/outfit-utils'

const occasions: Occasion[] = ['work', 'casual', 'formal', 'date', 'gym']

interface Props {
  selected: Occasion | null
  onChange: (o: Occasion | null) => void
}

export function OccasionPicker({ selected, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {occasions.map((o) => {
        const active = selected === o
        return (
          <button
            key={o}
            onClick={() => onChange(active ? null : o)}
            className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-foreground text-background'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            <span>{OCCASION_EMOJIS[o]}</span>
            <span>{OCCASION_LABELS[o]}</span>
          </button>
        )
      })}
    </div>
  )
}
