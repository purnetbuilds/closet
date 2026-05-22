'use client'

import { useState, useEffect, useRef } from 'react'
import { Camera, Upload, User, X, Loader2 } from 'lucide-react'
import { uploadProfilePhoto, getProfilePhotoUrl } from '@/lib/supabase'

interface Props {
  /** Called when outfit items should be shown alongside this panel */
  children: React.ReactNode
}

export function UserPhotoPanel({ children }: Props) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getProfilePhotoUrl()
      .then((url) => setPhotoUrl(url))
      .finally(() => setLoading(false))
  }, [])

  async function handleFile(file: File) {
    setUploading(true)
    try {
      const url = await uploadProfilePhoto(file)
      // bust cache
      setPhotoUrl(url + '?t=' + Date.now())
    } catch {
      alert('Photo upload failed. Check your Supabase config.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex gap-3">
      {/* Left: user photo */}
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <div className="relative h-44 w-28 overflow-hidden rounded-2xl bg-secondary">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : photoUrl ? (
            <>
              <img src={photoUrl} alt="You" className="h-full w-full object-cover object-top" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1.5 right-1.5 rounded-full bg-background/80 p-1 shadow backdrop-blur-sm"
                title="Change photo"
              >
                {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
              </button>
            </>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground"
            >
              {uploading ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <>
                  <User size={28} />
                  <span className="px-2 text-center text-[10px] leading-tight">Add your photo</span>
                </>
              )}
            </button>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">You</span>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      {/* Right: outfit items */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
