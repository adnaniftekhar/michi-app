'use client'

import { useState } from 'react'
import type { Trip, ScheduleBlock, ItineraryItem } from '@/types'
import { generateScheduleBlocks } from '@/lib/schedule-generator'
import { Section } from '../ui/Section'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Input } from '../ui/Input'
import { EmptyState } from '../ui/EmptyState'
import { showToast } from '../ui/Toast'
import { AIPathwayModal } from './AIPathwayModal'
import { EditScheduleBlockModal } from './EditScheduleBlockModal'
import type { AIPlanResponse } from '@/lib/ai-plan-schema'
import { useDemoUser } from '@/contexts/DemoUserContext'
import { getLearnerProfile } from '@/lib/learner-profiles'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface ScheduleTabProps {
  trip: Trip
  scheduleBlocks: ScheduleBlock[]
  onUpdate: (blocks: ScheduleBlock[]) => void
  onTripUpdate: (trip: Trip) => void
  timezone: string
  onItineraryUpdate?: (items: ItineraryItem[]) => void
  existingItinerary?: ItineraryItem[]
}

export function ScheduleTab({
  trip,
  scheduleBlocks,
  onUpdate,
  onTripUpdate,
  timezone,
  onItineraryUpdate,
  existingItinerary = [],
}: ScheduleTabProps) {
  const { currentUserId } = useDemoUser()
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiDraft, setAiDraft] = useState<AIPlanResponse | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null)

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
    }) + ` (${timezone})`
  }

  const handleGenerateSchedule = () => {
    if (!trip.learningTarget) {
      showToast('Please set a learning target first', 'error')
      return
    }

    try {
      const generated = generateScheduleBlocks(
        trip,
        scheduleBlocks,
        timezone
      )
      onUpdate(generated)
      showToast('Schedule generated successfully', 'success')
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to generate schedule',
        'error'
      )
    }
  }

  const handleGenerateAIPathway = async () => {
    if (!trip.learningTarget) {
      showToast('Please set a learning target first', 'error')
      return
    }

    setIsGenerating(true)
    setShowAIModal(true)
    setAiDraft(null)

    try {
      // Get the current learner profile (includes any custom overrides)
      const learnerProfile = getLearnerProfile(currentUserId)
      
      const response = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerProfileId: currentUserId,
          learnerProfile, // Pass the full profile so server doesn't need localStorage
          trip,
          learningTarget: trip.learningTarget,
          existingItinerary: [], // Could pass actual itinerary if needed
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate pathway')
      }

      const data = await response.json()
      setAiDraft(data)
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to generate AI pathway',
        'error'
      )
      setShowAIModal(false)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApplyAIPathway = (draft: AIPlanResponse) => {
    // Convert AI plan to schedule blocks
    const newBlocks: ScheduleBlock[] = []
    const newItineraryItems: ItineraryItem[] = []
    const now = new Date().toISOString()
    let blockIndex = 0

    // Calculate start date
    const startDate = new Date(trip.startDate)

    for (const day of draft.days) {
      // Calculate the date for this day
      const dayDate = new Date(startDate)
      dayDate.setDate(startDate.getDate() + (day.day - 1))
      const dateStr = dayDate.toISOString().split('T')[0]

      // Create itinerary item from field experience (at 2 PM local time)
      if (day.fieldExperience && onItineraryUpdate) {
        const itineraryDateTime = new Date(dayDate)
        itineraryDateTime.setHours(14, 0, 0, 0) // 2 PM
        // Convert to ISO string in the timezone
        const itineraryTimeStr = itineraryDateTime.toISOString()

        newItineraryItems.push({
          id: `itinerary-ai-${trip.id}-day${day.day}-${Date.now()}`,
          dateTime: itineraryTimeStr,
          title: day.fieldExperience,
          location: trip.baseLocation,
          notes: `${day.inquiryTask}\n\nArtifact: ${day.artifact}`,
          createdAt: now,
        })
      }

      // Create schedule blocks
      for (const block of day.scheduleBlocks) {
        const blockDate = new Date(block.startTime)
        newBlocks.push({
          id: `ai-${trip.id}-day${day.day}-${blockIndex}-${Date.now()}`,
          date: blockDate.toISOString().split('T')[0],
          startTime: block.startTime,
          duration: block.duration,
          title: block.title,
          description: block.description,
          isGenerated: true, // AI-generated blocks
          createdAt: now,
          // Store PBL data from the day
          drivingQuestion: day.drivingQuestion,
          fieldExperience: day.fieldExperience,
          inquiryTask: day.inquiryTask,
          artifact: day.artifact,
          reflectionPrompt: day.reflectionPrompt,
          critiqueStep: day.critiqueStep,
        })
        blockIndex++
      }
    }

    // Replace only previously generated blocks, keep manual ones
    const manualBlocks = scheduleBlocks.filter(b => !b.isGenerated)
    const updated = [...manualBlocks, ...newBlocks]
    onUpdate(updated)

    // Add new itinerary items to existing ones
    if (onItineraryUpdate && newItineraryItems.length > 0) {
      const updatedItinerary = [...existingItinerary, ...newItineraryItems].sort(
        (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
      )
      onItineraryUpdate(updatedItinerary)
    }

    setShowAIModal(false)
    showToast('AI pathway applied to schedule and itinerary', 'success')
  }

  const handleEditBlock = (block: ScheduleBlock) => {
    setEditingBlock(block)
  }

  const handleSaveBlock = (blockId: string, formData: FormData) => {
    const title = formData.get('title') as string
    const startTime = formData.get('startTime') as string
    const duration = Number(formData.get('duration'))
    const description = formData.get('description') as string
    const drivingQuestion = formData.get('drivingQuestion') as string
    const fieldExperience = formData.get('fieldExperience') as string
    const inquiryTask = formData.get('inquiryTask') as string
    const artifact = formData.get('artifact') as string
    const reflectionPrompt = formData.get('reflectionPrompt') as string
    const critiqueStep = formData.get('critiqueStep') as string

    const updated = scheduleBlocks.map(b =>
      b.id === blockId
        ? {
            ...b,
            title,
            startTime: new Date(startTime).toISOString(),
            duration,
            description: description || undefined,
            drivingQuestion: drivingQuestion || undefined,
            fieldExperience: fieldExperience || undefined,
            inquiryTask: inquiryTask || undefined,
            artifact: artifact || undefined,
            reflectionPrompt: reflectionPrompt || undefined,
            critiqueStep: critiqueStep || undefined,
          }
        : b
    )
    onUpdate(updated)
    setEditingBlock(null)
    showToast('Schedule block updated', 'success')
  }

  const handleDeleteBlock = (blockId: string) => {
    if (confirm('Are you sure you want to delete this schedule block?')) {
      const updated = scheduleBlocks.filter(b => b.id !== blockId)
      onUpdate(updated)
      showToast('Schedule block deleted', 'success')
    }
  }

  const generatedBlocks = scheduleBlocks.filter((b) => b.isGenerated)
  const manualBlocks = scheduleBlocks.filter((b) => !b.isGenerated)

  return (
    <>
      <Section
        title="Schedule Blocks"
        description={`Learning blocks for your trip (${timezone})`}
        action={
          trip.learningTarget ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleGenerateSchedule}>
                Generate Schedule
              </Button>
              <Button onClick={handleGenerateAIPathway} disabled={isGenerating}>
                {isGenerating ? (
                  <span className="flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Generating...</span>
                  </span>
                ) : (
                  'Generate (AI Draft)'
                )}
              </Button>
            </div>
          ) : (
            <Button variant="secondary" disabled>
              Set learning target first
            </Button>
          )
        }
      emptyState={{
        message: trip.learningTarget
          ? 'No schedule blocks yet. Generate a schedule to create learning blocks.'
          : 'Set a learning target first, then generate your schedule.',
      }}
      isEmpty={scheduleBlocks.length === 0}
    >
      {scheduleBlocks.length > 0 && (
        <div className="space-y-3">
          {scheduleBlocks.map((block) => (
            <Card key={block.id}>
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="font-semibold"
                          style={{
                            fontSize: 'var(--font-size-base)',
                            lineHeight: 'var(--line-height-tight)',
                          }}
                        >
                          {block.title}
                        </span>
                        {block.isGenerated && (
                          <Badge variant="draft">Draft</Badge>
                        )}
                      </div>
                      <div
                        className="text-sm mb-2"
                        style={{
                          color: 'var(--color-text-secondary)',
                          lineHeight: 'var(--line-height-normal)',
                        }}
                      >
                        {formatDateTime(block.startTime)} • {block.duration} min
                      </div>
                      {block.description && (
                        <p
                          className="text-sm mb-2"
                          style={{
                            color: 'var(--color-text-secondary)',
                            lineHeight: 'var(--line-height-normal)',
                          }}
                        >
                          {block.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditBlock(block)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteBlock(block.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  {(block.drivingQuestion || block.fieldExperience || block.inquiryTask || block.artifact || block.reflectionPrompt || block.critiqueStep) && (
                    <div
                      className="mt-3 pt-3 border-t space-y-2"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      {block.drivingQuestion && (
                        <div>
                          <div
                            className="text-xs font-semibold mb-1"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            Driving Question
                          </div>
                          <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            {block.drivingQuestion}
                          </p>
                        </div>
                      )}
                      {block.fieldExperience && (
                        <div>
                          <div
                            className="text-xs font-semibold mb-1"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            Field Experience
                          </div>
                          <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            {block.fieldExperience}
                          </p>
                        </div>
                      )}
                      {block.inquiryTask && (
                        <div>
                          <div
                            className="text-xs font-semibold mb-1"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            Inquiry Task
                          </div>
                          <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            {block.inquiryTask}
                          </p>
                        </div>
                      )}
                      {block.artifact && (
                        <div>
                          <div
                            className="text-xs font-semibold mb-1"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            Artifact
                          </div>
                          <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            {block.artifact}
                          </p>
                        </div>
                      )}
                      {block.reflectionPrompt && (
                        <div>
                          <div
                            className="text-xs font-semibold mb-1"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            Reflection Prompt
                          </div>
                          <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            {block.reflectionPrompt}
                          </p>
                        </div>
                      )}
                      {block.critiqueStep && (
                        <div>
                          <div
                            className="text-xs font-semibold mb-1"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            Critique Step
                          </div>
                          <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                            {block.critiqueStep}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Section>

    <AIPathwayModal
      isOpen={showAIModal}
      onClose={() => setShowAIModal(false)}
      draft={aiDraft}
      onApply={handleApplyAIPathway}
      isLoading={isGenerating}
      trip={trip}
    />
    <EditScheduleBlockModal
      isOpen={editingBlock !== null}
      onClose={() => setEditingBlock(null)}
      block={editingBlock}
      onSave={handleSaveBlock}
    />
    </>
  )
}

