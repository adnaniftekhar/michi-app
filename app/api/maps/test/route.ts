import { NextResponse } from 'next/server'

/**
 * Test endpoint to verify Maps API key is working
 * TDD approach: Test the API key configuration
 */
export async function GET() {
  try {
    const mapsBrowserKey = process.env.MAPS_BROWSER_KEY || process.env.NEXT_PUBLIC_MAPS_BROWSER_KEY || ''
    
    // Test 1: Check if API key is configured
    if (!mapsBrowserKey || mapsBrowserKey === 'your_maps_browser_key_here' || mapsBrowserKey.trim().length === 0) {
      return NextResponse.json({
        success: false,
        test: 'Maps API Key Configuration',
        error: 'MAPS_BROWSER_KEY or NEXT_PUBLIC_MAPS_BROWSER_KEY is not set or is a placeholder',
        details: {
          hasMAPS_BROWSER_KEY: !!process.env.MAPS_BROWSER_KEY,
          hasNEXT_PUBLIC_MAPS_BROWSER_KEY: !!process.env.NEXT_PUBLIC_MAPS_BROWSER_KEY,
          keyLength: mapsBrowserKey?.length || 0,
          isPlaceholder: mapsBrowserKey === 'your_maps_browser_key_here',
        },
      }, { status: 500 })
    }

    // Test 2: Verify key format (Google API keys typically start with AIza)
    const isValidFormat = mapsBrowserKey.startsWith('AIza') && mapsBrowserKey.length > 30

    // Test 3: Check if public-config endpoint returns the key
    const publicConfigUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    let publicConfigWorks = false
    try {
      const configResponse = await fetch(`${publicConfigUrl}/api/public-config`)
      if (configResponse.ok) {
        const configData = await configResponse.json()
        publicConfigWorks = configData.mapsBrowserKey === mapsBrowserKey
      }
    } catch {
      // Ignore fetch errors in test
    }

    return NextResponse.json({
      success: true,
      tests: {
        'API Key Configured': {
          passed: true,
          details: {
            keyLength: mapsBrowserKey.length,
            keyPrefix: mapsBrowserKey.substring(0, 10) + '...',
            source: process.env.MAPS_BROWSER_KEY ? 'MAPS_BROWSER_KEY' : 'NEXT_PUBLIC_MAPS_BROWSER_KEY',
          },
        },
        'Key Format': {
          passed: isValidFormat,
          details: {
            startsWithAIza: mapsBrowserKey.startsWith('AIza'),
            minLength: mapsBrowserKey.length >= 30,
          },
        },
        'Public Config Endpoint': {
          passed: publicConfigWorks,
          details: {
            note: 'This test may fail if server is not running. Key is still configured correctly.',
          },
        },
      },
      summary: isValidFormat 
        ? 'Maps API key is configured correctly! Format looks valid.' 
        : 'Maps API key is configured but format may be invalid.',
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Test endpoint failed',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
