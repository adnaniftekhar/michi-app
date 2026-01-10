import { NextResponse } from 'next/server'

/**
 * Runtime config endpoint for client-side configuration
 * Allows Maps browser key to be injected at runtime (e.g., in Cloud Run)
 * without requiring a rebuild
 */
export async function GET() {
  try {
    // Check both MAPS_BROWSER_KEY (for Cloud Run runtime) and NEXT_PUBLIC_MAPS_BROWSER_KEY (for build-time or local dev)
    // This allows runtime injection in Cloud Run without rebuild, but also works locally
    const mapsBrowserKey = process.env.MAPS_BROWSER_KEY || process.env.NEXT_PUBLIC_MAPS_BROWSER_KEY || ''

    // Log for debugging (always log in production to help diagnose issues)
    console.log('[public-config] Maps key check:', {
      hasMAPS_BROWSER_KEY: !!process.env.MAPS_BROWSER_KEY,
      hasNEXT_PUBLIC_MAPS_BROWSER_KEY: !!process.env.NEXT_PUBLIC_MAPS_BROWSER_KEY,
      keyLength: mapsBrowserKey.length,
      keyPrefix: mapsBrowserKey ? mapsBrowserKey.substring(0, 4) + '...' : 'empty',
      nodeEnv: process.env.NODE_ENV,
    })

    // Always return 200, even if key is missing
    // Client can gracefully fallback to static maps
    return NextResponse.json({
      mapsBrowserKey,
    })
  } catch (error) {
    console.error('[public-config] Error fetching Maps key:', error)
    // On error, return empty key (client will use static fallback)
    return NextResponse.json({
      mapsBrowserKey: '',
    })
  }
}
