import type { Occasion } from './db'

export interface WearLog {
  id: string
  outfitId: string
  date: string
  occasion?: Occasion
  weatherSummary?: string
  notes?: string
}

export interface AppSettings {
  locationLat?: number
  locationLon?: number
  locationName?: string
  onboardingDone: boolean
}

const WEAR_LOGS_KEY = 'closet:wear-logs'
const SETTINGS_KEY = 'closet:settings'

export function getWearLogs(): WearLog[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(WEAR_LOGS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveWearLog(log: WearLog): void {
  const logs = getWearLogs()
  const idx = logs.findIndex((l) => l.id === log.id)
  if (idx >= 0) {
    logs[idx] = log
  } else {
    logs.push(log)
  }
  localStorage.setItem(WEAR_LOGS_KEY, JSON.stringify(logs))
}

export function getWearLogForDate(date: string): WearLog | undefined {
  return getWearLogs().find((l) => l.date === date)
}

export function getWearLogsByMonth(year: number, month: number): WearLog[] {
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  return getWearLogs().filter((l) => l.date.startsWith(prefix))
}

export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return { onboardingDone: false }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? JSON.parse(raw) : { onboardingDone: false }
  } catch {
    return { onboardingDone: false }
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function updateSettings(partial: Partial<AppSettings>): void {
  const current = getSettings()
  saveSettings({ ...current, ...partial })
}
