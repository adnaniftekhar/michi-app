import { NextResponse } from 'next/server'
import { fetchPlacePhoto } from '@/lib/places-api'

// Simple in-memory cache for photo responses
// Key: photoName_maxHeightPx_maxWidthPx, Value: { data, contentType, timestamp }
const photoCache = new Map<string, { data: ArrayBuffer; contentType: string; timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

function getCacheKey(photoName: string, maxHeightPx: number, maxWidthPx?: number): string {
  return `${photoName}_${maxHeightPx}_${maxWidthPx || 0}`
}

function getCachedPhoto(key: string): { data: ArrayBuffer; contentType: string } | null {
  const cached = photoCache.get(key)
  if (!cached) return null

  // Check if cache is expired
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    photoCache.delete(key)
    return null
  }

  return { data: cached.data, contentType: cached.contentType }
}

function setCachedPhoto(key: string, data: ArrayBuffer, contentType: string): void {
  photoCache.set(key, { data, contentType, timestamp: Date.now() })
  
  // Simple cache size limit (keep last 100 entries)
  if (photoCache.size > 100) {
    const firstKey = photoCache.keys().next().value
    if (firstKey) {
      photoCache.delete(firstKey)
    }
  }
}

export async function GET(request: Request) {
  try {
    const apiKey = process.env.PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Places API key not configured' },
        { status: 500 }
      )
    }

    const url = new URL(request.url)
    const photoName = url.searchParams.get('photoName')
    const maxHeightPx = parseInt(url.searchParams.get('maxHeightPx') || '400', 10)
    const maxWidthPx = url.searchParams.get('maxWidthPx') 
      ? parseInt(url.searchParams.get('maxWidthPx')!, 10)
      : undefined

    if (!photoName) {
      return NextResponse.json(
        { error: 'photoName query parameter is required' },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheKey = getCacheKey(photoName, maxHeightPx, maxWidthPx)
    const cached = getCachedPhoto(cacheKey)
    if (cached) {
      return new NextResponse(cached.data, {
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': 'public, max-age=86400', // 24 hours
        },
      })
    }

    // Fetch from Places API
    const { data, contentType } = await fetchPlacePhoto(photoName, apiKey, maxHeightPx, maxWidthPx)

    // Cache the result
    setCachedPhoto(cacheKey, data, contentType)

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 24 hours
      },
    })
  } catch (error) {
    console.error('Places photo error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('photoName is required')) {
        return NextResponse.json(
          { error: 'Invalid photo name' },
          { status: 400 }
        )
      }
      if (error.message.includes('quota') || error.message.includes('denied')) {
        return NextResponse.json(
          { error: 'Photo service temporarily unavailable' },
          { status: 502 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch photo' },
      { status: 500 }
    )
  }
}
