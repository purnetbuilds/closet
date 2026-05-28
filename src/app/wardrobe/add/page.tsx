'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Upload, ChevronLeft, X, Loader2, Sparkles } from 'lucide-react'
import { useWardrobe } from '@/hooks/useWardrobe'
import type { Category, Season, Occasion } from '@/lib/db'
import { CATEGORY_LABELS, OCCASION_LABELS } from '@/lib/outfit-utils'
import { uploadImage } from '@/lib/supabase'
import { extractDominantColors, nameForHex } from '@/lib/color-extract'
import { toast } from '@/components/Toaster'
import { cn } from '@/lib/utils'

const seasons: Season[] = ['spring', 'summer', 'fall', 'winter']
const categories: Category[] = ['top', 'bottom', 'dress', 'outerwear', 'shoes', 'bag', 'accessory', 'other']
const occasions: Occasion[] = ['work', 'casual', 'formal', 'date', 'gym']

function compressToBlob(file: File, maxWidth = 800): Promise<{ blob: Blob; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Compression failed'))
            return
          }
          resolve({ blob, previewUrl: canvas.toDataURL('image/jpeg', 0.8) })
        },
        'image/jpeg',
        0.8
      )
    }
    img.onerror = reject
    img.src = url
  })
}

export default function AddItemPage() {
  const router = useRouter()
  const { addItem } = useWardrobe()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [previewUrl, setPreviewUrl] = useState('')
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null)
  const [uploading, setUploading] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('top')
  const [selectedSeasons, setSelectedSeasons] = useState<Season[]>([])
  const [selectedOccasions, setSelectedOccasions] = useState<Occasion[]>([])
  const [extracted, setExtracted] = useState<string[]>([])
  const [excludedHex, setExcludedHex] = useState<Set<string>>(new Set())
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const { blob, previewUrl } = await compressToBlob(file)
      setPreviewUrl(previewUrl)
      setPendingBlob(blob)

      setExtracting(true)
      try {
        const colors = await extractDominantColors(blob, 4)
        setExtracted(colors)
        setExcludedHex(new Set())
      } catch {
        setExtracted([])
      } finally {
        setExtracting(false)
      }
    } finally {
      setUploading(false)
    }
  }

  function toggleSeason(s: Season) {
    setSelectedSeasons((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  function toggleOccasion(o: Occasion) {
    setSelectedOccasions((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]))
  }

  function toggleExcluded(hex: string) {
    setExcludedHex((prev) => {
      const next = new Set(prev)
      if (next.has(hex)) next.delete(hex)
      else next.add(hex)
      return next
    })
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const itemId = `item-${Date.now()}-${Math.random().toString(36).slice(2)}`
      let imageUrl = ''

      if (pendingBlob) {
        imageUrl = await uploadImage(pendingBlob, 'wardrobe', `${itemId}.jpg`)
      }

      const activeHex = extracted.filter((c) => !excludedHex.has(c))
      const colorList = [
        ...activeHex.map((hex) => hex),
        ...activeHex.map((hex) => nameForHex(hex)),
      ]
      // Dedupe while preserving order
      const colors = Array.from(new Set(colorList))

      await addItem({
        id: itemId,
        name: name.trim(),
        category,
        imageUrl,
        colors,
        season: selectedSeasons,
        occasions: selectedOccasions,
        tags: [],
        laundryStatus: 'clean',
        wearCount: 0,
        addedAt: new Date().toISOString(),
      })
      toast.success(`${name.trim()} added to your wardrobe`)
      router.push('/wardrobe')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Upload failed — check Supabase config')
      setSaving(false)
    }
  }

  const canSave = name.trim().length > 0 && !uploading

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="press rounded-full p-1 hover:bg-secondary"
          aria-label="Back"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-3xl font-semibold tracking-tight">Add item</h1>
      </div>

      <div className="flex flex-col items-center gap-3">
        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-48 w-40 rounded-2xl object-cover shadow-md"
            />
            <button
              onClick={() => {
                setPreviewUrl('')
                setPendingBlob(null)
                setExtracted([])
                setExcludedHex(new Set())
              }}
              className="press-sm absolute right-2 top-2 rounded-full bg-background/80 p-1 shadow backdrop-blur-sm"
              aria-label="Remove photo"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex h-48 w-40 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border bg-secondary/50">
            {uploading ? (
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            ) : (
              <>
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="press flex flex-col items-center gap-1 text-muted-foreground"
                >
                  <Camera size={28} />
                  <span className="text-xs">Camera</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="press flex flex-col items-center gap-1 text-muted-foreground"
                >
                  <Upload size={20} />
                  <span className="text-xs">Upload</span>
                </button>
              </>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. White linen shirt"
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-shadow focus:ring-2 focus:ring-foreground/20"
          />
        </div>

        {/* Extracted color chips */}
        {(extracting || extracted.length > 0) && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles size={13} className="text-[var(--accent-warm)]" />
              <span>Detected colors</span>
              {extracting && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
            </div>
            <div className="flex flex-wrap gap-2">
              {extracted.map((hex) => {
                const excluded = excludedHex.has(hex)
                return (
                  <button
                    key={hex}
                    onClick={() => toggleExcluded(hex)}
                    className={cn(
                      'press-sm flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs transition-[opacity,border-color] duration-200',
                      excluded
                        ? 'border-border bg-secondary/30 opacity-50 line-through'
                        : 'border-foreground/20 bg-secondary/60'
                    )}
                  >
                    <span
                      className="size-3 rounded-full ring-1 ring-background/60"
                      style={{ backgroundColor: hex }}
                    />
                    <span>{nameForHex(hex)}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Tap a chip to exclude it (e.g., background or trim color)
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  'press-sm rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  category === c
                    ? 'bg-foreground text-background'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Season</label>
          <div className="flex gap-2">
            {seasons.map((s) => (
              <button
                key={s}
                onClick={() => toggleSeason(s)}
                className={cn(
                  'press-sm flex-1 rounded-full py-1.5 text-sm font-medium capitalize transition-colors',
                  selectedSeasons.includes(s)
                    ? 'bg-foreground text-background'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Occasion</label>
          <div className="flex flex-wrap gap-2">
            {occasions.map((o) => (
              <button
                key={o}
                onClick={() => toggleOccasion(o)}
                className={cn(
                  'press-sm rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  selectedOccasions.includes(o)
                    ? 'bg-foreground text-background'
                    : 'bg-secondary text-secondary-foreground'
                )}
              >
                {OCCASION_LABELS[o]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        className="press mt-2 flex items-center justify-center gap-2 rounded-xl bg-foreground py-3.5 text-sm font-semibold text-background disabled:opacity-40"
      >
        {saving && <Loader2 size={16} className="animate-spin" />}
        {saving ? 'Uploading…' : 'Save to wardrobe'}
      </button>
    </div>
  )
}
