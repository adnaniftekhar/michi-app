import { NextResponse } from 'next/server'
import { VertexAI } from '@google-cloud/vertexai'

/**
 * Uses AI to generate relevant, kid-appropriate image search keywords
 * for a learning activity. Ensures keywords are safe, educational, and relevant.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { activityTitle, activityDescription, fieldExperience, location: activityLocation } = body

    if (!activityTitle) {
      return NextResponse.json(
        { error: 'activityTitle is required' },
        { status: 400 }
      )
    }

    // Initialize Vertex AI
    const project = process.env.GOOGLE_CLOUD_PROJECT || 'worldschool-mvp'
    const cloudLocation = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
    
    const vertex = new VertexAI({
      project,
      location: cloudLocation,
    })

    const model = vertex.getGenerativeModel({
      model: 'gemini-2.0-flash',
    })

    // Build prompt for keyword generation
    const prompt = `You are helping to find appropriate images for a learning activity. Generate 3-5 specific, kid-appropriate image search keywords.

ACTIVITY DETAILS:
- Title: ${activityTitle}
${activityDescription ? `- Description: ${activityDescription}` : ''}
${fieldExperience ? `- Field Experience: ${fieldExperience}` : ''}
${activityLocation ? `- Location: ${activityLocation}` : ''}

REQUIREMENTS:
1. Keywords must be kid-appropriate (no violence, no inappropriate content)
2. Keywords should NOT include people or faces (we want images without identifiable people)
3. Keywords should be specific and relevant to the activity
4. Focus on objects, places, nature, architecture, educational materials, or abstract concepts
5. Use simple, clear terms that would work well in an image search
6. Avoid generic terms like "learning" or "education"

EXAMPLES:
- For "Museum Visit": "museum interior", "art gallery empty", "exhibition display", "museum artifacts"
- For "Nature Walk": "forest path", "tropical plants", "mountain landscape", "ecosystem"
- For "Reading Activity": "books on shelf", "library interior", "open book", "reading materials"
- For "Historical Site": "ancient ruins", "historical monument", "archaeological site", "heritage building"

Return ONLY a JSON array of 3-5 keyword strings, nothing else. Example format:
["keyword1", "keyword2", "keyword3"]`

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    })

    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    
    // Parse JSON response
    let keywords: string[] = []
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/```\s*([\s\S]*?)\s*```/)
      const jsonText = jsonMatch ? jsonMatch[1] : responseText
      const parsed = JSON.parse(jsonText.trim())
      
      if (Array.isArray(parsed)) {
        keywords = parsed.filter(k => typeof k === 'string' && k.length > 0)
      } else if (typeof parsed === 'string') {
        // Sometimes AI returns a single string, try to parse it
        keywords = [parsed]
      }
    } catch (parseError) {
      console.warn('Failed to parse AI keywords response, using fallback:', parseError)
      // Fallback: extract keywords from text if JSON parsing fails
      const words = responseText.match(/"([^"]+)"/g) || []
      keywords = words.map(w => w.replace(/"/g, '')).filter(k => k.length > 0)
    }

    // Ensure we have at least one keyword
    if (keywords.length === 0) {
      keywords = [activityTitle.toLowerCase()]
    }

    return NextResponse.json({ keywords })
  } catch (error) {
    console.error('Error generating image keywords:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate image keywords',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
