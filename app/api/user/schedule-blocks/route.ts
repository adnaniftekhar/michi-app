import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import type { ScheduleBlock } from '@/types'

/**
 * GET /api/user/schedule-blocks?tripId=xxx
 * Get saved schedule blocks for a trip
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('tripId')

    if (!tripId) {
      return NextResponse.json(
        { error: 'tripId is required' },
        { status: 400 }
      )
    }

    // Get schedule blocks from Clerk user metadata
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    
    // Schedule blocks are stored in user's privateMetadata
    const scheduleBlocks = (user.privateMetadata?.scheduleBlocks || {}) as Record<string, ScheduleBlock[]>
    const blocks = scheduleBlocks[tripId] || []

    return NextResponse.json({ scheduleBlocks: blocks })
  } catch (error) {
    console.error('[user/schedule-blocks] Error fetching schedule blocks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule blocks' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/schedule-blocks
 * Save schedule blocks for a trip
 */
export async function PUT(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tripId, scheduleBlocks } = body

    if (!tripId || !Array.isArray(scheduleBlocks)) {
      return NextResponse.json(
        { error: 'tripId and scheduleBlocks (array) are required' },
        { status: 400 }
      )
    }

    // Get existing schedule blocks
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const existingBlocks = (user.privateMetadata?.scheduleBlocks || {}) as Record<string, ScheduleBlock[]>

    // Update schedule blocks with new ones
    const updatedBlocks = {
      ...existingBlocks,
      [tripId]: scheduleBlocks,
    }

    // Save to Clerk user metadata
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...user.privateMetadata,
        scheduleBlocks: updatedBlocks,
      },
    })

    console.log('[user/schedule-blocks] ✅ Schedule blocks saved for trip:', tripId, 'user:', userId, 'blocks:', scheduleBlocks.length)

    return NextResponse.json({ 
      success: true,
      message: 'Schedule blocks saved successfully'
    })
  } catch (error) {
    console.error('[user/schedule-blocks] ❌ Error saving schedule blocks:', error)
    return NextResponse.json(
      { error: 'Failed to save schedule blocks', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
