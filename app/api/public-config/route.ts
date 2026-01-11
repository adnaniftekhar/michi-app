import { NextResponse } from 'next/server'

/**
 * Runtime config endpoint for client-side configuration
 * Allows Maps browser key to be injected at runtime (e.g., in Cloud Run)
 * without requiring a rebuild
 */
export async function GET() {
  console.log('[public-config] 🔍 GET request received')
  try {
    // Check both MAPS_BROWSER_KEY (for Cloud Run runtime) and NEXT_PUBLIC_MAPS_BROWSER_KEY (for build-time or local dev)
    // This allows runtime injection in Cloud Run without rebuild, but also works locally
    const mapsBrowserKeyFromEnv = process.env.MAPS_BROWSER_KEY
    const mapsBrowserKeyFromPublic = process.env.NEXT_PUBLIC_MAPS_BROWSER_KEY
    const mapsBrowserKey = mapsBrowserKeyFromEnv || mapsBrowserKeyFromPublic || ''

    // EXTENSIVE logging for debugging
    console.log('[public-config] 📋 Environment variable check:', {
      hasMAPS_BROWSER_KEY: !!mapsBrowserKeyFromEnv,
      MAPS_BROWSER_KEY_length: mapsBrowserKeyFromEnv?.length || 0,
      MAPS_BROWSER_KEY_prefix: mapsBrowserKeyFromEnv ? mapsBrowserKeyFromEnv.substring(0, 8) + '...' : 'empty',
      hasNEXT_PUBLIC_MAPS_BROWSER_KEY: !!mapsBrowserKeyFromPublic,
      NEXT_PUBLIC_MAPS_BROWSER_KEY_length: mapsBrowserKeyFromPublic?.length || 0,
      NEXT_PUBLIC_MAPS_BROWSER_KEY_prefix: mapsBrowserKeyFromPublic ? mapsBrowserKeyFromPublic.substring(0, 8) + '...' : 'empty',
      finalKeyLength: mapsBrowserKey.length,
      finalKeyPrefix: mapsBrowserKey ? mapsBrowserKey.substring(0, 8) + '...' : 'empty',
      nodeEnv: process.env.NODE_ENV,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('MAPS') || k.includes('maps')).join(', ') || 'none'
    })

    if (!mapsBrowserKey || mapsBrowserKey.trim().length === 0) {
      console.error('[public-config] ❌ Maps API key is MISSING')
      console.error('[public-config] 💡 Solution: Add NEXT_PUBLIC_MAPS_BROWSER_KEY or MAPS_BROWSER_KEY to .env.local')
      console.error('[public-config] 💡 Or load from GCP Secret Manager using: ./load-gcp-secrets.sh')
    } else {
      console.log('[public-config] ✅ Maps API key found and will be returned')
    }

    // Always return 200, even if key is missing
    // Client can gracefully fallback to static maps
    const response = {
      mapsBrowserKey,
    }
    console.log('[public-config] 📤 Returning response:', {
      hasKey: !!response.mapsBrowserKey,
      keyLength: response.mapsBrowserKey?.length || 0
    })
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('[public-config] ❌ Error fetching Maps key:', error)
    console.error('[public-config] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    // On error, return empty key (client will use static fallback)
    return NextResponse.json({
      mapsBrowserKey: '',
    })
  }
}
