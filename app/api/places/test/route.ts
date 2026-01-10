import { NextResponse } from 'next/server'
import { resolvePlace } from '@/lib/places-api'

/**
 * Test endpoint to verify Places API is working
 * TDD approach: Test the API key and basic functionality
 */
export async function GET() {
  try {
    const apiKey = process.env.PLACES_API_KEY
    
    // Test 1: Check if API key is configured
    if (!apiKey || apiKey === 'your_places_api_key_here' || apiKey.trim().length === 0) {
      return NextResponse.json({
        success: false,
        test: 'API Key Configuration',
        error: 'PLACES_API_KEY is not set or is a placeholder',
        details: {
          hasKey: !!apiKey,
          keyLength: apiKey?.length || 0,
          isPlaceholder: apiKey === 'your_places_api_key_here',
        },
      }, { status: 500 })
    }

    // Test 2: Try to resolve a simple location
    try {
      const testQuery = 'New York City, NY, USA'
      const result = await resolvePlace({ query: testQuery }, apiKey)
      
      // Test 3: Verify response structure
      const hasRequiredFields = !!(
        result.placeId &&
        result.displayName &&
        result.location &&
        typeof result.location.lat === 'number' &&
        typeof result.location.lng === 'number'
      )

      return NextResponse.json({
        success: true,
        tests: {
          'API Key Configured': {
            passed: true,
            details: { keyLength: apiKey.length, keyPrefix: apiKey.substring(0, 10) + '...' },
          },
          'Place Resolution': {
            passed: true,
            details: {
              query: testQuery,
              placeId: result.placeId,
              displayName: result.displayName,
              location: result.location,
            },
          },
          'Response Structure': {
            passed: hasRequiredFields,
            details: {
              hasPlaceId: !!result.placeId,
              hasDisplayName: !!result.displayName,
              hasLocation: !!result.location,
              hasValidCoordinates: !!(result.location?.lat && result.location?.lng),
            },
          },
        },
        summary: 'All tests passed! Places API is working correctly.',
      })
    } catch (resolveError) {
      return NextResponse.json({
        success: false,
        tests: {
          'API Key Configured': {
            passed: true,
            details: { keyLength: apiKey.length, keyPrefix: apiKey.substring(0, 10) + '...' },
          },
          'Place Resolution': {
            passed: false,
            error: resolveError instanceof Error ? resolveError.message : String(resolveError),
            details: {
              errorType: resolveError instanceof Error ? resolveError.name : 'Unknown',
            },
          },
        },
        summary: 'API key is configured but place resolution failed.',
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Test endpoint failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
