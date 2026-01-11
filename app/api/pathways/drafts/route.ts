import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { VertexAI } from '@google-cloud/vertexai'
import { getLearnerProfile } from '@/lib/learner-profiles'
import type { Trip, LearningTarget } from '@/types'
import type { PathwayDraft, PathwayDraftsResponse, PathwayDraftType } from '@/types'

export async function POST(request: Request) {
  try {
    console.log('[Pathway Drafts API] Request received')
    
    // Parse body first to check for demo user
    let body: any
    try {
      body = await request.json()
      console.log('[Pathway Drafts API] Request body keys:', Object.keys(body))
    } catch (parseError) {
      console.error('[Pathway Drafts API] Failed to parse request body:', parseError)
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: parseError instanceof Error ? parseError.message : 'Request body is not valid JSON',
        },
        { status: 400 }
      )
    }
    
    const { tripId, learnerId, selectedDates, effortMode } = body
    
    // Verify user is authenticated (Clerk) OR using demo user
    // Allow demo users for local development
    const { userId } = await auth().catch(() => ({ userId: null }))
    console.log('[Pathway Drafts API] Auth check:', { hasUserId: !!userId, learnerId })
    
    // Allow if authenticated OR if using demo user (learnerId is a demo user ID)
    const isDemoUser = learnerId && ['alice', 'bob', 'sam'].includes(learnerId)
    if (!userId && !isDemoUser) {
      console.error('[Pathway Drafts API] Unauthorized - no userId and not a demo user')
      return NextResponse.json(
        { error: 'Unauthorized', details: 'Please sign in to generate pathway drafts' },
        { status: 401 }
      )
    }

    // Validate required fields
    if (!tripId || !learnerId || !selectedDates || !Array.isArray(selectedDates) || selectedDates.length === 0 || !effortMode) {
      console.error('[Pathway Drafts API] Missing required fields:', { 
        tripId: !!tripId, 
        learnerId: !!learnerId, 
        selectedDates: selectedDates?.length, 
        effortMode: !!effortMode 
      })
      return NextResponse.json(
        { error: 'Missing required fields: tripId, learnerId, selectedDates (non-empty array), effortMode' },
        { status: 400 }
      )
    }

    // Get trip data (in a real app, this would come from a database)
    // For now, we'll need to pass trip data in the request or fetch from storage
    const { trip, learnerProfile } = body
    if (!trip || !learnerProfile) {
      console.error('[Pathway Drafts API] Missing trip or learnerProfile:', { 
        hasTrip: !!trip, 
        hasLearnerProfile: !!learnerProfile 
      })
      return NextResponse.json(
        { error: 'Missing trip or learnerProfile in request body' },
        { status: 400 }
      )
    }

    console.log('[Pathway Drafts API] Starting draft generation...')

    // Initialize Vertex AI
    const project = process.env.GOOGLE_CLOUD_PROJECT || 'worldschool-mvp'
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
    
    console.log('[Pathway Drafts API] Initializing Vertex AI:', { project, location })
    
    let vertex: VertexAI
    try {
      vertex = new VertexAI({
        project,
        location,
      })
    } catch (initError) {
      console.error('[Pathway Drafts API] Failed to initialize Vertex AI:', initError)
      return NextResponse.json(
        {
          error: 'Failed to initialize AI service',
          details: initError instanceof Error ? initError.message : String(initError),
        },
        { status: 500 }
      )
    }

    let model
    try {
      model = vertex.getGenerativeModel({
        model: 'gemini-2.0-flash',
      })
    } catch (modelError) {
      console.error('[Pathway Drafts API] Failed to get generative model:', modelError)
      return NextResponse.json(
        {
          error: 'Failed to load AI model',
          details: modelError instanceof Error ? modelError.message : String(modelError),
        },
        { status: 500 }
      )
    }

    const numDays = selectedDates.length

    // Build prompt for generating 3 pathway draft options
    let prompt: string
    try {
      prompt = buildDraftsPrompt(learnerProfile, trip, effortMode, selectedDates, numDays)
      console.log('[Pathway Drafts API] Prompt built successfully, length:', prompt.length)
    } catch (promptError) {
      console.error('[Pathway Drafts API] Failed to build prompt:', promptError)
      return NextResponse.json(
        {
          error: 'Failed to build generation prompt',
          details: promptError instanceof Error ? promptError.message : String(promptError),
        },
        { status: 500 }
      )
    }

    if (!prompt || prompt.trim().length === 0) {
      console.error('[Pathway Drafts API] Empty prompt generated')
      return NextResponse.json(
        {
          error: 'Failed to generate prompt',
          details: 'The prompt builder returned an empty string',
        },
        { status: 500 }
      )
    }

    console.log('[Pathway Drafts API] Generating drafts, prompt length:', prompt.length)

    let result
    try {
      result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
      })
      console.log('[Pathway Drafts API] AI generation completed')
    } catch (genError) {
      console.error('[Pathway Drafts API] Failed to generate content:', genError)
      console.error('[Pathway Drafts API] Generation error details:', {
        message: genError instanceof Error ? genError.message : String(genError),
        name: genError instanceof Error ? genError.name : 'Unknown',
        stack: genError instanceof Error ? genError.stack : undefined,
      })
      return NextResponse.json(
        {
          error: 'Failed to generate pathway drafts from AI',
          details: genError instanceof Error ? genError.message : String(genError),
        },
        { status: 500 }
      )
    }

    const responseText = result.response.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    console.log('[Pathway Drafts API] AI response received, length:', responseText.length)
    
    if (!responseText || responseText.trim().length === 0) {
      console.error('[Pathway Drafts API] Empty response from AI')
      return NextResponse.json(
        {
          error: 'AI returned empty response',
          details: 'The AI model did not generate any content. Please try again.',
        },
        { status: 500 }
      )
    }
    
    // Parse JSON response
    let parsedResponse
    try {
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || responseText.match(/```\s*([\s\S]*?)\s*```/)
      const jsonText = jsonMatch ? jsonMatch[1] : responseText
      parsedResponse = JSON.parse(jsonText.trim())
      console.log('[Pathway Drafts API] Successfully parsed AI response')
    } catch (parseError) {
      console.error('[Pathway Drafts API] Failed to parse drafts response:', parseError)
      console.error('[Pathway Drafts API] Response text preview:', responseText.substring(0, 500))
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

    console.log('[Pathway Drafts API] Successfully generated', finalDrafts.length, 'drafts')
    return NextResponse.json(response)
  } catch (error) {
    console.error('[Pathway Drafts API] Unexpected error:', error)
    console.error('[Pathway Drafts API] Error type:', typeof error)
    console.error('[Pathway Drafts API] Error constructor:', error?.constructor?.name)
    
    // Safely extract error information
    let errorMessage = 'Unknown error'
    let errorStack: string | undefined
    let errorName: string | undefined
    
    if (error instanceof Error) {
      errorMessage = error.message || 'Unknown error'
      errorStack = error.stack
      errorName = error.name
    } else if (typeof error === 'string') {
      errorMessage = error
    } else if (error && typeof error === 'object') {
      errorMessage = (error as any).message || JSON.stringify(error)
    }
    
    console.error('[Pathway Drafts API] Error details:', {
      message: errorMessage,
      name: errorName,
      hasStack: !!errorStack,
    })
    
    return NextResponse.json(
      {
        error: 'Failed to generate pathway drafts',
        details: errorMessage,
        ...(errorName && { errorType: errorName }),
        ...(errorStack && { stack: errorStack }),
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
