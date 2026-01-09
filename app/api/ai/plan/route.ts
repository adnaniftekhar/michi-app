import { NextResponse } from 'next/server'
import { VertexAI } from '@google-cloud/vertexai'
import { createAIPlanResponseSchema } from '@/lib/ai-plan-schema'
import { getLearnerProfile } from '@/lib/learner-profiles'
import type { Trip, LearningTarget, ItineraryItem } from '@/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { learnerProfileId, learnerProfile, trip, learningTarget, existingItinerary, generationOptions } = body

    // Validate required fields - either learnerProfile or learnerProfileId must be provided
    if ((!learnerProfile && !learnerProfileId) || !trip || !learningTarget) {
      return NextResponse.json(
        { error: 'Missing required fields: learnerProfile (or learnerProfileId), trip, learningTarget' },
        { status: 400 }
      )
    }

    // Use provided learner profile or fall back to getting it (for backward compatibility)
    let profile = learnerProfile
    if (!profile) {
      if (!learnerProfileId) {
        return NextResponse.json(
          { error: 'Either learnerProfile or learnerProfileId must be provided' },
          { status: 400 }
        )
      }
      profile = getLearnerProfile(learnerProfileId)
      if (!profile) {
        return NextResponse.json(
          { error: 'Invalid learner profile ID' },
          { status: 400 }
        )
      }
    }

    // Initialize Vertex AI
    const project = process.env.GOOGLE_CLOUD_PROJECT || 'worldschool-mvp'
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
    
    console.log('Initializing Vertex AI:', { project, location })
    
    const vertex = new VertexAI({
      project,
      location,
    })

    const model = vertex.getGenerativeModel({
      model: 'gemini-2.0-flash',
    })
    
    console.log('Vertex AI model initialized successfully')

    // Calculate actual trip duration in days based on selected days or full trip
    let numDays: number
    let selectedDays: string[] = []
    
    if (generationOptions?.selectedDays && generationOptions.selectedDays.length > 0) {
      selectedDays = generationOptions.selectedDays
      numDays = selectedDays.length
    } else {
      const startDate = new Date(trip.startDate)
      const endDate = new Date(trip.endDate)
      numDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    }

    // Build prompt for PBL-aligned learning pathway
    const prompt = buildPlanPrompt(profile, trip, learningTarget, existingItinerary || [], numDays, generationOptions)
    
    console.log('Calling Vertex AI with prompt length:', prompt.length, 'characters')
    console.log('Number of days:', numDays)

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    })

    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    
    console.log('AI response received, length:', responseText.length, 'characters')
    console.log('AI response preview:', responseText.substring(0, 200))

    // Parse and validate JSON response
    let parsedResponse
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/```\s*([\s\S]*?)\s*```/)
      const jsonText = jsonMatch ? jsonMatch[1] : responseText
      parsedResponse = JSON.parse(jsonText.trim())
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON response from AI', details: String(parseError) },
        { status: 500 }
      )
    }

    // Validate with Zod schema using the actual trip duration
    const schema = createAIPlanResponseSchema(numDays)
    const validationResult = schema.safeParse(parsedResponse)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'AI response does not match schema', details: validationResult.error.errors },
        { status: 500 }
      )
    }

    // When selectedDays are provided, map AI's day numbers (1, 2, 3...) to actual selected dates
    // The AI generates days numbered 1-N, but we need to map them to the actual selected dates
    let finalResponse = validationResult.data
    if (generationOptions?.selectedDays && generationOptions.selectedDays.length > 0) {
      const startDate = new Date(trip.startDate)
      const selectedDays = generationOptions.selectedDays.sort() // Sort to ensure consistent mapping
      
      console.log(`[AI Plan] Mapping AI days to selected dates:`, {
        totalDaysGenerated: finalResponse.days.length,
        selectedDays: selectedDays,
        startDate: startDate.toISOString().split('T')[0],
      })
      
      // Map each AI-generated day (numbered 1, 2, 3...) to the corresponding selected date
      // Day 1 -> first selected date, Day 2 -> second selected date, etc.
      const mappedDays = finalResponse.days.map((day: any, index: number) => {
        if (index < selectedDays.length) {
          // Map day number to the actual selected date
          const actualDate = selectedDays[index]
          // Update the day number to match the actual date's position in the trip
          const actualDayNumber = Math.floor(
            (new Date(actualDate).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          ) + 1
          
          console.log(`[AI Plan] Mapping AI day ${day.day} (index ${index}) to actual date ${actualDate} (day ${actualDayNumber})`)
          
          return {
            ...day,
            day: actualDayNumber, // Update to the actual day number in the trip
            _mappedDate: actualDate, // Store the actual date for reference
          }
        }
        return day
      }).filter((day: any, index: number) => index < selectedDays.length) // Only keep days that have a selected date
      
      console.log(`[AI Plan] Mapped ${mappedDays.length} days to selected dates`)
      finalResponse = { ...finalResponse, days: mappedDays }
    }

    // Enrich with Places data if needed
    // Always enrich if includeMaps is true, or if we have location data to resolve
    if (generationOptions && (generationOptions.imageMode === 'google' || generationOptions.includeMaps || true)) {
      try {
        const { enrichActivitiesWithPlaces } = await import('@/lib/enrich-activities-with-places')
        console.log('Enriching pathway with Places data...', {
          imageMode: generationOptions.imageMode,
          includeMaps: generationOptions.includeMaps,
          tripBaseLocation: trip.baseLocation,
        })
        finalResponse = await enrichActivitiesWithPlaces(finalResponse, {
          imageMode: generationOptions.imageMode || 'off',
          includeMaps: generationOptions.includeMaps || false,
          tripBaseLocation: trip.baseLocation,
        })
        console.log('Places enrichment completed')
      } catch (error) {
        console.error('Error enriching with Places data:', error)
        console.error('Error details:', error instanceof Error ? error.stack : String(error))
        // Continue without enrichment if it fails - don't break the whole request
        // The pathway will still be generated, just without Places data
      }
    }

    return NextResponse.json(finalResponse)
  } catch (error) {
    console.error('AI plan generation error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown',
    })
    return NextResponse.json(
      { 
        error: 'Failed to generate learning pathway', 
        details: error instanceof Error ? error.message : String(error),
        hint: 'Check server logs for more details. Common issues: Google Cloud authentication, API quota, or network connectivity.'
      },
      { status: 500 }
    )
  }
}

