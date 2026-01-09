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
  const [mapModalLocation, setMapModalLocation] = useState<{ location: string; title: string; coordinates?: { lat: number; lng: number } } | null>(null)
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

  const handleApplyAIPathway = async (draft: AIPlanResponse) => {
    const newBlocks: ScheduleBlock[] = []
    const now = new Date().toISOString()
    let blockIndex = 0

    const startDate = new Date(trip.startDate)
    const options = generationOptions

    // Track used image IDs to ensure no duplicates within this generation
    const usedImageIds = new Set<string>()

    console.log(`[handleApplyAIPathway] START: Processing ${draft.days.length} days`, {
      hasOptions: !!options,
      selectedDays: options?.selectedDays,
      selectedDaysCount: options?.selectedDays?.length || 0,
      draftStructure: {
        hasDays: !!draft.days,
        daysLength: draft.days?.length || 0,
        firstDay: draft.days?.[0] ? {
          day: draft.days[0].day,
          hasScheduleBlocks: !!draft.days[0].scheduleBlocks,
          scheduleBlocksLength: draft.days[0].scheduleBlocks?.length || 0,
        } : null,
      },
    })
    
    // Safety check: ensure draft has days
    if (!draft.days || draft.days.length === 0) {
      console.error('[handleApplyAIPathway] ERROR: Draft has no days!', draft)
      showToast('No days in pathway. Please regenerate.', 'error')
      return
    }

    for (const day of draft.days) {
      // Calculate the actual date for this day
      // If the day was mapped to a specific date (from selectedDays), use that
      // Otherwise, calculate from startDate + day number
      const dayDate = new Date(startDate)
      dayDate.setDate(startDate.getDate() + (day.day - 1))
      const dayDateString = dayDate.toISOString().split('T')[0]
      
      // Use mapped date if available (from selectedDays mapping)
      const actualDate = (day as any)._mappedDate || dayDateString
      
      console.log(`[handleApplyAIPathway] Processing day ${day.day}`, {
        startDate: startDate.toISOString().split('T')[0],
        dayNumber: day.day,
        calculatedDate: dayDateString,
        mappedDate: (day as any)._mappedDate,
        actualDate,
        hasBlocks: day.scheduleBlocks.length,
        blockTitles: day.scheduleBlocks.map((b: any) => b.title),
      })
      
      // Skip if no blocks (shouldn't happen, but safety check)
      if (day.scheduleBlocks.length === 0) {
        console.warn(`[handleApplyAIPathway] Day ${day.day} has no schedule blocks, skipping`)
        continue
      }

      for (const block of day.scheduleBlocks) {
        // Use the actual date for this day (from selectedDays mapping if available)
        const blockDate = new Date(block.startTime)
        // Update block's startTime to use the actual date
        const actualDate = (day as any)._mappedDate || dayDateString
        const [datePart] = blockDate.toISOString().split('T')
        const timePart = blockDate.toISOString().split('T')[1]
        const updatedStartTime = `${actualDate}T${timePart}`
        
        const activityType = detectActivityType(block.title, block.description, day.fieldExperience)
        const activityLocation = day.fieldExperience ? trip.baseLocation : undefined
        
        // Extract Places data from enriched block (if available)
        const enrichedBlock = block as any
        const placeId = enrichedBlock.placeId
        const placeName = enrichedBlock.placeName
        const approxLat = enrichedBlock.approxLat
        const approxLng = enrichedBlock.approxLng
        const photoName = enrichedBlock.photoName
        const photoAttribution = enrichedBlock.photoAttribution
        const aiImageUrl = enrichedBlock.aiImageUrl
        const aiImageAssetId = enrichedBlock.aiImageAssetId

        // Determine image URL - ALWAYS set imageUrl for kid-appropriate images
        // Each activity gets a unique image based on type + unique key (title + day + index + timestamp)
        // This ensures NO TWO BLOCKS EVER GET THE SAME IMAGE
        // Include blockIndex and timestamp to ensure absolute uniqueness
        const timestamp = Date.now()
        const uniqueImageKey = `${block.title}-day${day.day}-block${blockIndex}-${timestamp}-${Math.random().toString(36).substring(7)}`
        let imageUrl: string | undefined
        let imageAlt: string | undefined
        let imageMode: 'google' | 'ai' | 'off' = options?.imageMode || 'off'

        if (options?.imageMode === 'ai' && aiImageUrl) {
          // Use AI-generated image if available
          imageUrl = aiImageUrl
          imageAlt = getActivityImageAlt(activityType, block.title, activityLocation)
          imageMode = 'ai'
        } else {
          // ALWAYS set imageUrl - use AI-generated keywords (from server-side enrichment) for better relevance
          // Check if AI-generated keywords are available from enrichment
          const enrichedBlock = block as any
          const imageKeywords = enrichedBlock.imageKeywords
          
          // Create a unique key that includes:
          // 1. The base unique key (title + day + index + timestamp + random)
          // 2. The first keyword (if available) for relevance
          // 3. The block index to ensure uniqueness even with same keywords
          // This ensures EVERY activity gets a DIFFERENT image, even if keywords are similar
          const imageKey = imageKeywords && imageKeywords.length > 0
            ? `${uniqueImageKey}-keyword-${imageKeywords[0]}-idx${blockIndex}`
            : `${uniqueImageKey}-idx${blockIndex}`
          
          console.log(`[Image Selection] Block ${blockIndex} "${block.title}":`, {
            activityType,
            imageKey: imageKey.substring(0, 80) + '...',
            hasKeywords: !!imageKeywords,
            firstKeyword: imageKeywords?.[0],
            usedImageIdsSize: usedImageIds.size,
          })
          
          imageUrl = getActivityIconUrl(activityType, imageKey, usedImageIds)
          imageAlt = getActivityImageAlt(activityType, block.title, activityLocation)
          imageMode = 'off' // Frontend will use activity-specific images
          
          console.log(`[Image Selection] Selected image for "${block.title}": ${imageUrl.substring(0, 80)}...`)
        }
        
        // Final fallback - ensure imageUrl is always set
        if (!imageUrl) {
          const fallbackKey = `${uniqueImageKey}-fallback-${blockIndex}`
          imageUrl = getActivityIconUrl(activityType, fallbackKey, usedImageIds)
          imageAlt = getActivityImageAlt(activityType, block.title, activityLocation)
          console.log(`[Image Selection] Using fallback image for "${block.title}"`)
        }
        
        // Calculate coordinates for maps
        const coordinates = (approxLat && approxLng && !isNaN(approxLat) && !isNaN(approxLng)) 
          ? { lat: approxLat, lng: approxLng }
          : undefined
        
        console.log(`[Block ${blockIndex}] "${block.title}":`, {
          imageUrl: imageUrl?.substring(0, 60) + '...',
          imageUrlLength: imageUrl?.length,
          type: activityType,
          key: uniqueImageKey.substring(0, 40),
          approxLat,
          approxLng,
          hasCoordinates: !!coordinates,
          coordinates,
          hasPlaceId: !!placeId,
          hasPlaceName: !!placeName,
        })
        
        newBlocks.push({
          id: `ai-${trip.id}-day${day.day}-${blockIndex}-${Date.now()}`,
          date: actualDate, // Use the mapped/actual date
          startTime: updatedStartTime, // Use the updated startTime with correct date
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
          // Places integration
          placeId,
          placeName,
          approxLat,
          approxLng,
          imageMode,
          photoName,
          photoAttribution,
          aiImageAssetId,
          aiImageUrl,
          // Legacy/fallback image fields
          imageUrl,
          imageAlt,
          // Coordinates for maps - always set if available, regardless of includeMaps option
          // (includeMaps is just for generation, but we should show maps if coordinates exist)
          coordinates,
        })
        blockIndex++
      }
    }

    // Replace only previously generated blocks, keep manual ones
    const manualBlocks = scheduleBlocks.filter(b => !b.isGenerated)
    const updated = [...manualBlocks, ...newBlocks]
    
    // Log unique image URLs to verify no duplicates
    const uniqueImageUrls = new Set(newBlocks.map(b => b.imageUrl).filter(Boolean))
    const imageUrlCounts = new Map<string, number>()
    newBlocks.forEach(b => {
      if (b.imageUrl) {
        imageUrlCounts.set(b.imageUrl, (imageUrlCounts.get(b.imageUrl) || 0) + 1)
      }
    })
    const duplicateImages = Array.from(imageUrlCounts.entries()).filter(([_, count]) => count > 1)
    
    console.log(`[handleApplyAIPathway] FINAL RESULTS:`, {
      draftDaysCount: draft.days.length,
      draftDaysDetails: draft.days.map(d => ({
        day: d.day,
        blocksCount: d.scheduleBlocks.length,
        blockTitles: d.scheduleBlocks.map((b: any) => b.title),
      })),
      newBlocksCount: newBlocks.length,
      manualBlocksCount: manualBlocks.length,
      totalBlocks: updated.length,
      blocksWithImages: newBlocks.filter(b => b.imageUrl).length,
      blocksWithCoordinates: newBlocks.filter(b => b.coordinates).length,
      uniqueImageUrls: uniqueImageUrls.size,
      totalImageUrls: newBlocks.filter(b => b.imageUrl).length,
      duplicateImages: duplicateImages.length > 0 ? duplicateImages.map(([url, count]) => ({ url: url.substring(0, 60) + '...', count })) : 'none',
      allBlockTitles: newBlocks.map(b => b.title),
      allBlockDates: newBlocks.map(b => b.date),
      allImageUrls: newBlocks.map(b => ({ title: b.title, imageUrl: b.imageUrl?.substring(0, 80) + '...' })),
    })
    
    if (newBlocks.length === 0) {
      console.error(`[handleApplyAIPathway] ERROR: No blocks created!`, {
        draftDays: draft.days.map(d => ({ 
          day: d.day, 
          blocksCount: d.scheduleBlocks?.length || 0,
          hasScheduleBlocks: !!d.scheduleBlocks,
          blockTitles: d.scheduleBlocks?.map((b: any) => b.title) || [],
          scheduleBlocksType: typeof d.scheduleBlocks,
        })),
        options,
        startDate: startDate.toISOString().split('T')[0],
        totalDaysProcessed: draft.days.length,
        daysWithBlocks: draft.days.filter(d => d.scheduleBlocks && d.scheduleBlocks.length > 0).length,
      })
      showToast('No activities were created. Please check the console for details.', 'error')
      return
    }
    
    onScheduleUpdate(updated)

    setShowAIModal(false)
    showToast(`AI pathway applied: ${newBlocks.length} activities added`, 'success')
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
                    overflow: 'hidden',
                  }}
                >
                  {/* Get image URL for header background */}
                  {(() => {
                    const activityType = detectActivityType(block.title, block.description, block.fieldExperience)
                    let headerImageUrl: string | null = null
                    let imageAlt: string = ''
                    
                    if (showImagesAndMaps) {
                      // Always use activity-specific images for kid-safety and relevance
                      // Each activity gets a unique image based on type + title hash
                      // This ensures no duplicates and all images are kid-appropriate
                      if (block.imageMode === 'ai' && block.aiImageUrl) {
                        // Use AI-generated image if available
                        headerImageUrl = block.aiImageUrl
                        imageAlt = block.imageAlt || getActivityImageAlt(activityType, block.title, block.location)
                      } else if (block.imageUrl) {
                        // Use provided image URL (should always be set)
                        headerImageUrl = block.imageUrl
                        imageAlt = block.imageAlt || getActivityImageAlt(activityType, block.title, block.location)
                        console.log(`[Image Display] Using block.imageUrl for "${block.title}": ${block.imageUrl.substring(0, 60)}...`)
                      } else {
                        // Fallback: Use activity-specific, kid-appropriate image
                        // This should rarely be needed if imageUrl is always set during block creation
                        // Use block.id as unique key to ensure uniqueness
                        headerImageUrl = getActivityIconUrl(activityType, block.id || block.title)
                        imageAlt = getActivityImageAlt(activityType, block.title, block.location)
                        console.log(`[Image Display] Using fallback image for "${block.title}" (block.imageUrl was not set)`)
                      }
                    } else {
                      // If images are disabled, don't show any
                      headerImageUrl = null
                    }
                    
                    console.log(`[Image Display] Final headerImageUrl for "${block.title}": ${headerImageUrl ? headerImageUrl.substring(0, 60) + '...' : 'null'}`)
                    
                    return (
                      <>
                        {/* Header with background image */}
                        <div
                          style={{
                            position: 'relative',
                            minHeight: headerImageUrl ? '200px' : 'auto',
                            backgroundImage: headerImageUrl ? `url(${headerImageUrl})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            borderRadius: headerImageUrl ? 'var(--radius-card) var(--radius-card) 0 0' : '0',
                            overflow: 'hidden',
                          }}
                          onError={(e) => {
                            // If background image fails to load, fallback to solid color
                            const target = e.currentTarget as HTMLDivElement
                            target.style.backgroundImage = 'none'
                            target.style.backgroundColor = 'var(--color-surface)'
                          }}
                        >
                          {/* Dark overlay for text readability */}
                          {headerImageUrl && (
                            <div
                              style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)',
                                zIndex: 0,
                              }}
                            />
                          )}
                          
                          {/* Header content */}
                          <div 
                            className="flex items-start justify-between gap-4"
                            style={{
                              position: 'relative',
                              zIndex: 1,
                              padding: 'var(--spacing-6)',
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2" style={{ marginBottom: 'var(--spacing-2)' }}>
                                {block.isGenerated && (
                                  <Badge variant="draft">Draft</Badge>
                                )}
                              </div>
                              <h3
                                style={{
                                  fontSize: 'var(--font-size-xl)',
                                  lineHeight: 'var(--line-height-tight)',
                                  fontWeight: 'var(--font-weight-semibold)',
                                  color: headerImageUrl ? 'white' : 'var(--color-text-primary)',
                                  marginBottom: 'var(--spacing-2)',
                                }}
                              >
                                {block.title}
                              </h3>
                              <div className="flex items-center gap-3 flex-wrap" style={{ fontSize: 'var(--font-size-sm)', color: headerImageUrl ? 'rgba(255,255,255,0.9)' : 'var(--color-text-secondary)' }}>
                                <span>
                                  {formatDate(block.startTime)}
                                </span>
                                <span style={{ opacity: 0.6 }}>•</span>
                                <span>
                                  {formatDateTime(block.startTime).split('•')[1]?.trim()}
                                </span>
                                <span style={{ opacity: 0.6 }}>•</span>
                                <span>
                                  {block.duration} min
                                </span>
                                {block.location && (
                                  <>
                                    <span style={{ opacity: 0.6 }}>•</span>
                                    <span>
                                      {block.location}
                                    </span>
                                  </>
                                )}
                              </div>
                              {/* Photo Attribution on header */}
                              {headerImageUrl && block.imageMode === 'google' && block.photoAttribution && (
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'rgba(255,255,255,0.7)', marginTop: 'var(--spacing-2)' }}>
                                  <a
                                    href={block.photoAttribution.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ 
                                      color: 'rgba(255,255,255,0.7)',
                                      textDecoration: 'none',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.textDecoration = 'underline'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.textDecoration = 'none'
                                    }}
                                  >
                                    Photo: {block.photoAttribution.displayName}
                                  </a>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {/* Map Button - More Prominent */}
                              {showImagesAndMaps && (block.location || block.coordinates || (block.approxLat && block.approxLng)) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const coords = block.coordinates || (block.approxLat && block.approxLng 
                                      ? { lat: block.approxLat, lng: block.approxLng }
                                      : undefined)
                                    
                                    console.log(`[Map Button] Clicked for "${block.title}":`, {
                                      hasCoordinates: !!block.coordinates,
                                      hasApproxLat: !!block.approxLat,
                                      hasApproxLng: !!block.approxLng,
                                      coordinates: block.coordinates,
                                      approxLat: block.approxLat,
                                      approxLng: block.approxLng,
                                      finalCoords: coords,
                                    })
                                    
                                    if (!coords) {
                                      console.warn(`[Map Button] No coordinates available for "${block.title}"`)
                                    }
                                    
                                    setMapModalLocation({ 
                                      location: block.location || block.placeName || block.title,
                                      title: block.title,
                                      coordinates: coords,
                                    })
                                  }}
                                  className="flex items-center gap-2 px-3 py-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
                                  style={{
                                    backgroundColor: headerImageUrl ? 'rgba(255,255,255,0.2)' : 'var(--color-surface-hover)',
                                    color: headerImageUrl ? 'white' : 'var(--color-text-secondary)',
                                    outlineColor: 'var(--color-focus-ring)',
                                    border: headerImageUrl ? '1px solid rgba(255,255,255,0.3)' : '1px solid var(--color-border-subtle)',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = headerImageUrl ? 'rgba(255,255,255,0.3)' : 'var(--color-surface-hover)'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = headerImageUrl ? 'rgba(255,255,255,0.2)' : 'var(--color-surface-hover)'
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
                                  <span style={{ fontSize: 'var(--font-size-sm)' }}>Map</span>
                                </button>
                              )}
                              {isExpanded && (
                                <>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleEditBlock(block)
                                    }}
                                    style={{
                                      backgroundColor: headerImageUrl ? 'rgba(255,255,255,0.95)' : 'var(--color-surface-hover)',
                                      color: headerImageUrl ? 'var(--color-text-primary)' : 'var(--color-text-primary)',
                                      border: headerImageUrl ? '1px solid rgba(255,255,255,0.3)' : '1px solid var(--color-border)',
                                      fontWeight: 'var(--font-weight-medium)',
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
                                    style={{ 
                                      color: headerImageUrl ? 'white' : 'var(--color-danger)',
                                      backgroundColor: headerImageUrl ? 'rgba(239,68,68,0.9)' : 'var(--color-surface-hover)',
                                      border: headerImageUrl ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--color-border)',
                                      fontWeight: 'var(--font-weight-medium)',
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
                                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors"
                                style={{
                                  color: headerImageUrl ? 'white' : 'var(--color-text-secondary)',
                                  outlineColor: 'var(--color-focus-ring)',
                                  backgroundColor: headerImageUrl ? 'rgba(255,255,255,0.2)' : 'transparent',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = headerImageUrl ? 'rgba(255,255,255,0.3)' : 'var(--color-surface-hover)'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = headerImageUrl ? 'rgba(255,255,255,0.2)' : 'transparent'
                                }}
                                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                {isExpanded ? '−' : '+'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )
                  })()}

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div 
                      style={{ 
                        padding: 'var(--spacing-6)',
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
                            {/* Map Preview */}
                            {showImagesAndMaps && (block.coordinates || (block.approxLat && block.approxLng)) && (
                              <div
                                style={{
                                  padding: 'var(--spacing-4)',
                                  borderRadius: 'var(--radius-card)',
                                  backgroundColor: 'var(--color-background)',
                                  border: '1px solid var(--color-border-subtle)',
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 'var(--font-size-xs)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontWeight: 'var(--font-weight-medium)',
                                    color: 'var(--color-text-secondary)',
                                    marginBottom: 'var(--spacing-3)',
                                  }}
                                >
                                  Location
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const coords = block.coordinates || (block.approxLat && block.approxLng 
                                      ? { lat: block.approxLat, lng: block.approxLng }
                                      : undefined)
                                    setMapModalLocation({ 
                                      location: block.location || block.placeName || block.title,
                                      title: block.title,
                                      coordinates: coords,
                                    })
                                  }}
                                  style={{
                                    width: '100%',
                                    height: '200px',
                                    borderRadius: 'var(--radius-sm)',
                                    backgroundColor: 'var(--color-surface)',
                                    border: '1px solid var(--color-border-subtle)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexDirection: 'column',
                                    gap: 'var(--spacing-2)',
                                    color: 'var(--color-text-secondary)',
                                    transition: 'all 0.2s',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'
                                    e.currentTarget.style.borderColor = 'var(--color-michi-green)'
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--color-surface)'
                                    e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
                                  }}
                                  aria-label={`View map for ${block.location || block.placeName || block.title}`}
                                >
                                  <svg
                                    width="32"
                                    height="32"
                                    viewBox="0 0 18 18"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    style={{ opacity: 0.6 }}
                                  >
                                    <path
                                      d="M9 1.5C6.1 1.5 3.75 3.85 3.75 6.75C3.75 10.5 9 16.5 9 16.5C9 16.5 14.25 10.5 14.25 6.75C14.25 3.85 11.9 1.5 9 1.5ZM9 9C8.17 9 7.5 8.33 7.5 7.5C7.5 6.67 8.17 6 9 6C9.83 6 10.5 6.67 10.5 7.5C10.5 8.33 9.83 9 9 9Z"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      fill="none"
                                    />
                                  </svg>
                                  <span style={{ fontSize: 'var(--font-size-sm)' }}>
                                    {block.location || block.placeName || 'View on map'}
                                  </span>
                                  <span style={{ fontSize: 'var(--font-size-xs)', opacity: 0.7 }}>
                                    Click to open interactive map
                                  </span>
                                </button>
                              </div>
                            )}
                            
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
        coordinates={mapModalLocation?.coordinates}
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
