import { NextResponse } from 'next/server'

/**
 * Runtime config endpoint for client-side configuration
 * Allows Maps browser key to be injected at runtime (e.g., in Cloud Run)
 * without requiring a rebuild
 */
export async function GET() {
  try {
    // Use MAPS_BROWSER_KEY (NOT NEXT_PUBLIC_MAPS_BROWSER_KEY)
    // This allows runtime injection in Cloud Run without rebuild
    const mapsBrowserKey = process.env.MAPS_BROWSER_KEY || ''

    // Always return 200, even if key is missing
    // Client can gracefully fallback to static maps
    return NextResponse.json({
      mapsBrowserKey,
    })
  } catch (error) {
    // On error, return empty key (client will use static fallback)
    return NextResponse.json({
      mapsBrowserKey: '',
    })
  }
}
