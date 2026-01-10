import { promises as fs } from 'fs'
import path from 'path'
import type { Trip } from '@/types'

// Store trips in a JSON file in the project root
const TRIPS_FILE = path.join(process.cwd(), 'data', 'trips.json')

interface TripRecord {
  id: string
  ownerUserId: string
  trip: Trip
  createdAt: string
  updatedAt: string
}

interface TripsData {
  trips: TripRecord[]
}

// Ensure data directory exists
async function ensureDataDir(): Promise<void> {
  const dataDir = path.dirname(TRIPS_FILE)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Load trips from file
async function loadTrips(): Promise<TripsData> {
  await ensureDataDir()
  try {
    const content = await fs.readFile(TRIPS_FILE, 'utf-8')
    return JSON.parse(content) as TripsData
  } catch {
    // File doesn't exist, return empty data
    return { trips: [] }
  }
}

// Save trips to file
async function saveTrips(data: TripsData): Promise<void> {
  await ensureDataDir()
  await fs.writeFile(TRIPS_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// Get all trips for a user
export async function getTripsByUserId(userId: string): Promise<Trip[]> {
  const data = await loadTrips()
  return data.trips
    .filter((record) => record.ownerUserId === userId)
    .map((record) => record.trip)
}

// Get a single trip by ID (only if owned by user)
export async function getTripById(tripId: string, userId: string): Promise<Trip | null> {
  const data = await loadTrips()
  const record = data.trips.find(
    (t) => t.id === tripId && t.ownerUserId === userId
  )
  return record ? record.trip : null
}

// Create a new trip
export async function createTrip(trip: Omit<Trip, 'id' | 'createdAt'>, userId: string): Promise<Trip> {
  const data = await loadTrips()
  const now = new Date().toISOString()
  const newTrip: Trip = {
    ...trip,
    id: `trip-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: now,
  }
  const record: TripRecord = {
    id: newTrip.id,
    ownerUserId: userId,
    trip: newTrip,
    createdAt: now,
    updatedAt: now,
  }
  data.trips.push(record)
  await saveTrips(data)
  return newTrip
}

// Update an existing trip (only if owned by user)
export async function updateTrip(tripId: string, updates: Partial<Trip>, userId: string): Promise<Trip | null> {
  const data = await loadTrips()
  const record = data.trips.find(
    (t) => t.id === tripId && t.ownerUserId === userId
  )
  if (!record) {
    return null
  }
  record.trip = { ...record.trip, ...updates }
  record.updatedAt = new Date().toISOString()
  await saveTrips(data)
  return record.trip
}

// Delete a trip (only if owned by user)
export async function deleteTrip(tripId: string, userId: string): Promise<boolean> {
  const data = await loadTrips()
  const index = data.trips.findIndex(
    (t) => t.id === tripId && t.ownerUserId === userId
  )
  if (index === -1) {
    return false
  }
  data.trips.splice(index, 1)
  await saveTrips(data)
  return true
}
