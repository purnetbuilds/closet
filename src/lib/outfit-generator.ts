import type { ClothingItem, Occasion, Season } from './db'

export interface GeneratedOutfit {
  itemIds: string[]
  reasoning: string
}

const NEUTRAL_COLORS = ['white', 'black', 'grey', 'gray', 'navy', 'beige', 'cream', 'nude', 'tan', 'brown', 'camel', 'ivory', 'off-white', 'charcoal']

function isNeutral(colors: string[]): boolean {
  return colors.some((c) => NEUTRAL_COLORS.some((n) => c.toLowerCase().includes(n)))
}

function colorsCompatible(a: ClothingItem, b: ClothingItem): boolean {
  if (isNeutral(a.colors) || isNeutral(b.colors)) return true
  // Same color family (rough match on first word)
  const aBase = a.colors[0]?.toLowerCase().split(' ').pop() ?? ''
  const bBase = b.colors[0]?.toLowerCase().split(' ').pop() ?? ''
  return aBase === bBase
}

function itemPenalty(item: ClothingItem, recentIds: string[]): number {
  return recentIds.includes(item.id) ? 1 : 0
}

function pickBest<T extends ClothingItem>(
  pool: T[],
  used: Set<string>,
  anchor: ClothingItem | null,
  recentIds: string[]
): T | null {
  const available = pool.filter((i) => !used.has(i.id))
  if (available.length === 0) return null

  return available.sort((a, b) => {
    const aScore =
      itemPenalty(a, recentIds) * 10 -
      (anchor ? (colorsCompatible(anchor, a) ? 0 : 5) : 0)
    const bScore =
      itemPenalty(b, recentIds) * 10 -
      (anchor ? (colorsCompatible(anchor, b) ? 0 : 5) : 0)
    return aScore - bScore || Math.random() - 0.5
  })[0]
}

function buildOutfit(
  tops: ClothingItem[],
  bottoms: ClothingItem[],
  dresses: ClothingItem[],
  shoes: ClothingItem[],
  bags: ClothingItem[],
  outerwear: ClothingItem[],
  used: Set<string>,
  recentIds: string[],
  preferDress: boolean
): GeneratedOutfit | null {
  const ids: string[] = []
  let anchor: ClothingItem | null = null
  let style = ''

  if (preferDress && dresses.length > 0) {
    const dress = pickBest(dresses, used, null, recentIds)
    if (dress) {
      ids.push(dress.id)
      used.add(dress.id)
      anchor = dress
      style = 'dress'
    }
  }

  if (style !== 'dress') {
    const top = pickBest(tops, used, null, recentIds)
    if (!top) return null
    ids.push(top.id)
    used.add(top.id)
    anchor = top
    style = 'top'

    const bottom = pickBest(bottoms, used, anchor, recentIds)
    if (!bottom) return null
    ids.push(bottom.id)
    used.add(bottom.id)
  }

  const shoe = pickBest(shoes, used, anchor, recentIds)
  if (shoe) { ids.push(shoe.id); used.add(shoe.id) }

  const bag = pickBest(bags, used, anchor, recentIds)
  if (bag) { ids.push(bag.id); used.add(bag.id) }

  // Add outerwear if weather is cold (caller passes filtered items)
  const coat = pickBest(outerwear, used, anchor, recentIds)
  if (coat) { ids.push(coat.id); used.add(coat.id) }

  if (ids.length < 2) return null

  const reasoning = reasoningLine(style, anchor, shoe)
  return { itemIds: ids, reasoning }
}

function reasoningLine(
  style: string,
  anchor: ClothingItem | null,
  shoe: ClothingItem | null
): string {
  const anchorColor = anchor?.colors[0] ?? ''
  const shoeType = shoe?.name ?? 'shoes'
  if (style === 'dress') return `Easy one-piece with ${shoeType} — minimal effort, polished result.`
  if (anchorColor) return `${anchorColor} top paired with complementary bottoms and ${shoeType}.`
  return `Classic combination with matching ${shoeType}.`
}

export interface GenerateParams {
  items: ClothingItem[]
  occasion: Occasion | null
  season: Season
  recentlyWornIds: string[]
  includeOuterwear: boolean
}

export function generateOutfits(params: GenerateParams): GeneratedOutfit[] {
  const { items, occasion, season, recentlyWornIds, includeOuterwear } = params

  const clean = items.filter((i) => i.laundryStatus === 'clean')

  const seasonFiltered = clean.filter(
    (i) => i.season.length === 0 || i.season.includes(season)
  )

  const pool =
    occasion
      ? seasonFiltered.filter((i) => i.occasions.length === 0 || i.occasions.includes(occasion))
      : seasonFiltered

  const byCategory = (cat: string) => pool.filter((i) => i.category === cat)

  const tops = byCategory('top')
  const bottoms = byCategory('bottom')
  const dresses = byCategory('dress')
  const shoes = byCategory('shoes')
  const bags = byCategory('bag')
  const outerwear = includeOuterwear ? byCategory('outerwear') : []

  const outfits: GeneratedOutfit[] = []
  const globalUsed = new Set<string>()

  // Attempt 1: dress look
  if (dresses.length > 0) {
    const used = new Set<string>()
    const o = buildOutfit(tops, bottoms, dresses, shoes, bags, outerwear, used, recentlyWornIds, true)
    if (o) {
      outfits.push(o)
      o.itemIds.forEach((id) => globalUsed.add(id))
    }
  }

  // Attempt 2 & 3: top + bottom looks (use different pieces each time)
  for (let i = outfits.length; i < 3; i++) {
    const used = new Set<string>(globalUsed)
    const o = buildOutfit(tops, bottoms, dresses, shoes, bags, outerwear, used, recentlyWornIds, false)
    if (o) {
      outfits.push(o)
      // Only globally lock the anchor pieces so shoes/bags can vary
      used.forEach((id) => {
        const isAnchor = [o.itemIds[0], o.itemIds[1]].includes(id)
        if (isAnchor) globalUsed.add(id)
      })
    } else {
      break
    }
  }

  return outfits.slice(0, 3)
}

export function generateCapsulePlan(
  items: ClothingItem[],
  days: Array<{ date: string; occasion: Occasion }>,
  season: Season
): Array<{ date: string; occasion: Occasion; itemIds: string[]; reasoning: string }> {
  const globalUsed = new Set<string>()

  return days.map((day) => {
    const byCategory = (cat: string) =>
      items.filter(
        (i) =>
          i.category === cat &&
          i.laundryStatus === 'clean' &&
          (i.occasions.length === 0 || i.occasions.includes(day.occasion)) &&
          (i.season.length === 0 || i.season.includes(season))
      )

    const used = new Set<string>()
    const o = buildOutfit(
      byCategory('top'),
      byCategory('bottom'),
      byCategory('dress'),
      byCategory('shoes'),
      byCategory('bag'),
      [],
      used,
      [...globalUsed],
      Math.random() > 0.5
    )

    const outfit = o ?? { itemIds: items.slice(0, 2).map((i) => i.id), reasoning: 'Fallback pick.' }
    outfit.itemIds.forEach((id) => globalUsed.add(id))

    return { date: day.date, occasion: day.occasion, ...outfit }
  })
}
