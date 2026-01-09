import { NextResponse } from 'next/server'
import { VertexAI } from '@google-cloud/vertexai'
import { getLearnerProfile } from '@/lib/learner-profiles'
import type { Trip, LearningTarget } from '@/types'
import type { PathwayDraft, PathwayDraftsResponse, PathwayDraftType } from '@/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tripId, learnerId, selectedDates, effortMode } = body

    // Validate required fields
    if (!tripId || !learnerId || !selectedDates || !Array.isArray(selectedDates) || selectedDates.length === 0 || !effortMode) {
      return NextResponse.json(
        { error: 'Missing required fields: tripId, learnerId, selectedDates (non-empty array), effortMode' },
        { status: 400 }
      )
    }

    // Get trip data (in a real app, this would come from a database)
    // For now, we'll need to pass trip data in the request or fetch from storage
    const { trip, learnerProfile } = body
    if (!trip || !learnerProfile) {
      return NextResponse.json(
        { error: 'Missing trip or learnerProfile in request body' },
        { status: 400 }
      )
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

    // Build prompt for generating 3 pathway draft options
    const prompt = buildDraftsPrompt(learnerProfile, trip, effortMode, selectedDates, numDays)

    console.log('Generating pathway drafts, prompt length:', prompt.length)

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
      console.error('Failed to parse drafts response:', parseError)
      return NextResponse.json(
        { error: 'Invalid JSON response from AI', details: String(parseError) },
        { status: 500 }
      )
    }

    // Validate that we have exactly 3 drafts
    if (!parsedResponse.drafts || !Array.isArray(parsedResponse.drafts) || parsedResponse.drafts.length !== 3) {
      console.error('Invalid drafts response structure:', parsedResponse)
      return NextResponse.json(
        { error: 'AI did not return exactly 3 pathway drafts' },
        { status: 500 }
      )
    }

    // Ensure each draft has required fields and assign IDs
    const drafts: PathwayDraft[] = parsedResponse.drafts.map((draft: any, index: number) => {
      const types: PathwayDraftType[] = ['continuous', 'themes', 'hybrid']
      return {
        id: `draft-${Date.now()}-${index}`,
        type: types[index] || draft.type || 'continuous',
        title: draft.title || `${types[index] || 'Pathway'} Approach`,
        overview: draft.overview || 'A learning pathway tailored to your trip.',
        whyItFits: draft.whyItFits || 'This pathway aligns with your learner profile.',
        days: draft.days || selectedDates.map((date: string, dayIndex: number) => ({
          day: dayIndex + 1,
          date,
          headline: `Day ${dayIndex + 1} activities`,
        })),
      }
    })

    // Ensure we have exactly 3 drafts with correct types
    const finalDrafts: [PathwayDraft, PathwayDraft, PathwayDraft] = [
      drafts.find((d) => d.type === 'continuous') || drafts[0],
      drafts.find((d) => d.type === 'themes') || drafts[1] || drafts[0],
      drafts.find((d) => d.type === 'hybrid') || drafts[2] || drafts[0],
    ]

    const response: PathwayDraftsResponse = {
      drafts: finalDrafts,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error generating pathway drafts:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate pathway drafts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

function buildDraftsPrompt(
  learnerProfile: any,
  trip: Trip,
  effortMode: LearningTarget['track'],
  selectedDates: string[],
  numDays: number
): string {
  const datesSummary = selectedDates
    .map((date, idx) => `Day ${idx + 1}: ${new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`)
    .join(', ')

  return `You are an expert learning pathway designer creating 3 different pathway approaches for a ${numDays}-day trip.

LEARNER PROFILE:
- Name: ${learnerProfile.name}
- Level: ${learnerProfile.pblProfile.currentLevel}
- Interests: ${learnerProfile.pblProfile.interests.join(', ')}
- Goals: ${learnerProfile.pblProfile.learningGoals.join(', ')}
- Preferred artifact types: ${learnerProfile.pblProfile.preferredArtifactTypes.join(', ')}
- Reflection style: ${learnerProfile.experientialProfile.reflectionStyle}
- Inquiry approach: ${learnerProfile.experientialProfile.inquiryApproach}

TRIP CONTEXT:
- Title: ${trip.title}
- Location: ${trip.baseLocation}
- Selected Dates: ${datesSummary}
- Effort Mode: ${effortMode}

TASK:
Generate exactly 3 pathway draft options. Each must be lightweight (headlines only, not full details).

1. CONTINUOUS: A linear, day-by-day progression where each day builds on the previous. Focus on cumulative learning and skill development.

2. THEMES: Organize days around distinct themes or topics. Each day explores a different theme while maintaining overall coherence.

3. HYBRID: Combine continuous progression with thematic exploration. Some days build sequentially, others explore themes.

For each draft, provide:
- title: A clear, descriptive title (e.g., "Continuous Learning Journey", "Thematic Exploration", "Hybrid Adventure")
- overview: 2-3 sentences describing the approach
- whyItFits: 1-2 sentences explaining why this pathway fits the learner's profile
- days: Array of ${numDays} objects, each with:
  - day: Day number (1-${numDays})
  - date: The corresponding date from selectedDates
  - headline: A brief, engaging headline for that day (max 60 characters)

OUTPUT FORMAT:
Return ONLY valid JSON:
{
  "drafts": [
    {
      "type": "continuous",
      "title": "...",
      "overview": "...",
      "whyItFits": "...",
      "days": [
        { "day": 1, "date": "${selectedDates[0]}", "headline": "..." },
        ...
      ]
    },
    {
      "type": "themes",
      "title": "...",
      "overview": "...",
      "whyItFits": "...",
      "days": [...]
    },
    {
      "type": "hybrid",
      "title": "...",
      "overview": "...",
      "whyItFits": "...",
      "days": [...]
    }
  ]
}

Generate the 3 pathway drafts now. Keep them lightweight and focused on approach, not detailed activities.`
}
