/**
 * Migration helper: Migrate trips from file storage to Clerk privateMetadata
 * This is a one-time migration that can be called from an API route if needed
 */
import { clerkClient } from '@clerk/nextjs/server'
import { getTripsByUserId } from './trips-storage'
import {
  getTripRecordsFromMetadata,
  updateTripsData,
  tripsDataToMetadata,
} from './trips-storage-clerk'

/**
 * Migrate trips from file storage to Clerk for a user
 * Returns number of trips migrated
 */
export async function migrateTripsToClerk(userId: string): Promise<number> {
  try {
    // Get trips from file storage
    const fileTrips = await getTripsByUserId(userId)

    if (fileTrips.length === 0) {
      console.log(`[migrateTripsToClerk] No trips to migrate for user ${userId}`)
      return 0
    }

    // Get existing trips from Clerk
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const existingTrips = getTripRecordsFromMetadata(user.privateMetadata)

    // Convert file trips to trip records
    const tripRecords = fileTrips.map((trip) => ({
      id: trip.id,
      trip,
      createdAt: trip.createdAt,
      updatedAt: trip.createdAt,
    }))

    // Merge with existing Clerk trips (file trips take precedence if IDs conflict)
    let updatedTrips = [...existingTrips]
    for (const fileRecord of tripRecords) {
      // Check if trip already exists in Clerk
      const existingIndex = updatedTrips.findIndex((t) => t.id === fileRecord.id)
      if (existingIndex >= 0) {
        // Update existing (file storage is source of truth for migration)
        updatedTrips[existingIndex] = fileRecord
      } else {
        // Add new
        updatedTrips.push(fileRecord)
      }
    }

    // Save to Clerk
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...user.privateMetadata,
        trips: tripsDataToMetadata(updatedTrips),
      },
    })

    console.log(`[migrateTripsToClerk] ✅ Migrated ${tripRecords.length} trips for user ${userId}`)
    return tripRecords.length
  } catch (error) {
    console.error(`[migrateTripsToClerk] ❌ Error migrating trips for user ${userId}:`, error)
    throw error
  }
}
