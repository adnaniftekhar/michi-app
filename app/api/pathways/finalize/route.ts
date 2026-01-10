import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { VertexAI } from '@google-cloud/vertexai'
import { createAIPlanResponseSchema } from '@/lib/ai-plan-schema'
import type { FinalizePathwayRequest, FinalPathwayPlan, PathwayDraft } from '@/types'

export async function POST(request: Request) {
  try {
    // Verify user is authenticated
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: FinalizePathwayRequest & { trip?: any; learnerProfile?: any; chosenDraft?: PathwayDraft; editedDraft?: PathwayDraft } = await request.json()
    const { tripId, learnerId, chosenDraftId, selectedDates, effortMode, editedDraft } = body

    // Validate required fields
    if (!tripId || !learnerId || !chosenDraftId || !selectedDates || !Array.isArray(selectedDates) || selectedDates.length === 0 || !effortMode) {
      return NextResponse.json(
        { error: 'Missing required fields: tripId, learnerId, chosenDraftId, selectedDates (non-empty array), effortMode' },
        { status: 400 }
      )
    }

    // Get trip and learner profile (in a real app, fetch from database)
    const { trip, learnerProfile, chosenDraft } = body
    if (!trip || !learnerProfile || !chosenDraft) {
      return NextResponse.json(
        { error: 'Missing trip, learnerProfile, or chosenDraft in request body' },
        { status: 400 }
      )
    }

    // Use edited draft if provided, otherwise use original chosen draft
    const draftToUse: PathwayDraft = editedDraft || chosenDraft

    // Validate edited draft structure if provided
    if (editedDraft) {
      // Validate draft structure
      if (!editedDraft.id || !editedDraft.type || !editedDraft.title || !editedDraft.overview || !editedDraft.whyItFits) {
        return NextResponse.json(
          { error: 'Invalid editedDraft: missing required fields (id, type, title, overview, whyItFits)' },
          { status: 400 }
        )
      }

      // Validate day count matches selectedDates
      if (!editedDraft.days || !Array.isArray(editedDraft.days) || editedDraft.days.length !== selectedDates.length) {
        return NextResponse.json(
          { error: `Invalid editedDraft: days array length (${editedDraft.days?.length || 0}) must match selectedDates length (${selectedDates.length})` },
          { status: 400 }
        )
      }

      // Validate each day has required fields
      for (let i = 0; i < editedDraft.days.length; i++) {
        const day = editedDraft.days[i]
        if (!day.day || !day.date || !day.headline) {
          return NextResponse.json(
            { error: `Invalid editedDraft: day ${i + 1} missing required fields (day, date, headline)` },
            { status: 400 }
          )
        }
        // Validate day.date matches selectedDates[i]
        if (day.date !== selectedDates[i]) {
          return NextResponse.json(
            { error: `Invalid editedDraft: day ${i + 1} date (${day.date}) does not match selectedDates[${i}] (${selectedDates[i]})` },
            { status: 400 }
          )
        }
      }
    }

    // Initialize Vertex AI
    const project = process.env.GOOGLE_CLOUD_PROJECT || 'worldschool-mvp'
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
    
    const vertex = new VertexAI({
      project,
      location,
    })

    const model = vertex.getGenerativeModel({
      model: 'gemini-2.0-flash',
    })

    const numDays = selectedDates.length

    // Build prompt for final detailed plan based on chosen draft (use edited draft if provided)
    const prompt = buildFinalizePrompt(learnerProfile, trip, effortMode, selectedDates, draftToUse, numDays)

    console.log('Finalizing pathway plan, prompt length:', prompt.length)

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
    let parsedResponse
    try {
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/```\s*([\s\S]*?)\s*```/)
      const jsonText = jsonMatch ? jsonMatch[1] : responseText
      parsedResponse = JSON.parse(jsonText.trim())
    } catch (parseError) {
      console.error('Failed to parse finalize response:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON response from AI', details: String(parseError) },
        { status: 500 }
      )
    }

    // Validate with Zod schema
    const schema = createAIPlanResponseSchema(numDays)
    const validationResult = schema.safeParse(parsedResponse)
    if (!validationResult.success) {
      console.error('Schema validation failed:', validationResult.error)
      return NextResponse.json(
        {
          error: 'AI response does not match expected schema',
          details: validationResult.error.errors,
        },
        { status: 500 }
      )
    }

    // Get user settings for privacy toggles
    const { venueLinksEnabled = true, showExactAddresses = false } = body as any

    // Map AI response days to actual selected dates and enrich with local options
    const finalPlan: FinalPathwayPlan = {
      days: await Promise.all(
        validationResult.data.days.map(async (day, index) => {
          // Enrich each schedule block with local venue suggestions
          const enrichedBlocks = await Promise.all(
            day.scheduleBlocks.map(async (block) => {
              let localOptions: any[] | undefined

              // Only fetch local options if venue links are enabled
              if (venueLinksEnabled) {
                try {
                  // Generate search query from activity intent
                  const searchQuery = generateSearchQuery(block.title, block.description, day.fieldExperience, trip.baseLocation)
                  
                  if (!searchQuery) {
                    console.log(`No search query generated for activity "${block.title}"`)
                    // Continue without local options
                  } else {
                    // Get trip location coordinates (use city-level from trip or default)
                    const tripLocation = await getTripLocationCoordinates(trip.baseLocation)
                    
                    if (!tripLocation) {
                      console.warn(`Failed to resolve location coordinates for "${trip.baseLocation}"`)
                      // Continue without local options - non-blocking
                    } else {
                      // Call suggest function directly (server-side, no HTTP overhead)
                      const { searchPlaces } = await import('@/lib/places-api')
                      const apiKey = process.env.PLACES_API_KEY
                      if (!apiKey) {
                        console.warn('PLACES_API_KEY is missing - skipping local options')
                      } else {
                        console.log(`Fetching local options for "${block.title}": query="${searchQuery}", location=${tripLocation.lat},${tripLocation.lng}`)
                        const suggestions = await searchPlaces(
                          {
                            query: searchQuery,
                            near: tripLocation,
                            radiusMeters: 5000,
                            maxResults: 3,
                          },
                          apiKey,
                          showExactAddresses
                        )
                        localOptions = suggestions
                        console.log(`Found ${suggestions.length} local options for "${block.title}"`)
                      }
                    }
                  }
                } catch (error) {
                  console.warn(`Failed to fetch local options for activity "${block.title}":`, error)
                  // Continue without local options - non-blocking
                }
              }

              return {
                startTime: block.startTime,
                duration: block.duration,
                title: block.title,
                description: block.description,
                localOptions,
              }
            })
          )

          return {
            day: index + 1,
            date: selectedDates[index],
            drivingQuestion: day.drivingQuestion,
            fieldExperience: day.fieldExperience,
            inquiryTask: day.inquiryTask,
            artifact: day.artifact,
            reflectionPrompt: day.reflectionPrompt,
            critiqueStep: day.critiqueStep,
            scheduleBlocks: enrichedBlocks,
          }
        })
      ),
      summary: validationResult.data.summary,
    }

    return NextResponse.json(finalPlan)
  } catch (error) {
    console.error('Error finalizing pathway:', error)
    return NextResponse.json(
      {
        error: 'Failed to finalize pathway',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

function buildFinalizePrompt(
  learnerProfile: any,
  trip: any,
  effortMode: string,
  selectedDates: string[],
  draft: PathwayDraft,
  numDays: number
): string {
  const datesSummary = selectedDates
    .map((date, idx) => {
      const day = draft.days?.[idx]
      const headline = day?.headline || `Day ${idx + 1} activities`
      const summary = day?.summary ? `\n  Summary: ${day.summary}` : ''
      return `Day ${idx + 1} (${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}): ${headline}${summary}`
    })
    .join('\n')

  return `You are an expert learning pathway designer creating a detailed, day-by-day learning plan.

LEARNER PROFILE:
- Name: ${learnerProfile.name}
- Timezone: ${learnerProfile.timezone}
- Level: ${learnerProfile.pblProfile.currentLevel}
- Interests: ${learnerProfile.pblProfile.interests.join(', ')}
- Goals: ${learnerProfile.pblProfile.learningGoals.join(', ')}
- Preferred artifact types: ${learnerProfile.pblProfile.preferredArtifactTypes.join(', ')}
- Preferred learning times: ${learnerProfile.preferences.preferredLearningTimes.join(', ')}
- Preferred duration: ${learnerProfile.preferences.preferredDuration}
- Interaction style: ${learnerProfile.preferences.interactionStyle}
- Reflection style: ${learnerProfile.experientialProfile.reflectionStyle}
- Inquiry approach: ${learnerProfile.experientialProfile.inquiryApproach}
${learnerProfile.constraints.maxDailyMinutes ? `- Max daily minutes: ${learnerProfile.constraints.maxDailyMinutes}` : ''}

TRIP CONTEXT:
- Title: ${trip.title}
- Location: ${trip.baseLocation}
- Effort Mode: ${effortMode}

CHOSEN PATHWAY APPROACH:
- Type: ${draft.type}
- Title: ${draft.title}
- Overview: ${draft.overview}
- Why It Fits: ${draft.whyItFits}
${draft.rationale ? `- Rationale: ${draft.rationale}` : ''}

DAY-BY-DAY HEADLINES:
${datesSummary}

TASK:
Generate a detailed ${numDays}-day PBL learning pathway following the "${draft.title}" approach. Each day must include:
1. drivingQuestion: A compelling question that drives inquiry
2. fieldExperience: A real-world experience aligned to the location
3. inquiryTask: A specific task for investigation/exploration
4. artifact: What the learner will create/produce
5. reflectionPrompt: A prompt for reflection aligned to their reflection style
6. critiqueStep: How they will get feedback/improve
7. scheduleBlocks: Array of learning blocks with startTime (ISO datetime in ${learnerProfile.timezone}), duration (minutes), title, and optional description

REQUIREMENTS:
- All ${numDays} days must be filled (days 1-${numDays})
- Schedule block dates must match the selectedDates: ${selectedDates.join(', ')}
- Schedule blocks must respect preferred learning times and constraints
- Total daily learning time should align with effort mode: ${effortMode}
- Field experiences should leverage the location: ${trip.baseLocation}
- Artifacts should match preferred types: ${learnerProfile.pblProfile.preferredArtifactTypes.join(', ')}
- Inquiry approach should be ${learnerProfile.experientialProfile.inquiryApproach}
- Follow the "${draft.title}" approach consistently throughout
${draft.rationale ? `- Incorporate the following rationale: ${draft.rationale}` : ''}
- NO images, maps, or location photos should be included or referenced
- NO precise addresses or sensitive personal data
- All content must be age-appropriate

OUTPUT FORMAT:
Return ONLY valid JSON matching this schema:
{
  "days": [
    {
      "day": 1,
      "drivingQuestion": "...",
      "fieldExperience": "...",
      "inquiryTask": "...",
      "artifact": "...",
      "reflectionPrompt": "...",
      "critiqueStep": "...",
      "scheduleBlocks": [
        {
          "startTime": "2026-06-01T09:00:00",
          "duration": 60,
          "title": "...",
          "description": "..."
        }
      ]
    }
  ],
  "summary": "Brief overview of the pathway"
}

Generate the complete ${numDays}-day detailed pathway now.`
}

/**
 * Generate a search query for local venues based on activity intent
 */
function generateSearchQuery(
  title: string,
  description: string | undefined,
  fieldExperience: string | undefined,
  tripLocation: string
): string | null {
  // Extract key terms from activity
  const activityText = `${title} ${description || ''} ${fieldExperience || ''}`.toLowerCase()
  
  // Common venue types to search for
  const venueKeywords: Record<string, string[]> = {
    shop: ['shop', 'store', 'market', 'boutique'],
    museum: ['museum', 'gallery', 'exhibition'],
    park: ['park', 'garden', 'nature', 'outdoor'],
    restaurant: ['restaurant', 'cafe', 'food', 'dining'],
    library: ['library', 'bookstore', 'books'],
    workshop: ['workshop', 'studio', 'class', 'course'],
    theater: ['theater', 'cinema', 'performance', 'show'],
    market: ['market', 'bazaar', 'vendor', 'stall'],
  }

  // Find matching venue type
  for (const [type, keywords] of Object.entries(venueKeywords)) {
    if (keywords.some((keyword) => activityText.includes(keyword))) {
      // Generate search query: "type + location" or "activity + location"
      const searchTerms = [type, tripLocation].join(' ')
      return searchTerms
    }
  }

  // Fallback: use activity title + location
  if (title && tripLocation) {
    return `${title} ${tripLocation}`
  }

  return null
}

/**
 * Get trip location coordinates (city-level for privacy)
 */
async function getTripLocationCoordinates(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const apiKey = process.env.PLACES_API_KEY
    if (!apiKey) {
      return null
    }

    const { resolvePlace } = await import('@/lib/places-api')
    const placeData = await resolvePlace({ query: location }, apiKey)
    return placeData.location
  } catch (error) {
    console.warn(`Failed to resolve location coordinates for "${location}":`, error)
    return null
  }
}
