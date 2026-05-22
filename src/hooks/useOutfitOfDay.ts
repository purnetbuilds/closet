'use client'

import { useState, useCallback } from 'react'
import { generateOutfits, type GeneratedOutfit } from '@/lib/outfit-generator'
import { getAllClothing } from '@/lib/db'
import { getWearLogs } from '@/lib/storage'
import { getCurrentSeason } from '@/lib/outfit-utils'
import type { WeatherData } from '@/lib/weather'
import type { Occasion } from '@/lib/db'

export function useOutfitOfDay() {
  const [suggestions, setSuggestions] = useState<GeneratedOutfit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(
    (weather: WeatherData | null, occasion: Occasion | null) => {
      setLoading(true)
      setError(null)
      try {
        getAllClothing().then((items) => {
          if (items.length < 2) {
            setSuggestions([])
            setLoading(false)
            return
          }
          const recentlyWornIds = getWearLogs()
            .slice(-14)
            .flatMap((l) => l.outfitId ? [l.outfitId] : [])

          const includeOuterwear = weather !== null && weather.temp < 15

          const results = generateOutfits({
            items,
            occasion,
            season: getCurrentSeason(),
            recentlyWornIds,
            includeOuterwear,
          })
          setSuggestions(results)
          setLoading(false)
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to generate outfits')
        setLoading(false)
      }
    },
    []
  )

  return { suggestions, loading, error, generate }
}
