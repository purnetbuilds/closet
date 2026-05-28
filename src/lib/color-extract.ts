/**
 * Lightweight dominant-color extraction using HSL bucketing.
 * Avoids the median-cut complexity — for outfit metadata this resolution is enough.
 */

interface Bucket {
  count: number
  rSum: number
  gSum: number
  bSum: number
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => n.toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break
      case gn: h = (bn - rn) / d + 2; break
      case bn: h = (rn - gn) / d + 4; break
    }
    h /= 6
  }
  return [h * 360, s * 100, l * 100]
}

function quantize(value: number, step: number) {
  return Math.round(value / step) * step
}

export async function extractDominantColors(
  source: Blob | string,
  k = 3
): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    let objectUrl: string | null = null

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const maxDim = 80
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        canvas.width = Math.max(1, Math.floor(img.width * scale))
        canvas.height = Math.max(1, Math.floor(img.height * scale))
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve([])
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data

        const buckets = new Map<string, Bucket>()

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const a = data[i + 3]
          if (a < 200) continue
          const [, sat, light] = rgbToHsl(r, g, b)
          // Skip near-white and near-black (background / shadow) unless saturated
          if (light > 95 || light < 6) continue
          if (sat < 6 && (light > 88 || light < 14)) continue

          const key = `${quantize(r, 32)}-${quantize(g, 32)}-${quantize(b, 32)}`
          const existing = buckets.get(key)
          if (existing) {
            existing.count++
            existing.rSum += r
            existing.gSum += g
            existing.bSum += b
          } else {
            buckets.set(key, { count: 1, rSum: r, gSum: g, bSum: b })
          }
        }

        const sorted = [...buckets.values()].sort((a, b) => b.count - a.count)
        const picks: string[] = []
        const seenHues = new Set<number>()

        for (const bucket of sorted) {
          if (picks.length >= k) break
          const r = Math.round(bucket.rSum / bucket.count)
          const g = Math.round(bucket.gSum / bucket.count)
          const b = Math.round(bucket.bSum / bucket.count)
          const [h] = rgbToHsl(r, g, b)
          const hueBin = Math.round(h / 20)
          if (seenHues.has(hueBin)) continue
          seenHues.add(hueBin)
          picks.push(rgbToHex(r, g, b))
        }

        resolve(picks)
      } catch {
        resolve([])
      } finally {
        if (objectUrl) URL.revokeObjectURL(objectUrl)
      }
    }

    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      resolve([])
    }

    if (typeof source === 'string') {
      img.src = source
    } else {
      objectUrl = URL.createObjectURL(source)
      img.src = objectUrl
    }
  })
}

/** Human-readable name for a hex color — coarse buckets, used to display labels. */
export function nameForHex(hex: string): string {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (!m) return hex
  const r = parseInt(m[1], 16)
  const g = parseInt(m[2], 16)
  const b = parseInt(m[3], 16)
  const [h, s, l] = rgbToHsl(r, g, b)

  if (l < 15) return 'black'
  if (l > 90 && s < 15) return 'white'
  if (s < 15) {
    if (l > 70) return 'cream'
    if (l > 45) return 'grey'
    return 'charcoal'
  }
  if (h < 15 || h >= 345) return 'red'
  if (h < 40) return 'orange'
  if (h < 65) return 'yellow'
  if (h < 100) return s < 30 ? 'olive' : 'green'
  if (h < 170) return 'green'
  if (h < 200) return 'teal'
  if (h < 245) return 'blue'
  if (h < 290) return 'purple'
  if (h < 330) return 'pink'
  return 'red'
}
