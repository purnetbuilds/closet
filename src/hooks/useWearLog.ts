'use client'

import { useState, useCallback } from 'react'
import { saveWearLog, getWearLogs, getWearLogForDate, type WearLog } from '@/lib/storage'
import { saveClothingItem } from '@/lib/db'
import type { ClothingItem } from '@/lib/db'

export function useWearLog() {
  const [logs] = useState<WearLog[]>(getWearLogs())

  const logWear = useCallback(
    async (outfitId: string, itemsWorn: ClothingItem[], weatherSummary?: string) => {
      const today = new Date().toISOString().split('T')[0]
      const log: WearLog = {
        id: `${today}-${outfitId}`,
        outfitId,
        date: today,
        weatherSummary,
      }
      saveWearLog(log)

      const now = new Date().toISOString()
      for (const item of itemsWorn) {
        await saveClothingItem({
          ...item,
          lastWorn: now,
          wearCount: item.wearCount + 1,
        })
      }
    },
    []
  )

  const getTodayLog = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    return getWearLogForDate(today)
  }, [])

  return { logs, logWear, getTodayLog }
}
