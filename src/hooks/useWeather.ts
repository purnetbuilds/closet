'use client'

import { useState, useEffect } from 'react'
import { getWeatherByGeolocation, type WeatherData } from '@/lib/weather'

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getWeatherByGeolocation()
      .then((data) => setWeather(data))
      .finally(() => setLoading(false))
  }, [])

  return { weather, loading }
}
