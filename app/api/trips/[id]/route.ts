import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import type { Trip } from '@/types'

// Simple in-memory storage (shared with main trips route would be better, but this works for now)
// The client uses localStorage as primary storage anyway
const tripsStore: Record<string, Trip[]> = {}

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
    const trips = tripsStore[userId] || []
    const trip = trips.find(t => t.id === id)

    if (!trip) {
      // Return 404 but client will use localStorage
      return NextResponse.json(
        { error: 'Trip not found in server store', trip: null },
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
    const { id: _, createdAt: __, ...updates } = body

    if (!tripsStore[userId]) {
      tripsStore[userId] = []
    }

    const tripIndex = tripsStore[userId].findIndex(t => t.id === id)
    
    if (tripIndex === -1) {
      // Trip not in server store - create it with updates
      const newTrip: Trip = {
        id,
        createdAt: new Date().toISOString(),
        ...updates,
      }
      tripsStore[userId].push(newTrip)
      return NextResponse.json({ trip: newTrip })
    }

    // Update existing trip
    const updatedTrip = {
      ...tripsStore[userId][tripIndex],
      ...updates,
    }
    tripsStore[userId][tripIndex] = updatedTrip

    console.log('[Trips API] ✅ Trip updated:', id)
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

    if (tripsStore[userId]) {
      tripsStore[userId] = tripsStore[userId].filter(t => t.id !== id)
    }

    console.log('[Trips API] ✅ Trip deleted:', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Trips API] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete trip' },
      { status: 500 }
    )
  }
}
