/**
 * Trips storage using Clerk's privateMetadata
 * This ensures trips persist across deployments and sync across devices
 */
import type { Trip } from '@/types'

interface TripRecord {
  id: string
  trip: Trip
  createdAt: string
  updatedAt: string
}

interface TripsData {
  trips: TripRecord[]
}

/**
 * Get trips from Clerk user metadata
 * This is a helper that will be used by API routes
 */
export function getTripsFromMetadata(metadata: any): Trip[] {
  const tripsData = (metadata?.trips || { trips: [] }) as TripsData
  return tripsData.trips.map((record) => record.trip)
}

/**
 * Get trip records (with metadata) from Clerk user metadata
 * Returns the full TripRecord[] array, not just Trip[]
 */
export function getTripRecordsFromMetadata(metadata: any): TripRecord[] {
  const tripsData = (metadata?.trips || { trips: [] }) as TripsData
  return tripsData.trips || []
}

/**
 * Get a single trip from metadata
 */
export function getTripFromMetadata(metadata: any, tripId: string): Trip | null {
  const tripsData = (metadata?.trips || { trips: [] }) as TripsData
  const record = tripsData.trips.find((t) => t.id === tripId)
  return record ? record.trip : null
}

/**
 * Create a new trip record
 */
export function createTripRecord(trip: Omit<Trip, 'id' | 'createdAt'>): TripRecord {
  const now = new Date().toISOString()
  const newTrip: Trip = {
    ...trip,
    id: `trip-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    createdAt: now,
  }
  return {
    id: newTrip.id,
    trip: newTrip,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Update trips data with a new or updated trip
 */
export function updateTripsData(
  existingTrips: TripRecord[],
  tripRecord: TripRecord
): TripRecord[] {
  const index = existingTrips.findIndex((t) => t.id === tripRecord.id)
  if (index >= 0) {
    // Update existing
    const updated = [...existingTrips]
    updated[index] = {
      ...tripRecord,
      updatedAt: new Date().toISOString(),
    }
    return updated
  } else {
    // Add new
    return [...existingTrips, tripRecord]
  }
}

/**
 * Remove a trip from trips data
 */
export function removeTripFromData(trips: TripRecord[], tripId: string): TripRecord[] {
  return trips.filter((t) => t.id !== tripId)
}

/**
 * Convert trips data to metadata format
 */
export function tripsDataToMetadata(trips: TripRecord[]): any {
  return {
    trips: {
      trips,
    },
  }
}
