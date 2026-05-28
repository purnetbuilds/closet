'use client'

import { useState, useEffect, useRef } from 'react'
import { Camera, User, Loader2 } from 'lucide-react'
import { uploadProfilePhoto, getProfilePhotoUrl } from '@/lib/supabase'
import { toast } from './Toaster'

const PHOTO_CACHE_KEY = 'closet:profile-photo'

interface Props {
  /** Outfit content rendered below the hero photo strip */
  children: React.ReactNode
}

export function UserPhotoPanel({ children }: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(PHOTO_CACHE_KEY)
  })
  const [loading, setLoading] = useState(!photoUrl)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    getProfilePhotoUrl()
      .then((url) => {
        if (cancelled) return
        if (url) {
          setPhotoUrl(url)
          try {
            localStorage.setItem(PHOTO_CACHE_KEY, url)
          } catch {}
        } else {
          setPhotoUrl(null)
        }
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const url = await uploadProfilePhoto(file)
      const busted = url + '?t=' + Date.now()
      setPhotoUrl(busted)
      try {
        localStorage.setItem(PHOTO_CACHE_KEY, busted)
      } catch {}
      toast.success('Photo updated')
    } catch {
      toast.error('Upload failed — check Supabase config')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Compact avatar strip — keeps "you" anchored without dominating the canvas */}
      <div className="flex items-center gap-3 rounded-2xl bg-background/60 px-3 py-2.5 backdrop-blur-sm">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="press-sm relative size-14 shrink-0 overflow-hidden rounded-full bg-secondary"
          aria-label={photoUrl ? 'Change profile photo' : 'Add profile photo'}
        >
          {loading && !photoUrl ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          ) : photoUrl ? (
            <>
              <img
                src={photoUrl}
                alt="You"
                className="h-full w-full object-cover object-top"
              />
              <span className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/40 to-transparent pb-1 pt-2">
                {uploading ? (
                  <Loader2 size={11} className="animate-spin text-white" />
                ) : (
                  <Camera size={11} className="text-white" />
                )}
              </span>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <User size={20} />}
            </div>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Today&apos;s fit</p>
          <p className="truncate text-xs text-muted-foreground">
            {photoUrl ? 'Tap photo to update' : 'Add a photo so your outfits feel personal'}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {children}
    </div>
  )
}
