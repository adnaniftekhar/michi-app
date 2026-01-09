/**
 * Enriches AI-generated activities with Google Places data
 * Called server-side during pathway generation
 */

import type { AIPlanResponse, AIPlanDay } from '@/lib/ai-plan-schema'
import type { ImageMode } from '@/types'

interface EnrichmentOptions {
  imageMode: ImageMode
  includeMaps: boolean
  tripBaseLocation: string
}

interface EnrichedDay extends AIPlanDay {
  scheduleBlocks: Array<AIPlanDay['scheduleBlocks'][0] & {
    placeId?: string
    placeName?: string
    approxLat?: number
    approxLng?: number
    photoName?: string
    photoAttribution?: { displayName: string; uri: string }
  }>
}

/**
 * Enriches a pathway with Places data for activities that have locations
 */
export async function enrichActivitiesWithPlaces(
  pathway: AIPlanResponse,
  options: EnrichmentOptions
): Promise<AIPlanResponse> {
  // Always enrich if we have location data (fieldExperience) to resolve
  // This ensures maps work even if includeMaps wasn't explicitly enabled
  // Only skip if we truly don't need any enrichment
  const hasLocationData = pathway.days.some(day => day.fieldExperience)
  if (options.imageMode === 'off' && !options.includeMaps && !hasLocationData) {
    // No enrichment needed
    return pathway
  }
  
  // If we have location data, always enrich for maps (even if includeMaps wasn't set)
  if (hasLocationData && !options.includeMaps) {
    console.log('Location data detected, enriching for maps even though includeMaps was not explicitly enabled')
  }

  const enrichedDays: EnrichedDay[] = []

  for (const day of pathway.days) {
    const enrichedBlocks = await Promise.all(
      day.scheduleBlocks.map(async (block) => {
        // Always generate image keywords for better image relevance (even without location)
        // This ensures all activities get relevant images
        const enrichedBlock: any = { ...block }
        
        // Generate AI-powered image keywords for better image relevance
        // Do this for ALL blocks, not just those with locations
        try {
          const { VertexAI } = await import('@google-cloud/vertexai')
          const project = process.env.GOOGLE_CLOUD_PROJECT || 'worldschool-mvp'
          const cloudLocation = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
          
          const vertex = new VertexAI({ project, location: cloudLocation })
          const model = vertex.getGenerativeModel({ model: 'gemini-2.0-flash' })
          
          const keywordPrompt = `Generate 3-5 kid-appropriate image search keywords for this learning activity. Keywords must be safe, educational, and relevant. Do NOT include people or faces.

Activity: ${block.title}
${block.description ? `Description: ${block.description}` : ''}
${day.fieldExperience ? `Field Experience: ${day.fieldExperience}` : ''}
${options.tripBaseLocation ? `Location: ${options.tripBaseLocation}` : ''}

Return ONLY a JSON array of 3-5 keyword strings. Example: ["museum interior", "art gallery", "exhibition display"]`

          // Use Promise.race with timeout to prevent blocking
          const keywordResult = await Promise.race([
            model.generateContent({
              contents: [{ role: 'user', parts: [{ text: keywordPrompt }] }],
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Keyword generation timeout')), 5000)
            )
          ]) as Awaited<ReturnType<typeof model.generateContent>>
          
          const keywordText = keywordResult.response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
          try {
            const jsonMatch = keywordText.match(/```json\s*([\s\S]*?)\s*```/) || keywordText.match(/```\s*([\s\S]*?)\s*```/)
            const jsonText = jsonMatch ? jsonMatch[1] : keywordText
            const parsed = JSON.parse(jsonText.trim())
            if (Array.isArray(parsed) && parsed.length > 0) {
              enrichedBlock.imageKeywords = parsed.filter((k: any) => typeof k === 'string' && k.length > 0)
              console.log(`Generated image keywords for "${block.title}":`, enrichedBlock.imageKeywords)
            }
          } catch (parseError) {
            console.warn(`Failed to parse image keywords for "${block.title}"`, parseError)
          }
        } catch (keywordError) {
          console.warn(`Failed to generate image keywords for "${block.title}" (non-blocking):`, keywordError)
          // Continue without keywords - fallback will be used
        }

        // Determine location source: check block title/description first, then day fieldExperience
        // The AI might mention locations in the block title or description
        // Also check for location in the fieldExperience which often contains place names
        const locationQuery = 
          day.fieldExperience ||
          block.title?.match(/\b(in|at|near|visit|explore|Kyoto|Tokyo|Paris|London|New York|Costa Rica|La Fortuna|Arenal)\s+([A-Z][a-zA-Z\s,]+)/)?.[2]?.trim() ||
          block.description?.match(/\b(in|at|near|visit|explore|Kyoto|Tokyo|Paris|London|New York|Costa Rica|La Fortuna|Arenal)\s+([A-Z][a-zA-Z\s,]+)/)?.[2]?.trim() ||
          null

        // Only enrich with Places data if there's a location to resolve
        if (!locationQuery) {
          console.log(`No location found for block "${block.title}" - skipping Places enrichment, but image keywords already generated`)
          return enrichedBlock
        }

        try {
          // Import Places API functions (server-side only)
          const { resolvePlace, getPlaceDetails } = await import('@/lib/places-api')
          const apiKey = process.env.PLACES_API_KEY

          if (!apiKey) {
            console.warn('PLACES_API_KEY not configured, skipping enrichment')
            return block
          }

          console.log(`Resolving location for block "${block.title}": ${locationQuery}`)

          // Resolve the location to a place (server-side call)
          // Add timeout to prevent hanging
          const placeData = await Promise.race([
            resolvePlace(
              {
                query: locationQuery,
                cityBias: options.tripBaseLocation,
              },
              apiKey
            ),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Places API timeout')), 10000)
            )
          ]) as Awaited<ReturnType<typeof resolvePlace>>

          console.log(`Place resolved for "${block.title}": ${placeData.displayName} (${placeData.location.lat}, ${placeData.location.lng})`)

          // Add place data for maps - ALWAYS set if we have location data
          // This ensures maps work even if includeMaps wasn't explicitly enabled
          enrichedBlock.placeId = placeData.placeId
          enrichedBlock.placeName = placeData.displayName
          enrichedBlock.approxLat = placeData.location.lat
          enrichedBlock.approxLng = placeData.location.lng
          console.log(`Coordinates set for "${block.title}": lat=${placeData.location.lat}, lng=${placeData.location.lng}`)
          
          // Image keywords were already generated above for all blocks

          // Get photos if imageMode is 'google'
          // NOTE: We prioritize activity-specific images over Places photos to ensure:
          // 1. Each activity gets a unique, relevant image
          // 2. Images are kid-appropriate (no people, no inappropriate content)
          // 3. Images match the activity type (museum, nature, cultural, etc.)
          // Places photos are often generic place photos that may not be activity-specific
          // and may contain people or inappropriate content for educational use.
          if (options.imageMode === 'google') {
            // For now, skip Places photos and use activity-specific images instead
            // This ensures kid-appropriate, unique images per activity
            console.log(`Skipping Places photos for "${block.title}" - using activity-specific image instead for kid-safety and relevance`)
            
            // We'll set imageMode to 'off' here and let the frontend use activity-specific images
            // This ensures each activity gets a unique, relevant, kid-safe image
            enrichedBlock.imageMode = 'off' // Frontend will use activity-specific fallback
          }

          return enrichedBlock
        } catch (error) {
          console.warn(`Error enriching activity block "${block.title}":`, error)
          console.warn('Error details:', error instanceof Error ? error.message : String(error))
          // Return block without enrichment if Places API fails
          return block
        }
      })
    )

    enrichedDays.push({
      ...day,
      scheduleBlocks: enrichedBlocks,
    })
  }

  return {
    ...pathway,
    days: enrichedDays,
  }
}
