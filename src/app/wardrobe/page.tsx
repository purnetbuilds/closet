'use client'

import { useRouter } from 'next/navigation'
import { Plus, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useWardrobe } from '@/hooks/useWardrobe'
import { WardrobeGrid } from '@/components/WardrobeGrid'
import { getUnwornItems } from '@/lib/outfit-utils'

export default function WardrobePage() {
  const router = useRouter()
  const { items, loading, toggleLaundry } = useWardrobe()

  const unworn = getUnwornItems(items, 60)

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Wardrobe</h1>
        <Link
          href="/wardrobe/add"
          className="press flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          <Plus size={16} />
          Add
        </Link>
      </div>

      {unworn.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>
            {unworn.length} item{unworn.length > 1 ? 's' : ''} haven&apos;t been worn in 60+ days
          </span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="shimmer mx-auto h-32 w-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <WardrobeGrid
          items={items}
          onItemClick={(item) => router.push(`/wardrobe/${item.id}`)}
          onToggleLaundry={toggleLaundry}
        />
      )}
    </div>
  )
}
