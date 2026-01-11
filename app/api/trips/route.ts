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

// Export route config to ensure proper handling
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30 // 30 seconds max

// CRITICAL: Prevent Next.js from pre-parsing the body
// This is needed to avoid "Unprocessable Entity" errors in production
export const fetchCache = 'force-no-store'
export const revalidate = 0

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
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  
  // Wrap EVERYTHING in try-catch to catch Next.js runtime errors
  try {
    console.log(`[Trips API] [${requestId}] ========== POST REQUEST START ==========`)
    console.log(`[Trips API] [${requestId}] Request URL:`, request.url)
    console.log(`[Trips API] [${requestId}] Request method:`, request.method)
    console.log(`[Trips API] [${requestId}] Request headers:`, Object.fromEntries(request.headers.entries()))
    
    // Check if request body is readable BEFORE trying to parse
    const contentType = request.headers.get('content-type')
    console.log(`[Trips API] [${requestId}] Content-Type:`, contentType)
    
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`[Trips API] [${requestId}] ❌ Invalid Content-Type:`, contentType)
      return NextResponse.json(
        { 
          error: 'Invalid Content-Type', 
          details: `Expected application/json, got ${contentType}`,
          requestId 
        },
        { status: 400 }
      )
    }
    
    // Step 1: Authenticate user
    console.log(`[Trips API] [${requestId}] Step 1: Authenticating user...`)
    let userId: string | null = null
    try {
      const authResult = await auth()
      userId = authResult.userId
      console.log(`[Trips API] [${requestId}] Auth result:`, { 
        hasUserId: !!userId, 
        userId: userId ? userId.substring(0, 10) + '...' : 'null' 
      })
    } catch (authError) {
      console.error(`[Trips API] [${requestId}] ❌ Auth error:`, {
        error: authError instanceof Error ? authError.message : String(authError),
        name: authError instanceof Error ? authError.name : 'Unknown',
        stack: authError instanceof Error ? authError.stack : undefined,
      })
      return NextResponse.json(
        { error: 'Authentication failed', details: authError instanceof Error ? authError.message : String(authError) },
        { status: 401 }
      )
    }
    
    if (!userId) {
      console.error(`[Trips API] [${requestId}] ❌ No userId after auth`)
      return NextResponse.json(
        { error: 'Unauthorized - no user ID' },
        { status: 401 }
      )
    }

    // Step 2: Parse request body
    console.log(`[Trips API] [${requestId}] Step 2: Parsing request body...`)
    console.log(`[Trips API] [${requestId}] Request headers:`, {
      contentType: request.headers.get('content-type'),
      contentLength: request.headers.get('content-length'),
      userAgent: request.headers.get('user-agent'),
    })
    
    let body: any
    try {
      // CRITICAL FIX: Read body as text first, then parse JSON manually
      // This bypasses Next.js runtime parsing that causes "Unprocessable Entity" errors
      const bodyText = await request.text()
      console.log(`[Trips API] [${requestId}] Body text received (length: ${bodyText.length}):`, bodyText.substring(0, 200))
      
      if (!bodyText || bodyText.trim().length === 0) {
        console.error(`[Trips API] [${requestId}] ❌ Empty request body`)
        return NextResponse.json(
          { error: 'Request body is empty', requestId },
          { status: 400 }
        )
      }
      
      // Parse JSON manually to avoid Next.js runtime issues
      body = JSON.parse(bodyText)
      console.log(`[Trips API] [${requestId}] ✅ Request body parsed successfully:`, {
        hasTitle: !!body.title,
        hasStartDate: !!body.startDate,
        hasEndDate: !!body.endDate,
        hasBaseLocation: !!body.baseLocation,
        title: body.title,
        baseLocation: body.baseLocation,
        learningTarget: body.learningTarget,
        keys: Object.keys(body),
      })
    } catch (parseError) {
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError)
      const errorName = parseError instanceof Error ? parseError.name : 'Unknown'
      console.error(`[Trips API] [${requestId}] ❌ JSON parse error:`, {
        error: errorMsg,
        name: errorName,
        stack: parseError instanceof Error ? parseError.stack : undefined,
        contentType: request.headers.get('content-type'),
      })
      
      // If it's "Unprocessable Entity", it might be a Next.js routing issue
      if (errorMsg.includes('Unprocessable Entity') || errorName === 'UnprocessableEntity') {
        console.error(`[Trips API] [${requestId}] ⚠️ Unprocessable Entity error - this might be a Next.js routing issue`)
        return NextResponse.json(
          { 
            error: 'Request parsing failed', 
            details: 'The request body could not be processed. Please check the request format.',
            requestId,
            hint: 'Ensure Content-Type is application/json and the body is valid JSON',
          },
          { status: 422 }
        )
      }
      
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: errorMsg, requestId },
        { status: 400 }
      )
    }
    
    const { title, startDate, endDate, baseLocation, learningTarget } = body

    // Step 3: Validate required fields
    console.log(`[Trips API] [${requestId}] Step 3: Validating required fields...`)
    if (!title || !startDate || !endDate || !baseLocation) {
      console.error(`[Trips API] [${requestId}] ❌ Missing required fields:`, {
        hasTitle: !!title,
        hasStartDate: !!startDate,
        hasEndDate: !!endDate,
        hasBaseLocation: !!baseLocation,
      })
      return NextResponse.json(
        { error: 'Missing required fields: title, startDate, endDate, baseLocation', requestId },
        { status: 400 }
      )
    }

    // Step 3.5: Validate field formats and types (422 for semantic validation errors)
    console.log(`[Trips API] [${requestId}] Step 3.5: Validating field formats...`)
    const validationErrors: string[] = []
    
    // Validate title
    if (typeof title !== 'string' || title.trim().length === 0) {
      validationErrors.push('title must be a non-empty string')
    }
    
    // Validate dates
    if (typeof startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      validationErrors.push('startDate must be in YYYY-MM-DD format')
    }
    if (typeof endDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      validationErrors.push('endDate must be in YYYY-MM-DD format')
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      validationErrors.push('startDate must be before or equal to endDate')
    }
    
    // Validate baseLocation
    if (typeof baseLocation !== 'string' || baseLocation.trim().length === 0) {
      validationErrors.push('baseLocation must be a non-empty string')
    }
    
    // Validate learningTarget if provided
    if (learningTarget !== undefined && learningTarget !== null) {
      if (typeof learningTarget !== 'object' || Array.isArray(learningTarget)) {
        validationErrors.push('learningTarget must be an object')
      } else {
        const validTracks = ['15min', '60min', '4hrs', 'weekly']
        if (!learningTarget.track || !validTracks.includes(learningTarget.track)) {
          validationErrors.push(`learningTarget.track must be one of: ${validTracks.join(', ')}`)
        }
        if (learningTarget.track === 'weekly') {
          if (!learningTarget.weeklyHours || typeof learningTarget.weeklyHours !== 'number' || learningTarget.weeklyHours <= 0) {
            validationErrors.push('learningTarget.weeklyHours is required and must be a positive number when track is "weekly"')
          }
        }
      }
    }
    
    if (validationErrors.length > 0) {
      console.error(`[Trips API] [${requestId}] ❌ Validation errors:`, validationErrors)
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: 'Unprocessable Entity',
          validationErrors,
          requestId 
        },
        { status: 422 }
      )
    }

    // Step 4: Initialize Clerk client
    console.log(`[Trips API] [${requestId}] Step 4: Initializing Clerk client...`)
    let client: any
    try {
      client = await clerkClient()
      console.log(`[Trips API] [${requestId}] Clerk client initialized`)
    } catch (clientError) {
      console.error(`[Trips API] [${requestId}] ❌ Clerk client initialization error:`, {
        error: clientError instanceof Error ? clientError.message : String(clientError),
        name: clientError instanceof Error ? clientError.name : 'Unknown',
        stack: clientError instanceof Error ? clientError.stack : undefined,
      })
      return NextResponse.json(
        { error: 'Failed to initialize Clerk client', details: clientError instanceof Error ? clientError.message : String(clientError) },
        { status: 500 }
      )
    }

    // Step 5: Get user from Clerk
    console.log(`[Trips API] [${requestId}] Step 5: Fetching user from Clerk...`)
    let user: any
    try {
      user = await client.users.getUser(userId)
      console.log(`[Trips API] [${requestId}] User fetched:`, {
        hasUser: !!user,
        hasMetadata: !!user?.privateMetadata,
        metadataKeys: user?.privateMetadata ? Object.keys(user.privateMetadata) : [],
      })
    } catch (getUserError) {
      console.error(`[Trips API] [${requestId}] ❌ Get user error:`, {
        error: getUserError instanceof Error ? getUserError.message : String(getUserError),
        name: getUserError instanceof Error ? getUserError.name : 'Unknown',
        stack: getUserError instanceof Error ? getUserError.stack : undefined,
        userId,
      })
      return NextResponse.json(
        { error: 'Failed to fetch user from Clerk', details: getUserError instanceof Error ? getUserError.message : String(getUserError) },
        { status: 500 }
      )
    }
    
    // Step 6: Process trip data
    console.log(`[Trips API] [${requestId}] Step 6: Processing trip data...`)
    console.log(`[Trips API] [${requestId}] User metadata before update:`, {
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

    console.log(`[Trips API] [${requestId}] Created trip record:`, {
      id: tripRecord.id,
      title: tripRecord.trip.title,
    })

    // Update trips in metadata
    const updatedTrips = updateTripsData(existingTrips, tripRecord)
    
    console.log(`[Trips API] [${requestId}] Updated trips count:`, updatedTrips.length)

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
    
    console.log(`[Trips API] [${requestId}] Metadata to save:`, {
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
      console.warn(`[Trips API] [${requestId}] ⚠️ Metadata size is large:`, `${metadataSizeKB} KB. Clerk limit is ~10KB`)
    }

    // Step 7: Save to Clerk - pass entire metadata object
    console.log(`[Trips API] [${requestId}] Step 7: Saving to Clerk metadata...`)
    // Retry logic for production reliability (handles transient network issues)
    const maxRetries = 3
    let metadataError: any = null
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Trips API] [${requestId}] Attempt ${attempt}/${maxRetries}: Updating user metadata...`)
        await client.users.updateUserMetadata(userId, {
          privateMetadata: newMetadata,
        })
        console.log(`[Trips API] [${requestId}] ✅ Trip created and saved to Clerk:`, tripRecord.id, `(attempt ${attempt})`)
        metadataError = null // Clear error on success
        break // Success, exit retry loop
      } catch (error) {
        metadataError = error
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errorName = error instanceof Error ? error.name : 'UnknownError'
        const errorStack = error instanceof Error ? error.stack : undefined
        
        console.error(`[Trips API] [${requestId}] ❌ Metadata update attempt ${attempt} failed:`, {
          error: errorMessage,
          name: errorName,
          stack: errorStack,
        })
        
        // Don't retry on certain errors (size limits, permissions)
        if (
          errorMessage.includes('size') || 
          errorMessage.includes('limit') || 
          errorMessage.includes('too large') ||
          errorMessage.includes('permission') ||
          errorMessage.includes('403') ||
          errorMessage.includes('401')
        ) {
          console.error(`[Trips API] [${requestId}] ❌ Non-retryable error, throwing immediately`)
          throw error // Don't retry, throw immediately
        }
        
        // Retry on network/timeout errors
        if (attempt < maxRetries) {
          const delay = attempt * 500 // Exponential backoff: 500ms, 1000ms, 1500ms
          console.warn(`[Trips API] [${requestId}] ⚠️ Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          // Last attempt failed, will be handled below
          console.error(`[Trips API] [${requestId}] ❌ All ${maxRetries} attempts failed`)
          break
        }
      }
    }
    
    // If metadataError exists, all retries failed
    if (metadataError) {
      const errorMessage = metadataError instanceof Error ? metadataError.message : String(metadataError)
      const errorName = metadataError instanceof Error ? metadataError.name : 'UnknownError'
      
      console.error(`[Trips API] [${requestId}] ❌ Final error updating user metadata:`, metadataError)
      console.error(`[Trips API] [${requestId}] Metadata update error details:`, {
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
        fullError: String(metadataError),
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

    console.log(`[Trips API] [${requestId}] ✅ SUCCESS: Trip created and saved`)
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
