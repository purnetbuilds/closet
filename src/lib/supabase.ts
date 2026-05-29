import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error(
        'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
      )
    }
    _client = createClient(url, key)
  }
  return _client
}

const USER_FOLDER_KEY = 'closet:user-folder'

function getUserFolder(): string {
  let id = localStorage.getItem(USER_FOLDER_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(USER_FOLDER_KEY, id)
  }
  return id
}

/**
 * Turn a raw Supabase storage error into something a user can act on.
 * Raw messages like "Bucket not found" or RLS violations are opaque, so we
 * map the ones we expect and fall back to a generic-but-honest message.
 */
function describeUploadError(rawMessage: string, bucket: string): string {
  const msg = rawMessage.toLowerCase()
  if (msg.includes('bucket not found')) {
    return `Photo storage isn’t set up yet — the “${bucket}” bucket is missing in Supabase.`
  }
  if (msg.includes('row-level security') || msg.includes('violates') || msg.includes('unauthorized')) {
    return 'Photo upload isn’t permitted — check the storage policies in Supabase.'
  }
  if (msg.includes('exceeded') || msg.includes('too large') || msg.includes('payload')) {
    return 'That image is too large to upload.'
  }
  if (msg.includes('fetch') || msg.includes('network')) {
    return 'Couldn’t reach photo storage — check your connection and try again.'
  }
  return 'Couldn’t save the photo. Please try again.'
}

export async function uploadImage(
  file: File | Blob,
  bucket: 'wardrobe' | 'profile',
  filename: string
): Promise<string> {
  const supabase = getClient()
  const folder = getUserFolder()
  const path = `${folder}/${filename}`

  let error
  try {
    ;({ error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      contentType: 'image/jpeg',
    }))
  } catch (e) {
    // Network/transport failures reject instead of returning an error object.
    throw new Error(describeUploadError(e instanceof Error ? e.message : '', bucket))
  }
  if (error) throw new Error(describeUploadError(error.message, bucket))

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadProfilePhoto(file: File | Blob): Promise<string> {
  return uploadImage(file, 'profile', 'reference.jpg')
}

export async function getProfilePhotoUrl(): Promise<string | null> {
  try {
    const supabase = getClient()
    const folder = getUserFolder()
    const { data } = supabase.storage.from('profile').getPublicUrl(`${folder}/reference.jpg`)
    const res = await fetch(data.publicUrl, { method: 'HEAD' }).catch(() => null)
    if (!res || !res.ok) return null
    return data.publicUrl
  } catch {
    return null
  }
}
