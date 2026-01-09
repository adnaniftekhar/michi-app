import { NextResponse } from 'next/server'
import { searchPlaces, type PlaceSearchRequest } from '@/lib/places-api'

// Simple in-memory cache (in production, use Redis or similar)
const cache = new Map<string, { data: any; expires: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

function getCacheKey(query: string, near: { lat: number; lng: number }, radiusMeters?: number): string {
  return `places:suggest:${query}:${near.lat}:${near.lng}:${radiusMeters || 5000}`
}

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
    const { query, near, radiusMeters, maxResults, showExactAddresses } = body

    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'query is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (!near || typeof near.lat !== 'number' || typeof near.lng !== 'number') {
      return NextResponse.json(
        { error: 'near is required and must be an object with lat and lng numbers' },
        { status: 400 }
      )
    }

    if (radiusMeters !== undefined && (typeof radiusMeters !== 'number' || radiusMeters < 0 || radiusMeters > 50000)) {
      return NextResponse.json(
        { error: 'radiusMeters must be a number between 0 and 50000' },
        { status: 400 }
      )
    }

    if (maxResults !== undefined && (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 10)) {
      return NextResponse.json(
        { error: 'maxResults must be a number between 1 and 10' },
        { status: 400 }
      )
    }

    // Check cache
    const cacheKey = getCacheKey(query, near, radiusMeters)
    const cached = cache.get(cacheKey)
    if (cached && cached.expires > Date.now()) {
      console.log('Returning cached place suggestions for:', query)
      return NextResponse.json({ suggestions: cached.data })
    }

    // Search places
    const searchRequest: PlaceSearchRequest = {
      query: query.trim(),
      near,
      radiusMeters: radiusMeters || 5000,
      maxResults: maxResults || 3,
    }

    const suggestions = await searchPlaces(searchRequest, apiKey, showExactAddresses || false)

    // Cache results
    cache.set(cacheKey, {
      data: suggestions,
      expires: Date.now() + CACHE_TTL,
    })

    // Clean up expired cache entries (simple cleanup, in production use proper cache eviction)
    if (cache.size > 1000) {
      const now = Date.now()
      for (const [key, value] of cache.entries()) {
        if (value.expires <= now) {
          cache.delete(key)
        }
      }
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Places suggest error:', error instanceof Error ? error.message : 'Unknown error')
    
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('denied') || error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Places service temporarily unavailable' },
          { status: 502 }
        )
      }
      if (error.message.includes('not found') || error.message.includes('No place found')) {
        return NextResponse.json(
          { error: 'No venues found for this query' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch place suggestions' },
      { status: 502 }
    )
  }
}
