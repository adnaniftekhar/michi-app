import { NextResponse } from 'next/server'
import { resolvePlace } from '@/lib/places-api'

/**
 * Server-side API route to resolve a location string to coordinates
 * Uses PLACES_API_KEY (server-side only, never exposed to client)
 */
export async function POST(request: Request) {
  try {
    const apiKey = process.env.PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Places API key not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { query } = body

    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'query is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Resolve place using server-side Places API
    const result = await resolvePlace({ query }, apiKey)

    if (!result) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    // Return standardized format
    return NextResponse.json({
      placeId: result.placeId,
      displayName: result.displayName,
      formattedAddress: result.formattedAddress,
      location: {
        lat: result.location.lat,
        lng: result.location.lng,
      },
    })
  } catch (error) {
    // Don't leak API keys or upstream response bodies
    console.error('Places resolve error:', error instanceof Error ? error.message : 'Unknown error')
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('denied') || error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Places service temporarily unavailable' },
          { status: 502 }
        )
      }
      if (error.message.includes('No place found') || error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Location not found' },
          { status: 404 }
        )
      }
    }

    // Generic error response (don't expose internal details)
    return NextResponse.json(
      { error: 'Failed to resolve place' },
      { status: 502 }
    )
  }
}
