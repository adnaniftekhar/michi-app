/**
 * Google Places API service (server-side only)
 * Handles place resolution, details, and photo fetching
 * All API keys are server-side only and never exposed to client
 */

const PLACES_API_BASE = 'https://places.googleapis.com/v1'

interface PlaceResolutionRequest {
  query: string
  country?: string
  cityBias?: string
}

interface PlaceResolutionResponse {
  placeId: string
  displayName: string
  formattedAddress: string
  location: { lat: number; lng: number }
  placeType: string
}

interface PlaceDetailsResponse {
  placeId: string
  displayName: string
  formattedAddress: string
  location: { lat: number; lng: number }
  photos: Array<{
    name: string
    widthPx: number
    heightPx: number
    authorAttributions: Array<{
      displayName: string
      uri: string
    }>
  }>
}

/**
 * Resolve a location query to a Google Place
 * Applies privacy: downgrades specific addresses to city-level
 */
export async function resolvePlace(
  request: PlaceResolutionRequest,
  apiKey: string
): Promise<PlaceResolutionResponse> {
  const { query, country, cityBias } = request

  // Use Places API (New) Text Search
  const url = `${PLACES_API_BASE}/places:searchText`
  
  const body: any = {
    textQuery: query,
    maxResultCount: 1,
  }

  if (country) {
    body.includedRegionCodes = [country]
  }

  if (cityBias) {
    body.locationBias = {
      circle: {
        center: { latitude: 0, longitude: 0 }, // Will be resolved from cityBias if needed
        radius: 50000, // 50km
      },
    }
  }

  console.log('[places-api] 📡 Making Places API request:', {
    url,
    method: 'POST',
    query,
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'empty',
    requestBody: JSON.stringify(body)
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location',
    },
    body: JSON.stringify(body),
  })

  console.log('[places-api] 📥 Places API response:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    headers: Object.fromEntries(response.headers.entries())
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[places-api] ❌ Places API resolve error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorText.substring(0, 500), // Limit error text length
      query,
      fullError: errorText
    })
    
    // Provide helpful error messages
    if (response.status === 403 || errorText.includes('API key')) {
      console.error('[places-api] 💡 Authentication issue - check API key validity and Places API (New) is enabled')
      throw new Error(`Places API authentication failed. Check your PLACES_API_KEY is valid and has Places API (New) enabled.`)
    } else if (response.status === 429 || errorText.includes('quota')) {
      console.error('[places-api] 💡 Quota issue - check Google Cloud billing and quotas')
      throw new Error(`Places API quota exceeded. Check your Google Cloud billing and quotas.`)
    } else {
      throw new Error(`Places API error: ${response.status} - ${errorText.substring(0, 200)}`)
    }
  }

  const data = await response.json()
  const place = data.places?.[0]

  if (!place) {
    console.warn('No place found for query:', query)
    throw new Error('No place found for query')
  }

  console.log('Place resolved:', {
    placeId: place.id,
    displayName: place.displayName?.text,
    hasLocation: !!place.location,
  })

  // Apply privacy: downgrade specific addresses to city-level
  const formattedAddress = place.formattedAddress || ''
  const isSpecificAddress = /\d+\s+\w+\s+(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr)/i.test(formattedAddress)
  
  let location = place.location
  if (isSpecificAddress) {
    // Round to city-level precision (approximately 1km accuracy)
    location = {
      lat: Math.round(place.location.latitude * 100) / 100,
      lng: Math.round(place.location.longitude * 100) / 100,
    }
  } else {
    location = {
      lat: place.location.latitude,
      lng: place.location.longitude,
    }
  }

  return {
    placeId: place.id,
    displayName: place.displayName?.text || query,
    formattedAddress: place.formattedAddress || '',
    location,
    placeType: place.types?.[0] || 'establishment',
  }
}

/**
 * Get place details including photos
 */
