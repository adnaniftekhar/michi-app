import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import type { LearnerProfile } from '@/types'

/**
 * GET /api/user/profile
 * Get the learner profile for the authenticated user
 */
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user metadata from Clerk
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    
    // Profile is stored in user's publicMetadata or privateMetadata
    const profile = (user.publicMetadata?.learnerProfile || user.privateMetadata?.learnerProfile) as LearnerProfile | undefined

    if (!profile) {
      return NextResponse.json(
        { profile: null },
        { status: 200 }
      )
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('[user/profile] Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/user/profile
 * Save the learner profile for the authenticated user
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
    const { profile } = body

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile is required' },
        { status: 400 }
      )
    }

    // Save profile to Clerk user metadata
    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        learnerProfile: profile,
      },
    })

    console.log('[user/profile] ✅ Profile saved for user:', userId)

    return NextResponse.json({ 
      success: true,
      message: 'Profile saved successfully'
    })
  } catch (error) {
    console.error('[user/profile] ❌ Error saving profile:', error)
    return NextResponse.json(
      { error: 'Failed to save profile', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
