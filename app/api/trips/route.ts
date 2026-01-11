import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import {
  getTripsFromMetadata,
  getTripRecordsFromMetadata,
  createTripRecord,
  updateTripsData,
  tripsDataToMetadata,
} from '@/lib/trips-storage-clerk'
import type { Trip } from '@/types'

// GET /api/trips - Get all trips for the current user
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get trips from Clerk user metadata
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const trips = getTripsFromMetadata(user.privateMetadata)

    return NextResponse.json({ trips })
  } catch (error) {
    console.error('[Trips API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trips' },
      { status: 500 }
    )
  }
}

// POST /api/trips - Create a new trip
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, startDate, endDate, baseLocation, learningTarget } = body

    // Validate required fields
    if (!title || !startDate || !endDate || !baseLocation) {
      return NextResponse.json(
        { error: 'Missing required fields: title, startDate, endDate, baseLocation' },
        { status: 400 }
      )
    }

    // Get existing trips from Clerk
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    
    console.log('[Trips API] User metadata before update:', {
      hasMetadata: !!user.privateMetadata,
      metadataKeys: user.privateMetadata ? Object.keys(user.privateMetadata) : [],
      existingTripsCount: getTripRecordsFromMetadata(user.privateMetadata).length,
    })
    
    const existingTrips = getTripRecordsFromMetadata(user.privateMetadata)

    // Create new trip record
    const tripRecord = createTripRecord({
      title,
      startDate,
      endDate,
      baseLocation,
      learningTarget,
    })

    console.log('[Trips API] Created trip record:', {
      id: tripRecord.id,
      title: tripRecord.trip.title,
    })

    // Update trips in metadata
    const updatedTrips = updateTripsData(existingTrips, tripRecord)
    
    console.log('[Trips API] Updated trips count:', updatedTrips.length)

    // Prepare metadata - ensure we preserve ALL existing metadata
    const existingMetadata = user.privateMetadata || {}
    const tripsMetadata = tripsDataToMetadata(updatedTrips)
    
    const newMetadata = {
      ...existingMetadata,
      ...tripsMetadata,
    }
    
    console.log('[Trips API] Metadata to save:', {
      keys: Object.keys(newMetadata),
      tripsCount: Array.isArray(newMetadata.trips) ? newMetadata.trips.length : 'not array',
      hasPathways: !!newMetadata.pathways,
      hasScheduleBlocks: !!newMetadata.scheduleBlocks,
    })

    // Save to Clerk - pass entire metadata object
    try {
      await client.users.updateUserMetadata(userId, {
        privateMetadata: newMetadata,
      })
      console.log('[Trips API] ✅ Trip created and saved to Clerk:', tripRecord.id)
    } catch (metadataError) {
      console.error('[Trips API] ❌ Error updating user metadata:', metadataError)
      console.error('[Trips API] Metadata update error details:', {
        message: metadataError instanceof Error ? metadataError.message : String(metadataError),
        stack: metadataError instanceof Error ? metadataError.stack : undefined,
        name: metadataError instanceof Error ? metadataError.name : undefined,
        userId,
        metadataSize: JSON.stringify(newMetadata).length,
        tripsCount: updatedTrips.length,
      })
      throw metadataError
    }

    return NextResponse.json({ trip: tripRecord.trip }, { status: 201 })
  } catch (error) {
    console.error('[Trips API] POST error:', error)
    
    // Try to get userId for logging (might fail if auth error)
    let userIdForLogging = 'unknown'
    try {
      const authResult = await auth()
      userIdForLogging = authResult.userId || 'no-user-id'
    } catch {
      userIdForLogging = 'auth-error'
    }
    
    console.error('[Trips API] POST error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      userId: userIdForLogging,
    })
    
    // Check for specific Clerk errors
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
      return NextResponse.json(
        { error: 'Unauthorized - please sign in to create trips' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create trip',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
