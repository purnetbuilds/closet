const CACHE_KEY = 'closet:weather-cache'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours

export interface WeatherData {
  temp: number
  condition: string
  icon: string
  fetchedAt: number
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number
    weather_code: number
  }
}

function wmoCodeToCondition(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: 'Clear sky', icon: '☀️' }
  if (code <= 2) return { condition: 'Partly cloudy', icon: '⛅' }
  if (code === 3) return { condition: 'Overcast', icon: '☁️' }
  if (code <= 49) return { condition: 'Foggy', icon: '🌫️' }
  if (code <= 59) return { condition: 'Drizzle', icon: '🌦️' }
  if (code <= 69) return { condition: 'Rain', icon: '🌧️' }
  if (code <= 79) return { condition: 'Snow', icon: '❄️' }
  if (code <= 82) return { condition: 'Rain showers', icon: '🌧️' }
  if (code <= 86) return { condition: 'Snow showers', icon: '🌨️' }
  if (code <= 99) return { condition: 'Thunderstorm', icon: '⛈️' }
  return { condition: 'Unknown', icon: '🌡️' }
}

function getCached(): WeatherData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data: WeatherData = JSON.parse(raw)
    if (Date.now() - data.fetchedAt > CACHE_TTL_MS) return null
    return data
  } catch {
    return null
  }
}

function setCache(data: WeatherData): void {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data))
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const cached = getCached()
  if (cached) return cached

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=celsius`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Weather fetch failed')
  const json: OpenMeteoResponse = await res.json()

  const { condition, icon } = wmoCodeToCondition(json.current.weather_code)
  const data: WeatherData = {
    temp: Math.round(json.current.temperature_2m),
    condition,
    icon,
    fetchedAt: Date.now(),
  }
  setCache(data)
  return data
}

export async function getWeatherByGeolocation(): Promise<WeatherData | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await fetchWeather(pos.coords.latitude, pos.coords.longitude)
          resolve(data)
        } catch {
          resolve(null)
        }
      },
      () => resolve(null),
      { timeout: 5000 }
    )
  })
}
