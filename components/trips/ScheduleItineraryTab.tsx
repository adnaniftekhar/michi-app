'use client'

import { useState } from 'react'
import type { Trip, ScheduleBlock } from '@/types'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import { Section } from '../ui/Section'
import { showToast } from '../ui/Toast'
import { AIPathwayModal } from './AIPathwayModal'
import { EditScheduleBlockModal } from './EditScheduleBlockModal'
import type { AIPlanResponse } from '@/lib/ai-plan-schema'
import { useDemoUser } from '@/contexts/DemoUserContext'
import { getLearnerProfile } from '@/lib/learner-profiles'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface ScheduleItineraryTabProps {
  trip: Trip
  scheduleBlocks: ScheduleBlock[]
  onScheduleUpdate: (blocks: ScheduleBlock[]) => void
  onTripUpdate: (trip: Trip) => void
  timezone: string
}

export function ScheduleItineraryTab({
  trip,
  scheduleBlocks,
  onScheduleUpdate,
  onTripUpdate,
  timezone,
}: ScheduleItineraryTabProps) {
  const { currentUserId } = useDemoUser()
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiDraft, setAiDraft] = useState<AIPlanResponse | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null)

  // Only schedule blocks, sorted by date/time
  const sortedBlocks = [...scheduleBlocks].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

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

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
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
      const learnerProfile = getLearnerProfile(currentUserId)
      
      const response = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerProfileId: currentUserId,
          learnerProfile,
          trip,
          learningTarget: trip.learningTarget,
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
    const newBlocks: ScheduleBlock[] = []
    const now = new Date().toISOString()
    let blockIndex = 0

    const startDate = new Date(trip.startDate)

    for (const day of draft.days) {
      for (const block of day.scheduleBlocks) {
        const blockDate = new Date(block.startTime)
        newBlocks.push({
          id: `ai-${trip.id}-day${day.day}-${blockIndex}-${Date.now()}`,
          date: blockDate.toISOString().split('T')[0],
          startTime: block.startTime,
          duration: block.duration,
          title: block.title,
          description: block.description,
          // Incorporate field experience into schedule block
          location: day.fieldExperience ? trip.baseLocation : undefined,
          notes: day.fieldExperience ? `${day.fieldExperience}\n\n${day.inquiryTask}\n\nArtifact: ${day.artifact}` : undefined,
          isGenerated: true,
          createdAt: now,
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
    onScheduleUpdate(updated)

    setShowAIModal(false)
    showToast('AI pathway applied to schedule', 'success')
  }

  const handleEditBlock = (block: ScheduleBlock) => {
    setEditingBlock(block)
  }

  const handleSaveBlock = (blockId: string, formData: FormData) => {
    const title = formData.get('title') as string
    const startTimeInput = formData.get('startTime') as string
    const duration = Number(formData.get('duration'))
    const description = (formData.get('description') as string) || undefined
    const location = (formData.get('location') as string) || undefined
    const notes = (formData.get('notes') as string) || undefined
    const drivingQuestion = (formData.get('drivingQuestion') as string) || undefined
    const fieldExperience = (formData.get('fieldExperience') as string) || undefined
    const inquiryTask = (formData.get('inquiryTask') as string) || undefined
    const artifact = (formData.get('artifact') as string) || undefined
    const reflectionPrompt = (formData.get('reflectionPrompt') as string) || undefined
    const critiqueStep = (formData.get('critiqueStep') as string) || undefined

    // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO string
    // datetime-local returns local time without timezone, so we need to parse it correctly
    const startTimeDate = new Date(startTimeInput)
    const startTimeISO = startTimeDate.toISOString()
    const dateStr = startTimeDate.toISOString().split('T')[0]

    const updated = scheduleBlocks.map(b =>
      b.id === blockId
        ? {
            ...b,
            title,
            date: dateStr,
            startTime: startTimeISO,
            duration,
            description: description?.trim() || undefined,
            location: location?.trim() || undefined,
            notes: notes?.trim() || undefined,
            drivingQuestion: drivingQuestion?.trim() || undefined,
            fieldExperience: fieldExperience?.trim() || undefined,
            inquiryTask: inquiryTask?.trim() || undefined,
            artifact: artifact?.trim() || undefined,
            reflectionPrompt: reflectionPrompt?.trim() || undefined,
            critiqueStep: critiqueStep?.trim() || undefined,
          }
        : b
    )
    onScheduleUpdate(updated)
    setEditingBlock(null)
    showToast('Schedule block updated', 'success')
  }

  const handleDeleteBlock = (blockId: string) => {
    if (confirm('Are you sure you want to delete this schedule block?')) {
      const updated = scheduleBlocks.filter(b => b.id !== blockId)
      onScheduleUpdate(updated)
      showToast('Schedule block deleted', 'success')
    }
  }

  return (
    <>
      <Section
        title="Schedule"
        description={`Your learning schedule (${timezone})`}
        action={
          trip.learningTarget ? (
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
          ) : (
            <Button variant="secondary" disabled>
              Set learning target first
            </Button>
          )
        }
        emptyState={{
          message: trip.learningTarget
            ? 'No schedule items yet. Generate an AI pathway to create learning blocks.'
            : 'Set a learning target first, then generate your schedule.',
        }}
        isEmpty={sortedBlocks.length === 0}
      >
        {sortedBlocks.length > 0 && (
          <div className="space-y-4">
            {sortedBlocks.map((block) => {
              const isExpanded = expandedCardId === block.id

              return (
                <Card
                  key={block.id}
                  onClick={() => setExpandedCardId(isExpanded ? null : block.id)}
                  className="cursor-pointer transition-all"
                  style={{
                    backgroundColor: isExpanded ? '#ffffff' : 'var(--color-surface)',
                    color: isExpanded ? '#111827' : 'var(--color-text-primary)',
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="draft">Schedule</Badge>
                        {block.isGenerated && (
                          <Badge variant="draft">AI Generated</Badge>
                        )}
                      </div>
                      <h3
                        className="font-semibold mb-2"
                        style={{
                          fontSize: '18px',
                          lineHeight: '1.4',
                          color: isExpanded ? '#111827' : 'var(--color-text-primary)',
                        }}
                      >
                        {block.title}
                      </h3>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className="text-sm"
                          style={{
                            color: isExpanded ? '#6b7280' : 'var(--color-text-secondary)',
                          }}
                        >
                          {formatDate(block.startTime)}
                        </span>
                        <span
                          className="text-sm"
                          style={{
                            color: isExpanded ? '#6b7280' : 'var(--color-text-secondary)',
                          }}
                        >
                          {formatDateTime(block.startTime).split('•')[1]?.trim()}
                        </span>
                        <span
                          className="text-sm font-medium"
                          style={{
                            color: isExpanded ? '#6b7280' : 'var(--color-text-secondary)',
                          }}
                        >
                          {block.duration} min
                        </span>
                        {block.location && (
                          <span
                            className="text-sm"
                            style={{
                              color: isExpanded ? '#6b7280' : 'var(--color-text-secondary)',
                            }}
                          >
                            📍 {block.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isExpanded && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditBlock(block)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteBlock(block.id)
                            }}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedCardId(isExpanded ? null : block.id)
                        }}
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-opacity-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
                        style={{
                          color: isExpanded ? '#6b7280' : 'var(--color-text-secondary)',
                          outlineColor: 'var(--color-focus-ring)',
                        }}
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? '−' : '+'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-6 pt-6" style={{ borderTop: isExpanded ? '1px solid #e5e7eb' : '1px solid var(--color-border)' }}>
                      <div className="space-y-6">
                        {/* Two-column layout for desktop */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left Column: PBL Elements */}
                          <div className="space-y-5">
                            {block.drivingQuestion && (
                              <div
                                className="p-4 rounded-xl"
                                style={{
                                  backgroundColor: isExpanded ? '#f9fafb' : 'rgba(255, 255, 255, 0.05)',
                                }}
                              >
                                <div
                                  className="text-xs uppercase tracking-wide font-semibold mb-2"
                                  style={{
                                    color: isExpanded ? '#6b7280' : 'var(--color-text-secondary)',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  Driving Question
                                </div>
                                <p
                                  className="text-[15px] leading-7 max-w-[72ch]"
                                  style={{
                                    color: isExpanded ? '#111827' : 'var(--color-text-primary)',
                                  }}
                                >
                                  {block.drivingQuestion}
                                </p>
                              </div>
                            )}
                            {block.inquiryTask && (
                              <div
                                className="p-4 rounded-xl"
                                style={{
                                  backgroundColor: isExpanded ? '#f9fafb' : 'rgba(255, 255, 255, 0.05)',
                                }}
                              >
                                <div
                                  className="text-xs uppercase tracking-wide font-semibold mb-2"
                                  style={{
                                    color: isExpanded ? '#6b7280' : 'var(--color-text-secondary)',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  Inquiry Task
                                </div>
                                <p
                                  className="text-[15px] leading-7 max-w-[72ch]"
                                  style={{
                                    color: isExpanded ? '#111827' : 'var(--color-text-primary)',
                                  }}
                                >
                                  {block.inquiryTask}
                                </p>
                              </div>
                            )}
                            {block.reflectionPrompt && (
                              <div
                                className="p-4 rounded-xl"
                                style={{
                                  backgroundColor: isExpanded ? '#f9fafb' : 'rgba(255, 255, 255, 0.05)',
                                }}
                              >
                                <div
                                  className="text-xs uppercase tracking-wide font-semibold mb-2"
                                  style={{
                                    color: isExpanded ? '#6b7280' : 'var(--color-text-secondary)',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  Reflection Prompt
                                </div>
                                <p
                                  className="text-[15px] leading-7 max-w-[72ch]"
                                  style={{
                                    color: isExpanded ? '#111827' : 'var(--color-text-primary)',
                                  }}
                                >
                                  {block.reflectionPrompt}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Right Column: Logistics & Field Experience */}
                          <div className="space-y-5">
                            {block.description && (
                              <div
                                className="p-4 rounded-xl"
                                style={{
                                  backgroundColor: isExpanded ? '#f9fafb' : 'rgba(255, 255, 255, 0.05)',
                                }}
                              >
                                <div
                                  className="text-xs uppercase tracking-wide font-semibold mb-2"
                                  style={{
                                    color: isExpanded ? '#6b7280' : 'var(--color-text-secondary)',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  Description
                                </div>
                                <p
                                  className="text-[15px] leading-7 max-w-[72ch]"
                                  style={{
                                    color: isExpanded ? '#111827' : 'var(--color-text-primary)',
                                  }}
                                >
                                  {block.description}
                                </p>
                              </div>
                            )}
                            {block.fieldExperience && (
                              <div
                                className="p-4 rounded-xl"
                                style={{
                                  backgroundColor: isExpanded ? '#f9fafb' : 'rgba(255, 255, 255, 0.05)',
                                }}
                              >
                                <div
                                  className="text-xs uppercase tracking-wide font-semibold mb-2"
                                  style={{
                                    color: isExpanded ? '#6b7280' : 'var(--color-text-secondary)',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  Field Experience
                                </div>
                                <p
                                  className="text-[15px] leading-7 max-w-[72ch]"
                                  style={{
                                    color: isExpanded ? '#111827' : 'var(--color-text-primary)',
                                  }}
                                >
                                  {block.fieldExperience}
                                </p>
                              </div>
                            )}
                            {block.location && (
                              <div
                                className="p-4 rounded-xl"
                                style={{
                                  backgroundColor: isExpanded ? '#f9fafb' : 'rgba(255, 255, 255, 0.05)',
                                }}
                              >
                                <div
                                  className="text-xs uppercase tracking-wide font-semibold mb-2"
                                  style={{
                                    color: isExpanded ? '#6b7280' : 'var(--color-text-secondary)',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  Location
                                </div>
                                <p
                                  className="text-[15px] leading-7 max-w-[72ch]"
                                  style={{
                                    color: isExpanded ? '#111827' : 'var(--color-text-primary)',
                                  }}
                                >
                                  {block.location}
                                </p>
                              </div>
                            )}
                            {block.notes && (
                              <div
                                className="p-4 rounded-xl"
                                style={{
                                  backgroundColor: isExpanded ? '#f9fafb' : 'rgba(255, 255, 255, 0.05)',
                                }}
                              >
                                <div
                                  className="text-xs uppercase tracking-wide font-semibold mb-2"
                                  style={{
                                    color: isExpanded ? '#6b7280' : 'var(--color-text-secondary)',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  Notes
                                </div>
                                <p
                                  className="text-[15px] leading-7 max-w-[72ch] whitespace-pre-line"
                                  style={{
                                    color: isExpanded ? '#111827' : 'var(--color-text-primary)',
                                  }}
                                >
                                  {block.notes}
                                </p>
                              </div>
                            )}
                            {block.artifact && (
                              <div
                                className="p-4 rounded-xl"
                                style={{
                                  backgroundColor: isExpanded ? '#f9fafb' : 'rgba(255, 255, 255, 0.05)',
                                }}
                              >
                                <div
                                  className="text-xs uppercase tracking-wide font-semibold mb-2"
                                  style={{
                                    color: isExpanded ? '#6b7280' : 'var(--color-text-secondary)',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  Artifact
                                </div>
                                <p
                                  className="text-[15px] leading-7 max-w-[72ch]"
                                  style={{
                                    color: isExpanded ? '#111827' : 'var(--color-text-primary)',
                                  }}
                                >
                                  {block.artifact}
                                </p>
                              </div>
                            )}
                            {block.critiqueStep && (
                              <div
                                className="p-4 rounded-xl"
                                style={{
                                  backgroundColor: isExpanded ? '#f9fafb' : 'rgba(255, 255, 255, 0.05)',
                                }}
                              >
                                <div
                                  className="text-xs uppercase tracking-wide font-semibold mb-2"
                                  style={{
                                    color: isExpanded ? '#6b7280' : 'var(--color-text-secondary)',
                                    letterSpacing: '0.05em',
                                  }}
                                >
                                  Critique Step
                                </div>
                                <p
                                  className="text-[15px] leading-7 max-w-[72ch]"
                                  style={{
                                    color: isExpanded ? '#111827' : 'var(--color-text-primary)',
                                  }}
                                >
                                  {block.critiqueStep}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
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
