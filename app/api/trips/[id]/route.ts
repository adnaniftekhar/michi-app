import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import {
  getTripFromMetadata,
  getTripRecordsFromMetadata,
  updateTripsData,
  removeTripFromData,
  tripsDataToMetadata,
  createTripRecord,
} from '@/lib/trips-storage-clerk'

// GET /api/trips/:id - Get a single trip
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get trip from Clerk user metadata
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const trip = getTripFromMetadata(user.privateMetadata, id)

    if (!trip) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ trip })
  } catch (error) {
    console.error('[Trips API] GET /:id error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trip' },
      { status: 500 }
    )
  }
}

// PATCH /api/trips/:id - Update a trip
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    // Don't allow updating id or createdAt
    const { id: _, createdAt: __, ...updates } = body

    // Get existing trips from Clerk
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const existingTrips = getTripRecordsFromMetadata(user.privateMetadata)

    // Find the trip to update
    const tripIndex = existingTrips.findIndex((t) => t.id === id)
    if (tripIndex === -1) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Update the trip
    const existingTrip = existingTrips[tripIndex].trip
    const updatedTrip = {
      ...existingTrip,
      ...updates,
    }

    const updatedTripRecord = {
      ...existingTrips[tripIndex],
      trip: updatedTrip,
      updatedAt: new Date().toISOString(),
    }

    // Update trips in metadata
    const updatedTrips = updateTripsData(existingTrips, updatedTripRecord)

    // Save to Clerk
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...user.privateMetadata,
        trips: tripsDataToMetadata(updatedTrips),
      },
    })

    console.log('[Trips API] ✅ Trip updated in Clerk:', id)

    return NextResponse.json({ trip: updatedTrip })
  } catch (error) {
    console.error('[Trips API] PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update trip' },
      { status: 500 }
    )
  }
}

// DELETE /api/trips/:id - Delete a trip
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Get existing trips from Clerk
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const existingTrips = getTripRecordsFromMetadata(user.privateMetadata)

    // Check if trip exists
    const tripExists = existingTrips.some((t) => t.id === id)
    if (!tripExists) {
      return NextResponse.json(
        { error: 'Trip not found' },
        { status: 404 }
      )
    }

    // Remove trip from data
    const updatedTrips = removeTripFromData(existingTrips, id)

    // Save to Clerk
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...user.privateMetadata,
        trips: tripsDataToMetadata(updatedTrips),
      },
    })

    console.log('[Trips API] ✅ Trip deleted from Clerk:', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Trips API] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    )
  }
}
