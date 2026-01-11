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

    // CRITICAL: Read body as text FIRST, then parse
    // This avoids the body stream consumption issue where request.json() 
    // consumes the stream and then we can't fallback to request.text()
    let body: any
    let bodyText: string
    try {
      bodyText = await request.text()
    } catch (readError) {
      console.error('[Trips API] Failed to read request body:', readError)
      return NextResponse.json(
        { error: 'Failed to read request body', details: readError instanceof Error ? readError.message : String(readError) },
        { status: 400 }
      )
    }

    if (!bodyText || bodyText.trim() === '') {
      return NextResponse.json(
        { error: 'Request body is empty' },
        { status: 400 }
      )
    }

    try {
      body = JSON.parse(bodyText)
    } catch (parseError) {
      console.error('[Trips API] JSON parse error:', parseError)
      console.error('[Trips API] Body text was:', bodyText.substring(0, 500))
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: parseError instanceof Error ? parseError.message : String(parseError) },
        { status: 400 }
      )
    }

    const { title, startDate, endDate, baseLocation, learningTarget } = body

    if (!title || !startDate || !endDate || !baseLocation) {
      return NextResponse.json(
        { error: 'Missing required fields: title, startDate, endDate, baseLocation' },
        { status: 400 }
      )
    }

    // Get existing trips from Clerk
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const existingTrips = getTripRecordsFromMetadata(user.privateMetadata)

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

    // Save to Clerk - merge with existing metadata to preserve pathways, scheduleBlocks, etc.
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...(user.privateMetadata || {}),
        ...tripsDataToMetadata(updatedTrips),
      },
    })

    console.log('[Trips API] ✅ Trip created and saved to Clerk:', tripRecord.id)

    return NextResponse.json({ trip: tripRecord.trip }, { status: 201 })
  } catch (error) {
    console.error('[Trips API] POST error:', error)
    console.error('[Trips API] POST error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })
    return NextResponse.json(
      { 
        error: 'Failed to create trip',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
