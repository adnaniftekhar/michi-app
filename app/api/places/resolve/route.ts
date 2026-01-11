import { NextResponse } from 'next/server'
import { resolvePlace } from '@/lib/places-api'

/**
 * Server-side API route to resolve a location string to coordinates
 * Uses PLACES_API_KEY (server-side only, never exposed to client)
 */
export async function POST(request: Request) {
  console.log('[places/resolve] 🔍 POST request received')
  try {
    const apiKey = process.env.PLACES_API_KEY
    console.log('[places/resolve] 📋 API key check:', {
      hasPLACES_API_KEY: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'empty',
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('PLACES') || k.includes('places')).join(', ') || 'none'
    })
    
    if (!apiKey) {
      console.error('[places/resolve] ❌ PLACES_API_KEY is not configured')
      console.error('[places/resolve] 💡 Solution: Add PLACES_API_KEY to .env.local file and restart the server')
      console.error('[places/resolve] 💡 Or load from GCP Secret Manager using: ./load-gcp-secrets.sh')
      return NextResponse.json(
        { 
          error: 'Places API key not configured',
          hint: 'Add PLACES_API_KEY to your .env.local file and restart the server'
        },
        { status: 500 }
      )
    }

    console.log('[places/resolve] 📥 Parsing request body...')
    const body = await request.json()
    const { query } = body
    console.log('[places/resolve] 📝 Query received:', {
      query,
      queryType: typeof query,
      queryLength: query?.length || 0
    })

    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      console.error('[places/resolve] ❌ Invalid query:', query)
      return NextResponse.json(
        { error: 'query is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Resolve place using server-side Places API
    console.log('[places/resolve] 🔄 Calling resolvePlace with query:', query)
    const result = await resolvePlace({ query }, apiKey)
    console.log('[places/resolve] ✅ Place resolved:', {
      hasResult: !!result,
      placeId: result?.placeId,
      displayName: result?.displayName,
      hasLocation: !!result?.location,
      location: result?.location
    })

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
