'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getAllClothing,
  saveClothingItem,
  deleteClothingItem,
  type ClothingItem,
} from '@/lib/db'

export function useWardrobe() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const all = await getAllClothing()
    setItems(all.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()))
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const addItem = useCallback(
    async (item: ClothingItem) => {
      await saveClothingItem(item)
      await load()
    },
    [load]
  )

  const updateItem = useCallback(
    async (item: ClothingItem) => {
      await saveClothingItem(item)
      await load()
    },
    [load]
  )

  const removeItem = useCallback(
    async (id: string) => {
      await deleteClothingItem(id)
      await load()
    },
    [load]
  )

  const toggleLaundry = useCallback(
    async (id: string) => {
      const item = items.find((i) => i.id === id)
      if (!item) return
      await saveClothingItem({
        ...item,
        laundryStatus: item.laundryStatus === 'clean' ? 'dirty' : 'clean',
      })
      await load()
    },
    [items, load]
  )

  return { items, loading, addItem, updateItem, removeItem, toggleLaundry, refresh: load }
}
