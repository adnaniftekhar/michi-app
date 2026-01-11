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
  // Generate unique request ID for tracing
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(7)}`
  let currentStep = 'init'
  
  try {
    // Step 1: Auth
    currentStep = 'auth'
    console.log(`[Trips API] [${requestId}] Step 1: Checking auth...`)
    const { userId } = await auth()
    if (!userId) {
      console.log(`[Trips API] [${requestId}] Step 1: No userId - unauthorized`)
      return NextResponse.json(
        { error: 'Unauthorized', requestId },
        { status: 401 }
      )
    }
    console.log(`[Trips API] [${requestId}] Step 1: Auth OK, userId=${userId.substring(0, 10)}...`)

    // Step 2: Read body as text
    currentStep = 'read-body'
    console.log(`[Trips API] [${requestId}] Step 2: Reading request body...`)
    let bodyText: string
    try {
      bodyText = await request.text()
      console.log(`[Trips API] [${requestId}] Step 2: Body read OK, length=${bodyText.length}`)
    } catch (readError) {
      console.error(`[Trips API] [${requestId}] Step 2 FAILED: Read error:`, readError)
      return NextResponse.json(
        { error: 'Failed to read request body', details: readError instanceof Error ? readError.message : String(readError), requestId, step: currentStep },
        { status: 400 }
      )
    }

    if (!bodyText || bodyText.trim() === '') {
      console.error(`[Trips API] [${requestId}] Step 2 FAILED: Body is empty`)
      return NextResponse.json(
        { error: 'Request body is empty', requestId, step: currentStep },
        { status: 400 }
      )
    }

    // Step 3: Parse JSON
    currentStep = 'parse-json'
    console.log(`[Trips API] [${requestId}] Step 3: Parsing JSON...`)
    let body: any
    try {
      body = JSON.parse(bodyText)
      console.log(`[Trips API] [${requestId}] Step 3: JSON parsed OK, keys=${Object.keys(body).join(',')}`)
    } catch (parseError) {
      console.error(`[Trips API] [${requestId}] Step 3 FAILED: Parse error:`, parseError)
      console.error(`[Trips API] [${requestId}] Body text was:`, bodyText.substring(0, 200))
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: parseError instanceof Error ? parseError.message : String(parseError), requestId, step: currentStep },
        { status: 400 }
      )
    }

    // Step 4: Validate fields
    currentStep = 'validate-fields'
    console.log(`[Trips API] [${requestId}] Step 4: Validating fields...`)
    const { title, startDate, endDate, baseLocation, learningTarget } = body

    if (!title || !startDate || !endDate || !baseLocation) {
      const missing = [
        !title && 'title',
        !startDate && 'startDate', 
        !endDate && 'endDate',
        !baseLocation && 'baseLocation'
      ].filter(Boolean)
      console.error(`[Trips API] [${requestId}] Step 4 FAILED: Missing fields: ${missing.join(', ')}`)
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}`, requestId, step: currentStep },
        { status: 400 }
      )
    }
    console.log(`[Trips API] [${requestId}] Step 4: Fields valid - title="${title}", location="${baseLocation}"`)

    // Step 5: Get Clerk client
    currentStep = 'clerk-client'
    console.log(`[Trips API] [${requestId}] Step 5: Getting Clerk client...`)
    let client
    try {
      client = await clerkClient()
      console.log(`[Trips API] [${requestId}] Step 5: Clerk client OK`)
    } catch (clerkError) {
      console.error(`[Trips API] [${requestId}] Step 5 FAILED: Clerk client error:`, clerkError)
      return NextResponse.json(
        { error: 'Failed to initialize Clerk', details: clerkError instanceof Error ? clerkError.message : String(clerkError), requestId, step: currentStep },
        { status: 500 }
      )
    }

    // Step 6: Get user from Clerk
    currentStep = 'get-user'
    console.log(`[Trips API] [${requestId}] Step 6: Getting user from Clerk...`)
    let user
    try {
      user = await client.users.getUser(userId)
      console.log(`[Trips API] [${requestId}] Step 6: User fetched OK, has metadata=${!!user.privateMetadata}`)
    } catch (getUserError) {
      console.error(`[Trips API] [${requestId}] Step 6 FAILED: Get user error:`, getUserError)
      return NextResponse.json(
        { error: 'Failed to get user', details: getUserError instanceof Error ? getUserError.message : String(getUserError), requestId, step: currentStep },
        { status: 500 }
      )
    }

    // Step 7: Process trip data
    currentStep = 'process-trip'
    console.log(`[Trips API] [${requestId}] Step 7: Processing trip data...`)
    const existingTrips = getTripRecordsFromMetadata(user.privateMetadata)
    console.log(`[Trips API] [${requestId}] Step 7: Existing trips count=${existingTrips.length}`)

    const tripRecord = createTripRecord({
      title,
      startDate,
      endDate,
      baseLocation,
      learningTarget,
    })
    console.log(`[Trips API] [${requestId}] Step 7: New trip created, id=${tripRecord.id}`)

    const updatedTrips = updateTripsData(existingTrips, tripRecord)
    console.log(`[Trips API] [${requestId}] Step 7: Updated trips count=${updatedTrips.length}`)

    // Step 8: Save to Clerk
    currentStep = 'save-metadata'
    console.log(`[Trips API] [${requestId}] Step 8: Saving to Clerk metadata...`)
    const newMetadata = {
      ...(user.privateMetadata || {}),
      ...tripsDataToMetadata(updatedTrips),
    }
    const metadataSize = JSON.stringify(newMetadata).length
    console.log(`[Trips API] [${requestId}] Step 8: Metadata size=${metadataSize} bytes`)
    
    try {
      await client.users.updateUserMetadata(userId, {
        privateMetadata: newMetadata,
      })
      console.log(`[Trips API] [${requestId}] Step 8: Metadata saved OK!`)
    } catch (saveError) {
      console.error(`[Trips API] [${requestId}] Step 8 FAILED: Save metadata error:`, saveError)
      // Log more details about the error
      if (saveError && typeof saveError === 'object') {
        console.error(`[Trips API] [${requestId}] Error type:`, (saveError as any).constructor?.name)
        console.error(`[Trips API] [${requestId}] Error status:`, (saveError as any).status)
        console.error(`[Trips API] [${requestId}] Error errors:`, (saveError as any).errors)
      }
      return NextResponse.json(
        { 
          error: 'Failed to save trip to Clerk', 
          details: saveError instanceof Error ? saveError.message : String(saveError), 
          requestId, 
          step: currentStep,
          metadataSize 
        },
        { status: 500 }
      )
    }

    console.log(`[Trips API] [${requestId}] ✅ SUCCESS! Trip created: ${tripRecord.id}`)
    return NextResponse.json({ trip: tripRecord.trip, requestId }, { status: 201 })

  } catch (error) {
    // Unexpected error - log everything
    console.error(`[Trips API] [${requestId}] ❌ UNEXPECTED ERROR at step "${currentStep}":`, error)
    if (error && typeof error === 'object') {
      console.error(`[Trips API] [${requestId}] Error type:`, (error as any).constructor?.name)
      console.error(`[Trips API] [${requestId}] Error status:`, (error as any).status)
      console.error(`[Trips API] [${requestId}] Error code:`, (error as any).code)
      console.error(`[Trips API] [${requestId}] Error errors:`, (error as any).errors)
    }
    return NextResponse.json(
      { 
        error: 'Failed to create trip',
        details: error instanceof Error ? error.message : String(error),
        requestId,
        step: currentStep,
      },
      { status: 500 }
    )
  }
}
