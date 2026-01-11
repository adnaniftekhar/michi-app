import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import {
  getTripsFromMetadata,
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
    const existingTrips = (user.privateMetadata?.trips?.trips || []) as any[]

    // Create new trip record
    const tripRecord = createTripRecord({
      title,
      startDate,
      endDate,
      baseLocation,
      learningTarget,
    })

    // Update trips in metadata
    const updatedTrips = updateTripsData(existingTrips, tripRecord)

    // Save to Clerk
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...user.privateMetadata,
        trips: tripsDataToMetadata(updatedTrips),
      },
    })

    console.log('[Trips API] ✅ Trip created and saved to Clerk:', tripRecord.id)

    return NextResponse.json({ trip: tripRecord.trip }, { status: 201 })
  } catch (error) {
    console.error('[Trips API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    )
  }
}
