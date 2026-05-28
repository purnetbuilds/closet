'use client'

import type { Occasion } from '@/lib/db'
import { OCCASION_LABELS, OCCASION_EMOJIS } from '@/lib/outfit-utils'
import { cn } from '@/lib/utils'

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
            className={cn(
              'press-sm flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-foreground text-background'
                : 'bg-secondary/70 text-secondary-foreground hover:bg-secondary'
            )}
            style={{ transitionTimingFunction: 'var(--ease-out-strong)' }}
          >
            <span aria-hidden>{OCCASION_EMOJIS[o]}</span>
            <span>{OCCASION_LABELS[o]}</span>
          </button>
        )
      })}
    </div>
  )
}
