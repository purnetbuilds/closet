import type { WeatherData } from '@/lib/weather'

export function WeatherBadge({ weather }: { weather: WeatherData | null }) {
  if (!weather) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
      <span>{weather.icon}</span>
      <span>{weather.temp}°C</span>
      <span className="text-muted-foreground">·</span>
      <span>{weather.condition}</span>
    </span>
  )
}