export async function getPlaceDetails(
  placeId: string,
  fields: string[],
  apiKey: string
): Promise<PlaceDetailsResponse> {
  const url = `${PLACES_API_BASE}/places/${placeId}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fields.join(','),
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Places API details error:', response.status, errorText)
    throw new Error(`Places API error: ${response.status} - ${errorText}`)
  }

  const place = await response.json()

  console.log('Place details retrieved:', {
    placeId: place.id,
    hasPhotos: !!(place.photos && place.photos.length > 0),
    photoCount: place.photos?.length || 0,
  })

  return {
    placeId: place.id,
    displayName: place.displayName?.text || '',
    formattedAddress: place.formattedAddress || '',
    location: {
      lat: place.location?.latitude || 0,
      lng: place.location?.longitude || 0,
    },
    photos: (place.photos || []).slice(0, 3).map((photo: any) => ({
      name: photo.name,
      widthPx: photo.widthPx || 0,
      heightPx: photo.heightPx || 0,
      authorAttributions: (photo.authorAttributions || []).map((attr: any) => ({
        displayName: attr.displayName || '',
        uri: attr.uri || '',
      })),
    })),
  }
}

/**
 * Fetch and stream a place photo (server-side only)
 * Returns image bytes with proper Content-Type
 */
export async function fetchPlacePhoto(
  photoName: string,
  apiKey: string,
  maxHeightPx: number = 400,
  maxWidthPx?: number
): Promise<{ data: ArrayBuffer; contentType: string }> {
  if (!photoName) {
    throw new Error('photoName is required')
  }

  // Use Places Photos (New) media endpoint
  // Photo name format: places/{placeId}/photos/{photoId}
  const url = `${PLACES_API_BASE}/${photoName}/media`
  const params = new URLSearchParams({
    maxHeightPx: maxHeightPx.toString(),
  })
  
  if (maxWidthPx) {
    params.append('maxWidthPx', maxWidthPx.toString())
  }

  console.log('Fetching place photo:', { 
    photoName: photoName.substring(0, 50), 
    maxHeightPx, 
    maxWidthPx,
    url: `${url}?${params.toString()}`.substring(0, 100)
  })

  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Places Photo API error: ${response.status} - ${error}`)
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg'
  const data = await response.arrayBuffer()

  return { data, contentType }
}

/**
 * Search for nearby venues using Google Places API
 * Returns venue suggestions with privacy-safe location data
 */
export interface PlaceSearchRequest {
  query: string
  near: { lat: number; lng: number }
  radiusMeters?: number
  maxResults?: number
}

export interface PlaceSuggestion {
  placeId: string
  displayName: string
  areaLabel: string // Neighborhood/city (privacy-safe, no exact address)
  googleMapsUri: string
  websiteUri?: string
  rating?: number
  userRatingCount?: number
  openNow?: boolean
  location?: { lat: number; lng: number } // Optional coordinates for map preview
}

export async function searchPlaces(
  request: PlaceSearchRequest,
  apiKey: string,
  showExactAddresses: boolean = false
): Promise<PlaceSuggestion[]> {
  const { query, near, radiusMeters = 5000, maxResults = 3 } = request

  // Use Places API (New) Text Search with location bias
  const url = `${PLACES_API_BASE}/places:searchText`
  
  const requestBody = {
    textQuery: query,
    maxResultCount: maxResults,
    locationBias: {
      circle: {
        center: {
          latitude: near.lat,
          longitude: near.lng,
        },
        radius: radiusMeters,
      },
    },
    // Note: includedType removed - textQuery already filters to relevant venues
    // The query itself (e.g., "circus props shop Kyoto") is sufficient
  }

  console.log('Searching places:', { query, near, radiusMeters, maxResults })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.websiteUri,places.currentOpeningHours,places.nationalPhoneNumber',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Places Search API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  const places = data.places || []

  // Transform to PlaceSuggestion format
  const suggestions: PlaceSuggestion[] = places.map((place: any) => {
    // Extract area label (privacy-safe: neighborhood or city, not exact address)
    let areaLabel = place.formattedAddress || ''
    if (!showExactAddresses && areaLabel) {
      // Remove street address, keep city/neighborhood
      // Format: "123 Main St, City, State" -> "City, State"
      const parts = areaLabel.split(',')
      if (parts.length >= 2) {
        areaLabel = parts.slice(1).join(',').trim()
      }
    }

    // Build Google Maps URI
    const googleMapsUri = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName?.text || query)}&query_place_id=${place.id}`

    return {
      placeId: place.id,
      displayName: place.displayName?.text || query,
      areaLabel,
      googleMapsUri,
      websiteUri: place.websiteUri,
      rating: place.rating,
      location: place.location ? {
        lat: place.location.latitude,
        lng: place.location.longitude,
      } : undefined,
      userRatingCount: place.userRatingCount,
      openNow: place.currentOpeningHours?.openNow,
    }
  })

  return suggestions
}
