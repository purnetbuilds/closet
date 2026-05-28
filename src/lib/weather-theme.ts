import type { WeatherData } from './weather'

/**
 * Returns OKLCH color stops used by the .weather-bg gradient.
 * Light mood, then a darker variant for dark mode.
 */
export function weatherTheme(weather: WeatherData | null): {
  light: { from: string; via: string; to: string }
  dark: { from: string; via: string; to: string }
} {
  if (!weather) {
    return {
      light: {
        from: 'oklch(0.99 0.01 95)',
        via: 'oklch(0.97 0.02 90)',
        to: 'oklch(0.99 0.005 80)',
      },
      dark: {
        from: 'oklch(0.18 0.01 250)',
        via: 'oklch(0.16 0.015 260)',
        to: 'oklch(0.14 0.005 270)',
      },
    }
  }

  const c = weather.condition.toLowerCase()
  const t = weather.temp

  // Cold (≤ 5°C) — cool blue
  if (t <= 5) {
    return {
      light: {
        from: 'oklch(0.96 0.04 240)',
        via: 'oklch(0.94 0.03 250)',
        to: 'oklch(0.97 0.015 230)',
      },
      dark: {
        from: 'oklch(0.22 0.04 240)',
        via: 'oklch(0.18 0.03 250)',
        to: 'oklch(0.14 0.02 260)',
      },
    }
  }

  // Hot (≥ 25°C) — warm sand
  if (t >= 25) {
    return {
      light: {
        from: 'oklch(0.96 0.06 65)',
        via: 'oklch(0.95 0.05 50)',
        to: 'oklch(0.97 0.03 70)',
      },
      dark: {
        from: 'oklch(0.24 0.06 60)',
        via: 'oklch(0.19 0.05 50)',
        to: 'oklch(0.15 0.03 55)',
      },
    }
  }

  // Rainy — slate blue
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) {
    return {
      light: {
        from: 'oklch(0.94 0.025 240)',
        via: 'oklch(0.92 0.02 245)',
        to: 'oklch(0.95 0.015 230)',
      },
      dark: {
        from: 'oklch(0.20 0.025 240)',
        via: 'oklch(0.17 0.02 245)',
        to: 'oklch(0.13 0.015 250)',
      },
    }
  }

  // Snow — bright neutral with subtle lavender
  if (c.includes('snow')) {
    return {
      light: {
        from: 'oklch(0.99 0.015 270)',
        via: 'oklch(0.97 0.02 280)',
        to: 'oklch(0.98 0.008 260)',
      },
      dark: {
        from: 'oklch(0.21 0.02 270)',
        via: 'oklch(0.18 0.018 280)',
        to: 'oklch(0.14 0.01 260)',
      },
    }
  }

  // Clear sky — warm gold wash
  if (c.includes('clear') || c.includes('sun')) {
    return {
      light: {
        from: 'oklch(0.97 0.05 85)',
        via: 'oklch(0.96 0.04 75)',
        to: 'oklch(0.98 0.025 90)',
      },
      dark: {
        from: 'oklch(0.22 0.04 85)',
        via: 'oklch(0.18 0.035 75)',
        to: 'oklch(0.14 0.02 80)',
      },
    }
  }

  // Cloudy / overcast / fog — neutral with a hint of green-grey
  return {
    light: {
      from: 'oklch(0.96 0.012 170)',
      via: 'oklch(0.94 0.015 180)',
      to: 'oklch(0.97 0.008 160)',
    },
    dark: {
      from: 'oklch(0.21 0.012 170)',
      via: 'oklch(0.18 0.015 180)',
      to: 'oklch(0.14 0.008 160)',
    },
  }
}
