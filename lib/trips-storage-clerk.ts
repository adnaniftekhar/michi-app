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
 * Metadata structure: { trips: TripRecord[] }
 */
export function getTripsFromMetadata(metadata: any): Trip[] {
  // Handle both old format { trips: { trips: [...] } } and new format { trips: [...] }
  let tripRecords: TripRecord[] = []
  if (metadata?.trips) {
    if (Array.isArray(metadata.trips)) {
      // New format: trips is directly an array
      tripRecords = metadata.trips
    } else if (metadata.trips.trips && Array.isArray(metadata.trips.trips)) {
      // Old format: trips.trips is the array (for backward compatibility)
      tripRecords = metadata.trips.trips
    }
  }
  return tripRecords.map((record) => record.trip)
}

/**
 * Get trip records (with metadata) from Clerk user metadata
 * Returns the full TripRecord[] array, not just Trip[]
 * Metadata structure: { trips: TripRecord[] }
 */
export function getTripRecordsFromMetadata(metadata: any): TripRecord[] {
  // Handle both old format { trips: { trips: [...] } } and new format { trips: [...] }
  if (metadata?.trips) {
    if (Array.isArray(metadata.trips)) {
      // New format: trips is directly an array
      return metadata.trips
    } else if (metadata.trips.trips && Array.isArray(metadata.trips.trips)) {
      // Old format: trips.trips is the array (for backward compatibility)
      return metadata.trips.trips
    }
  }
  return []
}

/**
 * Get a single trip from metadata
 * Metadata structure: { trips: TripRecord[] }
 */
export function getTripFromMetadata(metadata: any, tripId: string): Trip | null {
  const tripRecords = getTripRecordsFromMetadata(metadata)
  const record = tripRecords.find((t) => t.id === tripId)
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
 * Returns the structure: { trips: TripRecord[] }
 */
export function tripsDataToMetadata(trips: TripRecord[]): any {
  return {
    trips,
  }
}
