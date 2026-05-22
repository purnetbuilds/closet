import type { ClothingItem, Category, Season, Occasion } from './db'

export function getCleanItems(items: ClothingItem[]): ClothingItem[] {
  return items.filter((i) => i.laundryStatus === 'clean')
}

export function filterByCategory(items: ClothingItem[], category: Category): ClothingItem[] {
  return items.filter((i) => i.category === category)
}

export function filterByOccasion(items: ClothingItem[], occasion: Occasion): ClothingItem[] {
  return items.filter((i) => i.occasions.includes(occasion) || i.occasions.length === 0)
}

export function filterBySeason(items: ClothingItem[], season: Season): ClothingItem[] {
  return items.filter((i) => i.season.includes(season) || i.season.length === 0)
}

export function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'fall'
  return 'winter'
}

export function getUnwornItems(items: ClothingItem[], dayThreshold = 60): ClothingItem[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - dayThreshold)
  return items.filter((item) => {
    if (!item.lastWorn) return item.wearCount === 0
    return new Date(item.lastWorn) < cutoff
  })
}

export function sortByLastWorn(items: ClothingItem[]): ClothingItem[] {
  return [...items].sort((a, b) => {
    if (!a.lastWorn && !b.lastWorn) return 0
    if (!a.lastWorn) return -1
    if (!b.lastWorn) return 1
    return new Date(a.lastWorn).getTime() - new Date(b.lastWorn).getTime()
  })
}

export function itemsForPrompt(items: ClothingItem[]) {
  return items.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    colors: i.colors,
    season: i.season,
    occasions: i.occasions,
    tags: i.tags,
  }))
}

export const CATEGORY_LABELS: Record<Category, string> = {
  top: 'Tops',
  bottom: 'Bottoms',
  dress: 'Dresses',
  outerwear: 'Outerwear',
  shoes: 'Shoes',
  bag: 'Bags',
  accessory: 'Accessories',
  other: 'Other',
}

export const OCCASION_LABELS: Record<Occasion, string> = {
  work: 'Work',
  casual: 'Casual',
  formal: 'Formal',
  date: 'Date',
  gym: 'Gym',
}

export const OCCASION_EMOJIS: Record<Occasion, string> = {
  work: '💼',
  casual: '😊',
  formal: '✨',
  date: '💕',
  gym: '🏃',
}
