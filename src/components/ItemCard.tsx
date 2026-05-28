'use client'

import { Droplets, Shirt } from 'lucide-react'
import type { ClothingItem } from '@/lib/db'
import { cn } from '@/lib/utils'

interface Props {
  item: ClothingItem
  onToggleLaundry?: () => void
  onClick?: () => void
  selected?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ItemCard({ item, onToggleLaundry, onClick, selected, size = 'md' }: Props) {
  const sizeClasses = {
    sm: 'h-24 w-20',
    md: 'h-32 w-28',
    lg: 'h-44 w-36',
  }

  const colorChips = item.colors.slice(0, 3).filter((c) => c && c.startsWith('#'))

  return (
    <div
      className={cn('relative flex flex-col gap-1', onClick && 'cursor-pointer')}
      onClick={onClick}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-xl bg-secondary transition-[box-shadow,transform] duration-200',
          sizeClasses[size],
          selected && 'ring-2 ring-foreground ring-offset-2 ring-offset-background',
          item.laundryStatus === 'dirty' && 'opacity-50'
        )}
        style={{ transitionTimingFunction: 'var(--ease-out-strong)' }}
      >
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
            <Shirt size={28} strokeWidth={1.3} />
          </div>
        )}

        {item.laundryStatus === 'dirty' && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <Droplets size={20} className="text-blue-400" />
          </div>
        )}

        {onToggleLaundry && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleLaundry()
            }}
            className="press-sm absolute right-1 top-1 rounded-full bg-background/80 p-1 shadow-sm backdrop-blur-sm"
            title={item.laundryStatus === 'clean' ? 'Mark dirty' : 'Mark clean'}
          >
            <Droplets
              size={14}
              className={item.laundryStatus === 'dirty' ? 'text-blue-400' : 'text-muted-foreground'}
            />
          </button>
        )}

        {colorChips.length > 0 && (
          <div className="absolute bottom-1 left-1 flex -space-x-1">
            {colorChips.map((c, i) => (
              <span
                key={i}
                className="size-2.5 rounded-full ring-1 ring-background/80"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
      </div>
      <p className="max-w-[7rem] truncate text-center text-xs text-muted-foreground">
        {item.name}
      </p>
    </div>
  )
}