function buildPlanPrompt(
  learnerProfile: any,
  trip: Trip,
  learningTarget: LearningTarget,
  existingItinerary: ItineraryItem[],
  numDays: number,
  generationOptions?: any
): string {
  return `You are a PBL (Project-Based Learning) expert designing a ${numDays}-day experiential learning pathway.

LEARNER PROFILE:
- Name: ${learnerProfile.name}
- Timezone: ${learnerProfile.timezone}
- Interests: ${learnerProfile.pblProfile.interests.join(', ')}
- Level: ${learnerProfile.pblProfile.currentLevel}
- Goals: ${learnerProfile.pblProfile.learningGoals.join(', ')}
- Preferred learning times: ${learnerProfile.preferences.preferredLearningTimes.join(', ')}
- Preferred duration: ${learnerProfile.preferences.preferredDuration}
- Interaction style: ${learnerProfile.preferences.interactionStyle}
- Preferred field experiences: ${learnerProfile.experientialProfile.preferredFieldExperiences.join(', ')}
- Reflection style: ${learnerProfile.experientialProfile.reflectionStyle}
- Inquiry approach: ${learnerProfile.experientialProfile.inquiryApproach}
${learnerProfile.constraints.maxDailyMinutes ? `- Max daily minutes: ${learnerProfile.constraints.maxDailyMinutes}` : ''}

TRIP CONTEXT:
- Title: ${trip.title}
- Location: ${trip.baseLocation}
- Dates: ${trip.startDate} to ${trip.endDate}
- Learning target: ${learningTarget.track}${learningTarget.weeklyHours ? ` (${learningTarget.weeklyHours} hrs/week)` : ''}

${existingItinerary.length > 0 ? `EXISTING ITINERARY (${existingItinerary.length} items):\n${existingItinerary.map(i => `- ${i.title} at ${i.location} on ${i.dateTime}`).join('\n')}` : ''}

TASK:
Generate a ${numDays}-day PBL learning pathway aligned to Gold Standard PBL elements. Each day must include:
1. drivingQuestion: A compelling question that drives inquiry
2. fieldExperience: A real-world experience aligned to the location
3. inquiryTask: A specific task for investigation/exploration
4. artifact: What the learner will create/produce
5. reflectionPrompt: A prompt for reflection aligned to their reflection style
6. critiqueStep: How they will get feedback/improve
7. scheduleBlocks: Array of learning blocks with startTime (ISO datetime in ${learnerProfile.timezone}), duration (minutes), title, and optional description

REQUIREMENTS:
- All ${numDays} days must be filled (days 1-${numDays})
- Schedule block dates must fall within the trip dates: ${trip.startDate} to ${trip.endDate}
- Schedule blocks must respect preferred learning times and constraints
- Total daily learning time should align with learning target (${learningTarget.track})
- Field experiences should leverage the location: ${trip.baseLocation}
- Artifacts should match preferred types: ${learnerProfile.pblProfile.preferredArtifactTypes.join(', ')}
- Inquiry approach should be ${learnerProfile.experientialProfile.inquiryApproach}
- Include a "verifyLocally" note with important validation points

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
  "summary": "Brief overview of the pathway",
  "verifyLocally": "Notes for human verification"
}

Generate the complete ${numDays}-day pathway now.`
}

