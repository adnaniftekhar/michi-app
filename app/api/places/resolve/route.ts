import { NextResponse } from 'next/server'
import { resolvePlace } from '@/lib/places-api'

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
    const { query, country, cityBias } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'query is required and must be a string' },
        { status: 400 }
      )
    }

    const result = await resolvePlace({ query, country, cityBias }, apiKey)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Places resolve error:', error)
    
    // Don't expose internal errors to client
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('denied')) {
        return NextResponse.json(
          { error: 'Places service temporarily unavailable' },
          { status: 502 }
        )
      }
      if (error.message.includes('No place found')) {
        return NextResponse.json(
          { error: 'Location not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to resolve place' },
      { status: 500 }
    )
  }
}
