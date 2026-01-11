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
    
    // Calculate metadata size for logging and validation
    const metadataString = JSON.stringify(newMetadata)
    const metadataSize = metadataString.length
    const metadataSizeKB = (metadataSize / 1024).toFixed(2)
    
    console.log('[Trips API] Metadata to save:', {
      keys: Object.keys(newMetadata),
      tripsCount: Array.isArray(newMetadata.trips) ? newMetadata.trips.length : 'not array',
      hasPathways: !!newMetadata.pathways,
      hasScheduleBlocks: !!newMetadata.scheduleBlocks,
      metadataSize,
      metadataSizeKB: `${metadataSizeKB} KB`,
    })

    // Clerk has a metadata size limit (typically 10KB for privateMetadata)
    // Warn if approaching limit
    if (metadataSize > 8000) {
      console.warn('[Trips API] ⚠️ Metadata size is large:', `${metadataSizeKB} KB. Clerk limit is ~10KB`)
    }

    // Save to Clerk - pass entire metadata object
    // Retry logic for production reliability (handles transient network issues)
    const maxRetries = 3
    let metadataError: any = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await client.users.updateUserMetadata(userId, {
          privateMetadata: newMetadata,
        })
        console.log('[Trips API] ✅ Trip created and saved to Clerk:', tripRecord.id, `(attempt ${attempt})`)
        metadataError = null // Clear error on success
        break // Success, exit retry loop
      } catch (error) {
        metadataError = error
        const errorMessage = error instanceof Error ? error.message : String(error)
        
        // Don't retry on certain errors (size limits, permissions)
        if (
          errorMessage.includes('size') || 
          errorMessage.includes('limit') || 
          errorMessage.includes('too large') ||
          errorMessage.includes('permission') ||
          errorMessage.includes('403') ||
          errorMessage.includes('401')
        ) {
          throw error // Don't retry, throw immediately
        }
        
        // Retry on network/timeout errors
        if (attempt < maxRetries) {
          const delay = attempt * 500 // Exponential backoff: 500ms, 1000ms, 1500ms
          console.warn(`[Trips API] ⚠️ Metadata update failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`, {
            error: errorMessage,
          })
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          // Last attempt failed, will be handled below
          break
        }
      }
    }
    
    // If metadataError exists, all retries failed
    if (metadataError) {
      const errorMessage = metadataError instanceof Error ? metadataError.message : String(metadataError)
      const errorName = metadataError instanceof Error ? metadataError.name : 'UnknownError'
      
      console.error('[Trips API] ❌ Error updating user metadata:', metadataError)
      console.error('[Trips API] Metadata update error details:', {
        message: errorMessage,
        name: errorName,
        userId,
        metadataSize,
        metadataSizeKB: `${metadataSizeKB} KB`,
        tripsCount: updatedTrips.length,
        hasPathways: !!newMetadata.pathways,
        hasScheduleBlocks: !!newMetadata.scheduleBlocks,
        pathwaysKeys: newMetadata.pathways ? Object.keys(newMetadata.pathways).length : 0,
        scheduleBlocksKeys: newMetadata.scheduleBlocks ? Object.keys(newMetadata.scheduleBlocks).length : 0,
      })
      
      // Provide more specific error messages for common issues
      if (errorMessage.includes('size') || errorMessage.includes('limit') || errorMessage.includes('too large')) {
        throw new Error('Metadata size limit exceeded. Please try deleting old trips or pathways.')
      }
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        throw new Error('Too many requests. Please wait a moment and try again.')
      }
      if (errorMessage.includes('permission') || errorMessage.includes('403')) {
        throw new Error('Permission denied. Please check your authentication.')
      }
      
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
