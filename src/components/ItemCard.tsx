'use client'

import { Droplets } from 'lucide-react'
import type { ClothingItem } from '@/lib/db'

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

  return (
    <div
      className={`relative flex flex-col gap-1 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div
        className={`relative overflow-hidden rounded-xl bg-secondary ${sizeClasses[size]} ${
          selected ? 'ring-2 ring-foreground' : ''
        } ${item.laundryStatus === 'dirty' ? 'opacity-50' : ''}`}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">
            👗
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
            className="absolute right-1 top-1 rounded-full bg-background/80 p-1 shadow-sm backdrop-blur-sm"
            title={item.laundryStatus === 'clean' ? 'Mark dirty' : 'Mark clean'}
          >
            <Droplets
              size={14}
              className={item.laundryStatus === 'dirty' ? 'text-blue-400' : 'text-muted-foreground'}
            />
          </button>
        )}
      </div>
      <p className="max-w-[7rem] truncate text-center text-xs text-muted-foreground">{item.name}</p>
    </div>
  )
}
