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

    // Parse request body - catch Next.js runtime parsing errors
    let body: any
    try {
      body = await request.json()
    } catch (parseError) {
      // Next.js runtime sometimes throws "Unprocessable Entity" before our handler
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError)
      console.error('[Trips API] Request body parse error:', errorMsg)
      
      // If it's the Next.js "Unprocessable Entity" error, try reading as text and parsing manually
      if (errorMsg.includes('Unprocessable Entity') || errorMsg.includes('UnprocessableEntity')) {
        try {
          const bodyText = await request.text()
          if (bodyText) {
            body = JSON.parse(bodyText)
            console.log('[Trips API] Successfully parsed body after Next.js error')
          } else {
            return NextResponse.json(
              { error: 'Request body is empty' },
              { status: 400 }
            )
          }
        } catch (manualParseError) {
          console.error('[Trips API] Manual parse also failed:', manualParseError)
          return NextResponse.json(
            { error: 'Invalid JSON in request body', details: errorMsg },
            { status: 400 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Invalid JSON in request body', details: errorMsg },
          { status: 400 }
        )
      }
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
