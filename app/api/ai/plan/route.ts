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
    const vertex = new VertexAI({
      project: process.env.GOOGLE_CLOUD_PROJECT || 'worldschool-mvp',
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
    })

    const model = vertex.getGenerativeModel({
      model: 'gemini-2.0-flash',
    })

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

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    })

    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

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

    // Filter days if generation options specify selected days
    let finalResponse = validationResult.data
    if (generationOptions?.selectedDays && generationOptions.selectedDays.length > 0) {
      const startDate = new Date(trip.startDate)
      const filteredDays = finalResponse.days.filter((day: any) => {
        const dayDate = new Date(startDate)
        dayDate.setDate(startDate.getDate() + (day.day - 1))
        const dayDateString = dayDate.toISOString().split('T')[0]
        return generationOptions.selectedDays.includes(dayDateString)
      })
      finalResponse = { ...finalResponse, days: filteredDays }
    }

    return NextResponse.json(finalResponse)
  } catch (error) {
    console.error('AI plan generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate learning pathway', details: error instanceof Error ? error.message : String(error) },
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

