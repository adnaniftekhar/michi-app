import { NextResponse } from 'next/server'

// Unsplash API for searching images by keyword
// Free tier: 50 requests/hour (demo), 5000 requests/hour (production)
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY

// Words to filter out from search queries (not useful for image search)
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'project', 'activity', 'task', 'assignment', 'lesson', 'day',
])

// Extract meaningful keywords from a title
function extractKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // Remove special characters
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word))
    .slice(0, 5) // Take top 5 keywords
}

// Fallback images for when search fails (kid-friendly, educational)
const FALLBACK_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop', alt: 'Education and learning' },
  { url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=400&fit=crop', alt: 'Books and study' },
  { url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop', alt: 'Learning environment' },
  { url: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&h=400&fit=crop', alt: 'Creative workspace' },
  { url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=400&fit=crop', alt: 'Study materials' },
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const index = parseInt(searchParams.get('index') || '0', 10)

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
  }

  // Extract keywords from the query
  const keywords = extractKeywords(query)
  const searchQuery = keywords.join(' ')

  console.log(`[Images API] Searching for: "${searchQuery}" (from: "${query}")`)

  // If no Unsplash key, use fallback
  if (!UNSPLASH_ACCESS_KEY) {
    console.log('[Images API] No UNSPLASH_ACCESS_KEY, using fallback')
    const fallback = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
    return NextResponse.json({
      imageUrl: fallback.url,
      alt: fallback.alt,
      source: 'fallback',
    })
  }

  try {
    // Search Unsplash
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=5&content_filter=high&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.results && data.results.length > 0) {
      // Pick image based on index (to get variety for different activities)
      const imageIndex = index % data.results.length
      const image = data.results[imageIndex]

      return NextResponse.json({
        imageUrl: `${image.urls.regular}&w=800&h=400&fit=crop`,
        alt: image.alt_description || `Image for ${query}`,
        source: 'unsplash',
        photographer: image.user?.name,
        photographerUrl: image.user?.links?.html,
      })
    }

    // No results - try with fewer keywords
    if (keywords.length > 2) {
      const simplerQuery = keywords.slice(0, 2).join(' ')
      console.log(`[Images API] No results, trying simpler query: "${simplerQuery}"`)
      
      const retryResponse = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(simplerQuery)}&per_page=5&content_filter=high&orientation=landscape`,
        {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
          },
        }
      )

      if (retryResponse.ok) {
        const retryData = await retryResponse.json()
        if (retryData.results && retryData.results.length > 0) {
          const image = retryData.results[index % retryData.results.length]
          return NextResponse.json({
            imageUrl: `${image.urls.regular}&w=800&h=400&fit=crop`,
            alt: image.alt_description || `Image for ${query}`,
            source: 'unsplash',
            photographer: image.user?.name,
            photographerUrl: image.user?.links?.html,
          })
        }
      }
    }

    // Still no results - use fallback
    console.log('[Images API] No Unsplash results, using fallback')
    const fallback = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
    return NextResponse.json({
      imageUrl: fallback.url,
      alt: fallback.alt,
      source: 'fallback',
    })

  } catch (error) {
    console.error('[Images API] Error:', error)
    const fallback = FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
    return NextResponse.json({
      imageUrl: fallback.url,
      alt: fallback.alt,
      source: 'fallback',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
