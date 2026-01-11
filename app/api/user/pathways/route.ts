import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import type { FinalPathwayPlan } from '@/types'

/**
 * GET /api/user/pathways?tripId=xxx
 * Get saved learning pathways for a trip
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

    // Get user metadata from Clerk
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    
    // Pathways are stored in user's privateMetadata
    const pathways = (user.privateMetadata?.pathways || {}) as Record<string, FinalPathwayPlan>
    const pathway = pathways[tripId]

    if (!pathway) {
      return NextResponse.json(
        { pathway: null },
        { status: 200 }
      )
    }

    return NextResponse.json({ pathway })
  } catch (error) {
    console.error('[user/pathways] Error fetching pathway:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pathway' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/pathways
 * Save a learning pathway for a trip
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
    const { tripId, pathway } = body

    if (!tripId || !pathway) {
      return NextResponse.json(
        { error: 'tripId and pathway are required' },
        { status: 400 }
      )
    }

    // Get existing pathways
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const existingPathways = (user.privateMetadata?.pathways || {}) as Record<string, FinalPathwayPlan>

    // Update pathways with new one
    const updatedPathways = {
      ...existingPathways,
      [tripId]: pathway,
    }

    // Save to Clerk user metadata - MERGE with existing metadata to preserve trips, scheduleBlocks, etc.
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        ...(user.privateMetadata || {}),
        pathways: updatedPathways,
      },
    })

    console.log('[user/pathways] ✅ Pathway saved for trip:', tripId, 'user:', userId)

    return NextResponse.json({ 
      success: true,
      message: 'Pathway saved successfully'
    })
  } catch (error) {
    console.error('[user/pathways] ❌ Error saving pathway:', error)
    return NextResponse.json(
      { error: 'Failed to save pathway', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
