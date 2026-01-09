import { NextResponse } from 'next/server'
import { getPlaceDetails } from '@/lib/places-api'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ placeId: string }> }
) {
  try {
    const apiKey = process.env.PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Places API key not configured' },
        { status: 500 }
      )
    }

    const { placeId } = await params
    if (!placeId) {
      return NextResponse.json(
        { error: 'placeId is required' },
        { status: 400 }
      )
    }

    // Parse query params for fields
    const url = new URL(request.url)
    const fieldsParam = url.searchParams.get('fields')
    const fields = fieldsParam 
      ? fieldsParam.split(',').map(f => f.trim())
      : ['id', 'displayName', 'formattedAddress', 'location', 'photos']

    const result = await getPlaceDetails(placeId, fields, apiKey)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Places details error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('denied')) {
        return NextResponse.json(
          { error: 'Places service temporarily unavailable' },
          { status: 502 }
        )
      }
      if (error.message.includes('not found') || error.message.includes('404')) {
        return NextResponse.json(
          { error: 'Place not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to get place details' },
      { status: 500 }
    )
  }
}
