import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

export type Category =
  | 'top'
  | 'bottom'
  | 'dress'
  | 'outerwear'
  | 'shoes'
  | 'bag'
  | 'accessory'
  | 'other'

export type Season = 'spring' | 'summer' | 'fall' | 'winter'

export type Occasion = 'work' | 'casual' | 'formal' | 'date' | 'gym'

export type LaundryStatus = 'clean' | 'dirty'

export interface ClothingItem {
  id: string
  name: string
  category: Category
  imageUrl: string
  colors: string[]
  season: Season[]
  occasions: Occasion[]
  tags: string[]
  laundryStatus: LaundryStatus
  lastWorn?: string
  wearCount: number
  addedAt: string
}

export interface Outfit {
  id: string
  name?: string
  itemIds: string[]
  occasion?: Occasion
  createdAt: string
  isSaved: boolean
  rating?: 1 | -1
  aiReasoning?: string
}

export interface Capsule {
  id: string
  name: string
  itemIds: string[]
  dateRange?: { start: string; end: string }
  createdAt: string
  generatedPlan?: CapsuleDayPlan[]
}

export interface CapsuleDayPlan {
  date: string
  occasion: Occasion
  itemIds: string[]
  reasoning: string
}

interface ClosetDB extends DBSchema {
  clothing: {
    key: string
    value: ClothingItem
    indexes: { 'by-category': string; 'by-laundry': string }
  }
  outfits: {
    key: string
    value: Outfit
    indexes: { 'by-saved': number }
  }
  capsules: {
    key: string
    value: Capsule
  }
}

let dbPromise: Promise<IDBPDatabase<ClosetDB>> | null = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ClosetDB>('closet-db', 1, {
      upgrade(db) {
        const clothingStore = db.createObjectStore('clothing', { keyPath: 'id' })
        clothingStore.createIndex('by-category', 'category')
        clothingStore.createIndex('by-laundry', 'laundryStatus')

        const outfitStore = db.createObjectStore('outfits', { keyPath: 'id' })
        outfitStore.createIndex('by-saved', 'isSaved')

        db.createObjectStore('capsules', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

export async function getAllClothing(): Promise<ClothingItem[]> {
  const db = await getDB()
  return db.getAll('clothing')
}

export async function getClothingItem(id: string): Promise<ClothingItem | undefined> {
  const db = await getDB()
  return db.get('clothing', id)
}

export async function saveClothingItem(item: ClothingItem): Promise<void> {
  const db = await getDB()
  await db.put('clothing', item)
}

export async function deleteClothingItem(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('clothing', id)
}

export async function getCleanClothing(): Promise<ClothingItem[]> {
  const db = await getDB()
  return db.getAllFromIndex('clothing', 'by-laundry', 'clean')
}

export async function getAllOutfits(): Promise<Outfit[]> {
  const db = await getDB()
  return db.getAll('outfits')
}

export async function getSavedOutfits(): Promise<Outfit[]> {
  const db = await getDB()
  const all = await db.getAll('outfits')
  return all.filter((o) => o.isSaved)
}

export async function saveOutfit(outfit: Outfit): Promise<void> {
  const db = await getDB()
  await db.put('outfits', outfit)
}

export async function deleteOutfit(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('outfits', id)
}

export async function getAllCapsules(): Promise<Capsule[]> {
  const db = await getDB()
  return db.getAll('capsules')
}

export async function saveCapsule(capsule: Capsule): Promise<void> {
  const db = await getDB()
  await db.put('capsules', capsule)
}

export async function deleteCapsule(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('capsules', id)
}
