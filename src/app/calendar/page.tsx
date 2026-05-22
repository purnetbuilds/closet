'use client'

import { useState, useEffect } from 'react'
import { getAllOutfits, getAllClothing, type Outfit, type ClothingItem } from '@/lib/db'
import { CalendarView } from '@/components/CalendarView'

export default function CalendarPage() {
  const [outfits, setOutfits] = useState<Outfit[]>([])
  const [itemImageMap, setItemImageMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [allOutfits, allItems] = await Promise.all([getAllOutfits(), getAllClothing()])
      setOutfits(allOutfits)
      setItemImageMap(Object.fromEntries(allItems.map((i) => [i.id, i.imageUrl])))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <h1 className="text-xl font-semibold">Wear History</h1>
      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-secondary" />
      ) : (
        <CalendarView outfits={outfits} itemImageMap={itemImageMap} />
      )}
    </div>
  )
}
