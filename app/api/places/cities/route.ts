import { NextResponse } from 'next/server'

const PLACES_API_BASE = 'https://places.googleapis.com/v1'

/**
 * GET /api/places/cities?query=...
 * Autocomplete cities using Google Places API
 * Returns city suggestions for the location field
 */
export async function GET(request: Request) {
  try {
    const apiKey = process.env.PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Places API key not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ cities: [] })
    }

    // Use Places API (New) Text Search
    // Add "city" to query to bias towards cities
    const searchQuery = `${query.trim()} city`
    const url = `${PLACES_API_BASE}/places:searchText`
    
    const body = {
      textQuery: searchQuery,
      maxResultCount: 5,
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[places/cities] API error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to search cities' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const places = data.places || []

    // Transform to city suggestions format
    const cities = places.map((place: any) => {
      // Extract city name from formatted address
      // Format: "City, State, Country" -> "City, State" or just "City"
      let cityName = place.displayName?.text || ''
      const formattedAddress = place.formattedAddress || ''
      
      // If formatted address exists, prefer it for better context
      if (formattedAddress) {
        const parts = formattedAddress.split(',')
        // Take first two parts (city, state/country)
        cityName = parts.slice(0, 2).join(',').trim()
      }

      return {
        id: place.id,
        name: cityName,
        fullAddress: formattedAddress,
        location: place.location ? {
          lat: place.location.latitude,
          lng: place.location.longitude,
        } : undefined,
      }
    })

    return NextResponse.json({ cities })
  } catch (error) {
    console.error('[places/cities] Error:', error)
    return NextResponse.json(
      { error: 'Failed to search cities' },
      { status: 500 }
    )
  }
}
