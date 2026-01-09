/**
 * AI Image Generation Service
 * Generates safe, generic illustrations for activities
 * No faces, no children, no identifying information
 */

import { VertexAI } from '@google-cloud/vertexai'

interface GenerateIllustrationParams {
  activityTitle: string
  activityType: string
  city?: string
  country?: string
}

/**
 * Generates a safe illustration for an activity using Vertex AI (Imagen)
 * Falls back to default icon if generation fails
 */
export async function generateActivityIllustration(
  params: GenerateIllustrationParams
): Promise<{ imageUrl: string; assetId: string } | null> {
  try {
    const vertex = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT || 'worldschool-mvp',
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    })

    // Use Imagen for image generation
    // Note: This is a placeholder - actual implementation depends on Imagen API availability
    // For now, return null to use fallback icons
    
    // Safe prompt construction (no faces, no children, generic)
    const prompt = `A simple, clean illustration of ${params.activityType} activity. 
      Generic, no people, no faces, no children. 
      Suitable for educational content. 
      Style: minimalist, professional, age-appropriate.`
    
    // TODO: Implement actual Imagen API call when available
    // For now, return null to trigger fallback
    return null
  } catch (error) {
    console.error('AI image generation error:', error)
    return null
  }
}

/**
 * Gets a fallback image URL for an activity
 * Used when AI generation fails or is not available
 */
export function getFallbackImageUrl(activityType: string): string {
  // Use Picsum Photos as fallback (same as current implementation)
  const imageSeeds: Record<string, number> = {
    museum: 101,
    nature: 102,
    market: 103,
    historical: 104,
    cultural: 105,
    lab: 106,
    workshop: 107,
    reading: 108,
    discussion: 109,
    reflection: 110,
    default: 111,
  }

  const seed = imageSeeds[activityType] || imageSeeds.default
  return `https://picsum.photos/seed/${seed}/400/400`
}
