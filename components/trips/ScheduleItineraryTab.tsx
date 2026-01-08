'use client'

import { useState, useEffect } from 'react'
import type { Trip, ScheduleBlock, LearningTarget } from '@/types'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import { Section } from '../ui/Section'
import { showToast } from '../ui/Toast'
import { AIPathwayModal } from './AIPathwayModal'
import { EditScheduleBlockModal } from './EditScheduleBlockModal'
import { MapModal } from './MapModal'
import { LearningPathwayOptionsModal, type PathwayGenerationOptions } from './LearningPathwayOptionsModal'
import type { AIPlanResponse } from '@/lib/ai-plan-schema'
import { useDemoUser } from '@/contexts/DemoUserContext'
import { getLearnerProfile } from '@/lib/learner-profiles'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { getUserSettings } from '@/lib/user-settings'
import { detectActivityType, getActivityIconUrl, getActivityImageAlt, getActivityIconFallback } from '@/lib/activity-images'

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
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiDraft, setAiDraft] = useState<AIPlanResponse | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null)
  const [mapModalLocation, setMapModalLocation] = useState<{ location: string; title: string } | null>(null)
  const [showImagesAndMaps, setShowImagesAndMaps] = useState(true)
  const [generationOptions, setGenerationOptions] = useState<PathwayGenerationOptions | null>(null)

  useEffect(() => {
    const settings = getUserSettings()
    setShowImagesAndMaps(settings.showImagesAndMaps)
  }, [])

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

  const handleGenerateAIPathwayClick = () => {
    if (!trip.learningTarget) {
      showToast('Please set a learning target first', 'error')
      return
    }
    setShowOptionsModal(true)
  }

  const handleGenerateWithOptions = async (options: PathwayGenerationOptions) => {
    setShowOptionsModal(false)
    setIsGenerating(true)
    setShowAIModal(true)
    setAiDraft(null)
    setGenerationOptions(options)

    try {
      const learnerProfile = getLearnerProfile(currentUserId)
      
      // Merge profile overrides
      const mergedProfile = {
        ...learnerProfile,
        pblProfile: {
          ...learnerProfile.pblProfile,
          currentLevel: options.profileOverrides.currentLevel || learnerProfile.pblProfile.currentLevel,
          preferredArtifactTypes: options.profileOverrides.preferredArtifactTypes || learnerProfile.pblProfile.preferredArtifactTypes,
        },
        experientialProfile: {
          ...learnerProfile.experientialProfile,
          reflectionStyle: options.profileOverrides.reflectionStyle || learnerProfile.experientialProfile.reflectionStyle,
        },
      }

      const learningTarget: LearningTarget = {
        track: options.effortTrack,
        weeklyHours: options.weeklyHours,
      }
      
      const response = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerProfileId: currentUserId,
          learnerProfile: mergedProfile,
          trip,
          learningTarget,
          generationOptions: options,
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
    const options = generationOptions

    for (const day of draft.days) {
      // Check if this day should be included based on selected days
      const dayDate = new Date(startDate)
      dayDate.setDate(startDate.getDate() + (day.day - 1))
      const dayDateString = dayDate.toISOString().split('T')[0]
      
      if (options && !options.selectedDays.includes(dayDateString)) {
        continue // Skip days not in selected range
      }

      for (const block of day.scheduleBlocks) {
        const blockDate = new Date(block.startTime)
        const activityType = detectActivityType(block.title, block.description, day.fieldExperience)
        const activityLocation = day.fieldExperience ? trip.baseLocation : undefined
        
        newBlocks.push({
          id: `ai-${trip.id}-day${day.day}-${blockIndex}-${Date.now()}`,
          date: blockDate.toISOString().split('T')[0],
          startTime: block.startTime,
          duration: block.duration,
          title: block.title,
          description: block.description,
          // Incorporate field experience into schedule block
          location: activityLocation,
          notes: day.fieldExperience ? `${day.fieldExperience}\n\n${day.inquiryTask}\n\nArtifact: ${day.artifact}` : undefined,
          isGenerated: true,
          createdAt: now,
          drivingQuestion: day.drivingQuestion,
          fieldExperience: day.fieldExperience,
          inquiryTask: day.inquiryTask,
          artifact: day.artifact,
          reflectionPrompt: day.reflectionPrompt,
          critiqueStep: day.critiqueStep,
          // Add images/maps if enabled
          imageUrl: options?.includeImages ? getActivityIconUrl(activityType, activityLocation) : undefined,
          imageAlt: options?.includeImages ? getActivityImageAlt(activityType, block.title, activityLocation) : undefined,
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
            <Button onClick={handleGenerateAIPathwayClick} disabled={isGenerating} isLoading={isGenerating}>
              {isGenerating ? 'Generating pathway...' : 'Generate learning pathway'}
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              Set learning target first
            </Button>
          )
        }
        emptyState={{
          message: trip.learningTarget
            ? 'No schedule items yet. Generate a learning pathway to create schedule blocks.'
            : 'Set a learning target first, then generate your schedule.',
        }}
        isEmpty={sortedBlocks.length === 0}
      >
        {sortedBlocks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {sortedBlocks.map((block) => {
              const isExpanded = expandedCardId === block.id

              return (
                <Card
                  key={block.id}
                  onClick={() => setExpandedCardId(isExpanded ? null : block.id)}
                  className="cursor-pointer"
                  style={{
                    backgroundColor: isExpanded ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 flex items-start gap-3">
                      {/* Activity Image */}
                      {showImagesAndMaps && (() => {
                        const activityType = detectActivityType(block.title, block.description, block.fieldExperience)
                        const imageUrl = block.imageUrl || getActivityIconUrl(activityType, block.location)
                        const imageAlt = block.imageAlt || getActivityImageAlt(activityType, block.title, block.location)
                        
                        return (
                          <div
                            className="flex-shrink-0"
                            style={{
                              width: '64px',
                              height: '64px',
                              borderRadius: 'var(--radius-sm)',
                              overflow: 'hidden',
                              backgroundColor: 'var(--color-background)',
                              border: '1px solid var(--color-border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <img
                              src={imageUrl}
                              alt={imageAlt}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                              onError={(e) => {
                                // Fallback to SVG icon if image fails
                                const target = e.currentTarget
                                target.src = getActivityIconFallback(activityType)
                              }}
                            />
                          </div>
                        )
                      })()}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2" style={{ marginBottom: 'var(--spacing-2)' }}>
                          {block.isGenerated && (
                            <Badge variant="draft">Draft</Badge>
                          )}
                        </div>
                        <h3
                          style={{
                            fontSize: 'var(--font-size-lg)',
                            lineHeight: 'var(--line-height-tight)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-text-primary)',
                            marginBottom: 'var(--spacing-2)',
                          }}
                        >
                          {block.title}
                        </h3>
                      <div className="flex items-center gap-3 flex-wrap" style={{ fontSize: 'var(--font-size-sm)' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {formatDate(block.startTime)}
                        </span>
                        <span style={{ color: 'var(--color-text-tertiary)' }}>•</span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {formatDateTime(block.startTime).split('•')[1]?.trim()}
                        </span>
                        <span style={{ color: 'var(--color-text-tertiary)' }}>•</span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {block.duration} min
                        </span>
                        {block.location && (
                          <>
                            <span style={{ color: 'var(--color-text-tertiary)' }}>•</span>
                            <span style={{ color: 'var(--color-text-secondary)' }}>
                              {block.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Map Icon */}
                      {showImagesAndMaps && block.location && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setMapModalLocation({ location: block.location!, title: block.title })
                          }}
                          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
                          style={{
                            color: 'var(--color-text-secondary)',
                            outlineColor: 'var(--color-focus-ring)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                          aria-label={`View map for ${block.location}`}
                          title={`View map: ${block.location}`}
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 18 18"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M9 1.5C6.1 1.5 3.75 3.85 3.75 6.75C3.75 10.5 9 16.5 9 16.5C9 16.5 14.25 10.5 14.25 6.75C14.25 3.85 11.9 1.5 9 1.5ZM9 9C8.17 9 7.5 8.33 7.5 7.5C7.5 6.67 8.17 6 9 6C9.83 6 10.5 6.67 10.5 7.5C10.5 8.33 9.83 9 9 9Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              fill="none"
                            />
                          </svg>
                        </button>
                      )}
                      {isExpanded && (
                        <>
                          <Button
                            variant="tertiary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditBlock(block)
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="tertiary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteBlock(block.id)
                            }}
                            style={{ color: 'var(--color-danger)' }}
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
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
                        style={{
                          color: 'var(--color-text-secondary)',
                          outlineColor: 'var(--color-focus-ring)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? '−' : '+'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div 
                      style={{ 
                        marginTop: 'var(--spacing-6)',
                        paddingTop: 'var(--spacing-6)',
                        borderTop: '1px solid var(--color-border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
                        {/* Two-column layout for desktop */}
                        <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 'var(--spacing-6)' }}>
                          {/* Left Column: PBL Elements */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
                            {block.drivingQuestion && (
                              <div
                                style={{
                                  padding: 'var(--spacing-4)',
                                  borderRadius: 'var(--radius-card)',
                                  backgroundColor: 'var(--color-background)',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 'var(--font-size-xs)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontWeight: 'var(--font-weight-medium)',
                                    color: 'var(--color-text-secondary)',
                                    marginBottom: 'var(--spacing-2)',
                                  }}
                                >
                                  Driving Question
                                </div>
                                <p
                                  style={{
                                    fontSize: 'var(--font-size-base)',
                                    lineHeight: 'var(--line-height-relaxed)',
                                    color: 'var(--color-text-primary)',
                                    maxWidth: '72ch',
                                  }}
                                >
                                  {block.drivingQuestion}
                                </p>
                              </div>
                            )}
                            {block.inquiryTask && (
                              <div
                                style={{
                                  padding: 'var(--spacing-4)',
                                  borderRadius: 'var(--radius-card)',
                                  backgroundColor: 'var(--color-background)',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 'var(--font-size-xs)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontWeight: 'var(--font-weight-medium)',
                                    color: 'var(--color-text-secondary)',
                                    marginBottom: 'var(--spacing-2)',
                                  }}
                                >
                                  Inquiry Task
                                </div>
                                <p
                                  style={{
                                    fontSize: 'var(--font-size-base)',
                                    lineHeight: 'var(--line-height-relaxed)',
                                    color: 'var(--color-text-primary)',
                                    maxWidth: '72ch',
                                  }}
                                >
                                  {block.inquiryTask}
                                </p>
                              </div>
                            )}
                            {block.reflectionPrompt && (
                              <div
                                style={{
                                  padding: 'var(--spacing-4)',
                                  borderRadius: 'var(--radius-card)',
                                  backgroundColor: 'var(--color-background)',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 'var(--font-size-xs)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontWeight: 'var(--font-weight-medium)',
                                    color: 'var(--color-text-secondary)',
                                    marginBottom: 'var(--spacing-2)',
                                  }}
                                >
                                  Reflection Prompt
                                </div>
                                <p
                                  style={{
                                    fontSize: 'var(--font-size-base)',
                                    lineHeight: 'var(--line-height-relaxed)',
                                    color: 'var(--color-text-primary)',
                                    maxWidth: '72ch',
                                  }}
                                >
                                  {block.reflectionPrompt}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Right Column: Logistics & Field Experience */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
                            {block.description && (
                              <div
                                style={{
                                  padding: 'var(--spacing-4)',
                                  borderRadius: 'var(--radius-card)',
                                  backgroundColor: 'var(--color-background)',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 'var(--font-size-xs)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontWeight: 'var(--font-weight-medium)',
                                    color: 'var(--color-text-secondary)',
                                    marginBottom: 'var(--spacing-2)',
                                  }}
                                >
                                  Description
                                </div>
                                <p
                                  style={{
                                    fontSize: 'var(--font-size-base)',
                                    lineHeight: 'var(--line-height-relaxed)',
                                    color: 'var(--color-text-primary)',
                                    maxWidth: '72ch',
                                  }}
                                >
                                  {block.description}
                                </p>
                              </div>
                            )}
                            {block.fieldExperience && (
                              <div
                                style={{
                                  padding: 'var(--spacing-4)',
                                  borderRadius: 'var(--radius-card)',
                                  backgroundColor: 'var(--color-background)',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 'var(--font-size-xs)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontWeight: 'var(--font-weight-medium)',
                                    color: 'var(--color-text-secondary)',
                                    marginBottom: 'var(--spacing-2)',
                                  }}
                                >
                                  Field Experience
                                </div>
                                <p
                                  style={{
                                    fontSize: 'var(--font-size-base)',
                                    lineHeight: 'var(--line-height-relaxed)',
                                    color: 'var(--color-text-primary)',
                                    maxWidth: '72ch',
                                  }}
                                >
                                  {block.fieldExperience}
                                </p>
                              </div>
                            )}
                            {block.location && (
                              <div
                                style={{
                                  padding: 'var(--spacing-4)',
                                  borderRadius: 'var(--radius-card)',
                                  backgroundColor: 'var(--color-background)',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 'var(--font-size-xs)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontWeight: 'var(--font-weight-medium)',
                                    color: 'var(--color-text-secondary)',
                                    marginBottom: 'var(--spacing-2)',
                                  }}
                                >
                                  Location
                                </div>
                                <p
                                  style={{
                                    fontSize: 'var(--font-size-base)',
                                    lineHeight: 'var(--line-height-relaxed)',
                                    color: 'var(--color-text-primary)',
                                    maxWidth: '72ch',
                                  }}
                                >
                                  {block.location}
                                </p>
                              </div>
                            )}
                            {block.notes && (
                              <div
                                style={{
                                  padding: 'var(--spacing-4)',
                                  borderRadius: 'var(--radius-card)',
                                  backgroundColor: 'var(--color-background)',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 'var(--font-size-xs)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontWeight: 'var(--font-weight-medium)',
                                    color: 'var(--color-text-secondary)',
                                    marginBottom: 'var(--spacing-2)',
                                  }}
                                >
                                  Notes
                                </div>
                                <p
                                  style={{
                                    fontSize: 'var(--font-size-base)',
                                    lineHeight: 'var(--line-height-relaxed)',
                                    color: 'var(--color-text-primary)',
                                    maxWidth: '72ch',
                                    whiteSpace: 'pre-line',
                                  }}
                                >
                                  {block.notes}
                                </p>
                              </div>
                            )}
                            {block.artifact && (
                              <div
                                style={{
                                  padding: 'var(--spacing-4)',
                                  borderRadius: 'var(--radius-card)',
                                  backgroundColor: 'var(--color-background)',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 'var(--font-size-xs)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontWeight: 'var(--font-weight-medium)',
                                    color: 'var(--color-text-secondary)',
                                    marginBottom: 'var(--spacing-2)',
                                  }}
                                >
                                  Artifact
                                </div>
                                <p
                                  style={{
                                    fontSize: 'var(--font-size-base)',
                                    lineHeight: 'var(--line-height-relaxed)',
                                    color: 'var(--color-text-primary)',
                                    maxWidth: '72ch',
                                  }}
                                >
                                  {block.artifact}
                                </p>
                              </div>
                            )}
                            {block.critiqueStep && (
                              <div
                                style={{
                                  padding: 'var(--spacing-4)',
                                  borderRadius: 'var(--radius-card)',
                                  backgroundColor: 'var(--color-background)',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 'var(--font-size-xs)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontWeight: 'var(--font-weight-medium)',
                                    color: 'var(--color-text-secondary)',
                                    marginBottom: 'var(--spacing-2)',
                                  }}
                                >
                                  Critique Step
                                </div>
                                <p
                                  style={{
                                    fontSize: 'var(--font-size-base)',
                                    lineHeight: 'var(--line-height-relaxed)',
                                    color: 'var(--color-text-primary)',
                                    maxWidth: '72ch',
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
      <MapModal
        isOpen={!!mapModalLocation}
        onClose={() => setMapModalLocation(null)}
        location={mapModalLocation?.location || ''}
        activityTitle={mapModalLocation?.title}
      />
      <LearningPathwayOptionsModal
        isOpen={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        onGenerate={handleGenerateWithOptions}
        trip={trip}
        learnerProfile={getLearnerProfile(currentUserId)}
        defaultLearningTarget={trip.learningTarget}
      />
    </>
  )
}
