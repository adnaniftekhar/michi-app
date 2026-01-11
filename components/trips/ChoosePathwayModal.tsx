'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Trip, LearningTarget, LearnerProfile, PathwayDraft, PathwayDraftsResponse, FinalPathwayPlan } from '@/types'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { showToast } from '../ui/Toast'
import { getUserSettings } from '@/lib/user-settings'

type DaysSelectionMode = 'entire-trip' | 'date-range' | 'select-days'

interface ChoosePathwayModalProps {
  isOpen: boolean
  onClose: () => void
  onFinalize: (plan: FinalPathwayPlan) => void
  trip: Trip
  learnerProfile: LearnerProfile
  learnerId: string
  selectedDates: string[] // Initial selected dates
  effortMode: LearningTarget['track']
  weeklyHours?: number
}

export function ChoosePathwayModal({
  isOpen,
  onClose,
  onFinalize,
  trip,
  learnerProfile,
  learnerId,
  selectedDates: initialSelectedDates,
  effortMode,
  weeklyHours,
}: ChoosePathwayModalProps) {
  // Days selection state
  const [daysMode, setDaysMode] = useState<DaysSelectionMode>('entire-trip')
  const [selectedDates, setSelectedDates] = useState<string[]>(initialSelectedDates)
  const [dateRangeStart, setDateRangeStart] = useState<string>(trip.startDate)
  const [dateRangeEnd, setDateRangeEnd] = useState<string>(trip.endDate)
  const [selectedDayCheckboxes, setSelectedDayCheckboxes] = useState<Set<string>>(new Set(initialSelectedDates))

  // Drafts state
  const [drafts, setDrafts] = useState<PathwayDraft[] | null>(null)
  const [originalDrafts, setOriginalDrafts] = useState<PathwayDraft[] | null>(null) // Store original for revert
  const [draftEdits, setDraftEdits] = useState<Record<string, PathwayDraft>>({}) // draftId -> edited draft
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null)
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null)
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get all trip dates
  const allTripDates = useRef<string[]>([])
  useEffect(() => {
    const dates: string[] = []
    const start = new Date(trip.startDate)
    const end = new Date(trip.endDate)
    const current = new Date(start)
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }
    allTripDates.current = dates
  }, [trip.startDate, trip.endDate])

  // Update selectedDates based on mode
  useEffect(() => {
    if (daysMode === 'entire-trip') {
      const dates = allTripDates.current
      // Only update if dates actually changed
      setSelectedDates((prev) => {
        if (prev.length === dates.length && prev.every((d, i) => d === dates[i])) {
          return prev
        }
        return dates
      })
      setSelectedDayCheckboxes((prev) => {
        const newSet = new Set(dates)
        if (prev.size === newSet.size && Array.from(prev).every((d) => newSet.has(d))) {
          return prev
        }
        return newSet
      })
    } else if (daysMode === 'date-range') {
      const dates: string[] = []
      const start = new Date(dateRangeStart)
      const end = new Date(dateRangeEnd)
      const tripStart = new Date(trip.startDate)
      const tripEnd = new Date(trip.endDate)
      
      // Clamp to trip dates
      const clampedStart = start < tripStart ? tripStart : start
      const clampedEnd = end > tripEnd ? tripEnd : end
      
      const current = new Date(clampedStart)
      while (current <= clampedEnd) {
        dates.push(current.toISOString().split('T')[0])
        current.setDate(current.getDate() + 1)
      }
      
      // Only update if dates actually changed
      setSelectedDates((prev) => {
        if (prev.length === dates.length && prev.every((d, i) => d === dates[i])) {
          return prev
        }
        return dates
      })
      setSelectedDayCheckboxes((prev) => {
        const newSet = new Set(dates)
        if (prev.size === newSet.size && Array.from(prev).every((d) => newSet.has(d))) {
          return prev
        }
        return newSet
      })
    }
  }, [daysMode, dateRangeStart, dateRangeEnd, trip.startDate, trip.endDate])

  // Separate effect for select-days mode to handle checkbox changes
  // Use a string representation to avoid Set reference issues
  const selectedDayCheckboxesString = Array.from(selectedDayCheckboxes).sort().join(',')
  useEffect(() => {
    if (daysMode === 'select-days') {
      const dates = Array.from(selectedDayCheckboxes).sort()
      // Only update if dates actually changed
      setSelectedDates((prev) => {
        if (prev.length === dates.length && prev.every((d, i) => d === dates[i])) {
          return prev
        }
        return dates
      })
    }
  }, [daysMode, selectedDayCheckboxesString])

  // Load drafts when modal opens or selectedDates change (but only on explicit update)
  const loadDrafts = useCallback(async () => {
    if (selectedDates.length === 0) {
      setError('Please select at least one day to plan')
      return
    }

    setIsLoadingDrafts(true)
    setError(null)

    try {
      console.log('Loading pathway drafts with:', {
        tripId: trip.id,
        learnerId,
        selectedDatesCount: selectedDates.length,
        effortMode,
        hasTrip: !!trip,
        hasLearnerProfile: !!learnerProfile,
      })

      const response = await fetch('/api/pathways/drafts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tripId: trip.id,
          learnerId,
          selectedDates,
          effortMode,
          trip,
          learnerProfile,
        }),
      })

      console.log('Pathway drafts API response status:', response.status, response.statusText)

      if (!response.ok) {
        let errorMessage = `Failed to load pathway drafts (${response.status})`
        let errorData: any = {}
        
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json()
            errorMessage = errorData.error || errorData.details || errorMessage
            console.error('Pathway drafts API error (JSON):', errorData)
          } else {
            // Response is not JSON (might be HTML redirect or plain text)
            const text = await response.text()
            errorMessage = `Server returned ${response.status}: ${text.substring(0, 200)}`
            console.error('Pathway drafts API error (non-JSON):', {
              status: response.status,
              statusText: response.statusText,
              contentType,
              textPreview: text.substring(0, 500),
            })
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorMessage = `Failed to load pathway drafts (${response.status} ${response.statusText})`
        }
        
        throw new Error(errorMessage)
      }

      const data: PathwayDraftsResponse = await response.json()
      
      if (!data.drafts || data.drafts.length !== 3) {
        throw new Error('Invalid response: expected exactly 3 pathway drafts')
      }

      setDrafts(data.drafts)
      setOriginalDrafts(data.drafts)
      // Preserve edits when regenerating
      const preservedEdits: Record<string, PathwayDraft> = {}
      data.drafts.forEach((draft) => {
        if (draftEdits[draft.id]) {
          preservedEdits[draft.id] = { ...draftEdits[draft.id], days: draft.days } // Update days but keep edits
        }
      })
      setDraftEdits(preservedEdits)
    } catch (err) {
      console.error('Error loading drafts:', err)
      setError(err instanceof Error ? err.message : 'Failed to load pathway drafts')
      showToast('Failed to load pathway options', 'error')
    } finally {
      setIsLoadingDrafts(false)
    }
  }, [trip, learnerId, selectedDates, effortMode, learnerProfile, draftEdits])

  // Load drafts on initial open
  useEffect(() => {
    if (isOpen && !drafts && !isLoadingDrafts && selectedDates.length > 0) {
      loadDrafts()
    }
  }, [isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDrafts(null)
      setOriginalDrafts(null)
      setDraftEdits({})
      setSelectedDraftId(null)
      setEditingDraftId(null)
      setError(null)
      setIsLoadingDrafts(false)
      setIsFinalizing(false)
      setDaysMode('entire-trip')
      setSelectedDates(initialSelectedDates)
      setSelectedDayCheckboxes(new Set(initialSelectedDates))
    }
  }, [isOpen, initialSelectedDates])

  const handleUpdateOptions = () => {
    if (selectedDates.length === 0) {
      setError('Please select at least one day to plan')
      return
    }
    loadDrafts()
  }

  const handleFinalize = async () => {
    if (!selectedDraftId || !drafts) return

    const chosenDraft = draftEdits[selectedDraftId] || drafts.find((d) => d.id === selectedDraftId)
    if (!chosenDraft) return

    setIsFinalizing(true)
    setError(null)

    // Get user privacy settings
    const userSettings = getUserSettings()

    try {
      const response = await fetch('/api/pathways/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: trip.id,
          learnerId,
          chosenDraftId: selectedDraftId,
          selectedDates,
          effortMode,
          trip,
          learnerProfile,
          chosenDraft: draftEdits[selectedDraftId] || chosenDraft,
          editedDraft: draftEdits[selectedDraftId] || undefined,
          venueLinksEnabled: userSettings.venueLinksEnabled ?? true,
          showExactAddresses: userSettings.showExactAddresses ?? false,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate detailed plan')
      }

      const finalPlan: FinalPathwayPlan = await response.json()
      onFinalize(finalPlan)
      onClose()
    } catch (err) {
      console.error('Error finalizing pathway:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate detailed plan')
      showToast('Failed to generate detailed plan', 'error')
    } finally {
      setIsFinalizing(false)
    }
  }

  const handleEditDraft = (draftId: string) => {
    setEditingDraftId(draftId)
  }

  const handleSaveDraftEdit = (draftId: string, editedDraft: PathwayDraft) => {
    setDraftEdits((prev) => ({ ...prev, [draftId]: editedDraft }))
    setEditingDraftId(null)
    showToast('Draft changes saved', 'success')
  }

  const handleDiscardDraftEdit = (draftId: string) => {
    setDraftEdits((prev) => {
      const updated = { ...prev }
      delete updated[draftId]
      return updated
    })
    setEditingDraftId(null)
  }

  const handleFallbackContinuous = async () => {
    const fallbackDraft: PathwayDraft = {
      id: 'fallback-continuous',
      type: 'continuous',
      title: 'Basic Continuous Pathway',
      overview: 'A straightforward day-by-day learning progression.',
      whyItFits: 'This pathway provides a reliable foundation for your trip.',
      days: selectedDates.map((date, idx) => ({
        day: idx + 1,
        date,
        headline: `Day ${idx + 1} learning activities`,
      })),
    }

    setSelectedDraftId(fallbackDraft.id)
    setDrafts([fallbackDraft, fallbackDraft, fallbackDraft])
    setOriginalDrafts([fallbackDraft, fallbackDraft, fallbackDraft])
  }

  if (!isOpen) return null

  const datesSummary = selectedDates
    .map((date, idx) => {
      return `Day ${idx + 1}`
    })
    .join(', ')

  const getDisplayDraft = (draft: PathwayDraft) => draftEdits[draft.id] || draft

  return (
    <>
      {/* Generating Overlay - Centered on screen */}
      {isFinalizing && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-card)',
              padding: 'var(--spacing-8)',
              maxWidth: '500px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ marginBottom: 'var(--spacing-6)' }}>
              <LoadingSpinner size="lg" />
            </div>
            <h3
              style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--spacing-3)',
              }}
            >
              Generating Your Pathway
            </h3>
            <p
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-height-relaxed)',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              Please stay on this page while we create your detailed learning plan. Navigating away will cancel the generation process.
            </p>
            <div
              style={{
                padding: 'var(--spacing-4)',
                backgroundColor: 'var(--color-background)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
              }}
            >
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-tertiary)',
                  fontStyle: 'italic',
                }}
              >
                This may take 7-43 seconds...
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        onClick={onClose}
      >
        <div
          className="max-w-6xl w-full overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            maxHeight: '90vh',
            opacity: isFinalizing ? 0.3 : 1,
            pointerEvents: isFinalizing ? 'none' : 'auto',
          }}
        >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: 'var(--spacing-6)',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 'var(--font-size-2xl)',
                lineHeight: 'var(--line-height-tight)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--spacing-2)',
              }}
            >
              Choose Your Pathway
            </h2>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {trip.title} • Effort: {effortMode}
              {weeklyHours && ` (${weeklyHours} hrs/week)`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-opacity"
            style={{
              outlineColor: 'var(--color-focus-ring)',
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.7'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            padding: 'var(--spacing-6)',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {/* Days to Plan Selector */}
          <div
            style={{
              marginBottom: 'var(--spacing-6)',
              padding: 'var(--spacing-4)',
              backgroundColor: 'var(--color-background)',
              borderRadius: 'var(--radius-card)',
            }}
          >
            <h3
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              Days to Plan
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              {/* Mode Selection */}
              <div style={{ display: 'flex', gap: 'var(--spacing-4)', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="daysMode"
                    value="entire-trip"
                    checked={daysMode === 'entire-trip'}
                    onChange={(e) => setDaysMode(e.target.value as DaysSelectionMode)}
                  />
                  <span style={{ color: 'var(--color-text-primary)' }}>Entire trip</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="daysMode"
                    value="date-range"
                    checked={daysMode === 'date-range'}
                    onChange={(e) => setDaysMode(e.target.value as DaysSelectionMode)}
                  />
                  <span style={{ color: 'var(--color-text-primary)' }}>Date range</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="daysMode"
                    value="select-days"
                    checked={daysMode === 'select-days'}
                    onChange={(e) => setDaysMode(e.target.value as DaysSelectionMode)}
                  />
                  <span style={{ color: 'var(--color-text-primary)' }}>Select days</span>
                </label>
              </div>

              {/* Date Range Inputs */}
              {daysMode === 'date-range' && (
                <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Start</span>
                    <input
                      type="date"
                      value={dateRangeStart}
                      min={trip.startDate}
                      max={trip.endDate}
                      onChange={(e) => setDateRangeStart(e.target.value)}
                      style={{
                        padding: 'var(--spacing-2)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>End</span>
                    <input
                      type="date"
                      value={dateRangeEnd}
                      min={trip.startDate}
                      max={trip.endDate}
                      onChange={(e) => setDateRangeEnd(e.target.value)}
                      style={{
                        padding: 'var(--spacing-2)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </label>
                </div>
              )}

              {/* Select Days Checkboxes */}
              {daysMode === 'select-days' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                    gap: 'var(--spacing-2)',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    padding: 'var(--spacing-2)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {allTripDates.current.map((date, idx) => {
                    return (
                      <label
                        key={date}
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDayCheckboxes.has(date)}
                          onChange={(e) => {
                            const newSet = new Set(selectedDayCheckboxes)
                            if (e.target.checked) {
                              newSet.add(date)
                            } else {
                              newSet.delete(date)
                            }
                            setSelectedDayCheckboxes(newSet)
                          }}
                        />
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                          Day {idx + 1}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}

              {/* Selected Dates Summary */}
              {selectedDates.length > 0 && (
                <div
                  style={{
                    padding: 'var(--spacing-3)',
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-1)' }}>
                    Selected: {selectedDates.length} day{selectedDates.length !== 1 ? 's' : ''}
                  </p>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                    {datesSummary.substring(0, 100)}
                    {datesSummary.length > 100 ? '...' : ''}
                  </p>
                </div>
              )}

              {/* Update Options Button */}
              <div style={{ display: 'flex', gap: 'var(--spacing-3)', alignItems: 'center' }}>
                <Button
                  variant="secondary"
                  onClick={handleUpdateOptions}
                  disabled={selectedDates.length === 0 || isLoadingDrafts}
                >
                  Update Options
                </Button>
                {selectedDates.length === 0 && (
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-error)' }}>
                    Please select at least one day to plan
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoadingDrafts && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 'var(--spacing-4)',
              }}
            >
              {[1, 2, 3].map((i) => (
                <Card key={i} style={{ padding: 'var(--spacing-4)', minHeight: '400px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                    <div
                      style={{
                        height: '24px',
                        width: '60%',
                        backgroundColor: 'var(--color-background)',
                        borderRadius: 'var(--radius-sm)',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      }}
                    />
                    <div
                      style={{
                        height: '16px',
                        width: '100%',
                        backgroundColor: 'var(--color-background)',
                        borderRadius: 'var(--radius-sm)',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      }}
                    />
                    <div
                      style={{
                        height: '16px',
                        width: '80%',
                        backgroundColor: 'var(--color-background)',
                        borderRadius: 'var(--radius-sm)',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !isLoadingDrafts && !drafts && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--spacing-12)',
                gap: 'var(--spacing-4)',
              }}
            >
              <p style={{ color: 'var(--color-text-error)', marginBottom: 'var(--spacing-2)' }}>{error}</p>
              <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                <Button variant="primary" onClick={handleUpdateOptions}>
                  Retry
                </Button>
                <Button variant="secondary" onClick={handleFallbackContinuous}>
                  Use Basic Continuous Pathway
                </Button>
              </div>
            </div>
          )}

          {/* Drafts Grid */}
          {drafts && drafts.length === 3 && !isLoadingDrafts && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'var(--spacing-4)',
              }}
              className="pathway-drafts-grid"
            >
              {drafts.map((draft) => {
                const displayDraft = getDisplayDraft(draft)
                const isSelected = selectedDraftId === draft.id
                const isEdited = !!draftEdits[draft.id]
                return (
                  <div
                    key={draft.id}
                    onClick={(e) => {
                      // Don't select if clicking the Edit button or radio button
                      const target = e.target as HTMLElement
                      if (target.closest('button')) {
                        return
                      }
                      setSelectedDraftId(draft.id)
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                  <Card
                    style={{
                      border: isSelected
                        ? '2px solid var(--color-primary)'
                        : '1px solid var(--color-border)',
                      backgroundColor: isSelected
                        ? 'var(--color-surface-hover)'
                        : 'var(--color-surface)',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ padding: 'var(--spacing-4)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 'var(--spacing-3)',
                        }}
                      >
                        <div 
                          style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flex: 1 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedDraftId(draft.id)
                          }}
                        >
                          <input
                            type="radio"
                            name="selectedDraft"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation()
                              setSelectedDraftId(draft.id)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ cursor: 'pointer', width: '20px', height: '20px' }}
                            aria-label={`Select ${displayDraft.title}`}
                          />
                          <h3
                            style={{
                              fontSize: 'var(--font-size-lg)',
                              fontWeight: 'var(--font-weight-semibold)',
                              color: 'var(--color-text-primary)',
                              flex: 1,
                            }}
                          >
                            {displayDraft.title}
                          </h3>
                        </div>
                        {isEdited && (
                          <span
                            style={{
                              fontSize: 'var(--font-size-xs)',
                              color: 'var(--color-primary)',
                              fontWeight: 'var(--font-weight-medium)',
                            }}
                          >
                            Edited
                          </span>
                        )}
                      </div>

                      <p
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-secondary)',
                          marginBottom: 'var(--spacing-3)',
                          lineHeight: 'var(--line-height-relaxed)',
                        }}
                      >
                        {displayDraft.overview}
                      </p>

                      <div
                        style={{
                          padding: 'var(--spacing-3)',
                          backgroundColor: 'var(--color-background)',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: 'var(--spacing-3)',
                        }}
                      >
                        <p
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--color-text-tertiary)',
                            marginBottom: 'var(--spacing-2)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Why It Fits
                        </p>
                        <p
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-text-secondary)',
                            lineHeight: 'var(--line-height-relaxed)',
                          }}
                        >
                          {displayDraft.whyItFits}
                        </p>
                      </div>

                      <div style={{ marginBottom: 'var(--spacing-3)', flex: 1 }}>
                        <p
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 'var(--font-weight-medium)',
                            color: 'var(--color-text-tertiary)',
                            marginBottom: 'var(--spacing-2)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          Day-by-Day Preview
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                          {displayDraft.days.slice(0, 3).map((day) => (
                            <div
                              key={day.day}
                              style={{
                                fontSize: 'var(--font-size-sm)',
                                color: 'var(--color-text-secondary)',
                                padding: 'var(--spacing-2)',
                                backgroundColor: 'var(--color-background)',
                                borderRadius: 'var(--radius-sm)',
                              }}
                            >
                              <span style={{ fontWeight: 'var(--font-weight-medium)' }}>Day {day.day}:</span>{' '}
                              {day.headline}
                            </div>
                          ))}
                          {displayDraft.days.length > 3 && (
                            <p
                              style={{
                                fontSize: 'var(--font-size-xs)',
                                color: 'var(--color-text-tertiary)',
                                fontStyle: 'italic',
                              }}
                            >
                              +{displayDraft.days.length - 3} more days
                            </p>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginTop: 'auto' }}>
                        <Button
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditDraft(draft.id)
                          }}
                          style={{ flex: 1 }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </Card>
                  </div>
                )
              })}
            </div>
          )}

          {/* Edit Draft Modal */}
          {editingDraftId && drafts && (
            <EditDraftModal
              draft={getDisplayDraft(drafts.find((d) => d.id === editingDraftId)!)}
              originalDraft={drafts.find((d) => d.id === editingDraftId)!}
              onSave={(edited) => handleSaveDraftEdit(editingDraftId, edited)}
              onDiscard={() => handleDiscardDraftEdit(editingDraftId)}
              onClose={() => setEditingDraftId(null)}
            />
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3"
          style={{
            padding: 'var(--spacing-6)',
            borderTop: '1px solid var(--color-border-subtle)',
            backgroundColor: 'var(--color-background)',
          }}
        >
          <Button
            variant="secondary"
            size="lg"
            onClick={onClose}
            disabled={isFinalizing}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleFinalize}
            disabled={!selectedDraftId || isFinalizing || isLoadingDrafts || selectedDates.length === 0}
          >
            Generate Detailed Plan
          </Button>
        </div>

        <style jsx>{`
          @media (max-width: 1023px) {
            .pathway-drafts-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
          @media (max-width: 640px) {
            .pathway-drafts-grid {
              grid-template-columns: 1fr !important;
            }
          }
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </div>
    </div>
    </>
  )
}

// Edit Draft Modal Component
interface EditDraftModalProps {
  draft: PathwayDraft
  originalDraft: PathwayDraft
  onSave: (edited: PathwayDraft) => void
  onDiscard: () => void
  onClose: () => void
}

function EditDraftModal({ draft, originalDraft, onSave, onDiscard, onClose }: EditDraftModalProps) {
  const [editedDraft, setEditedDraft] = useState<PathwayDraft>(draft)
  const modalRef = useRef<HTMLDivElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  // Focus trap and Esc key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    if (firstInputRef.current) {
      firstInputRef.current.focus()
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const handleSave = () => {
    onSave(editedDraft)
  }

  const handleDiscard = () => {
    setEditedDraft(originalDraft)
    onDiscard()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="max-w-2xl w-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          maxHeight: '90vh',
        }}
      >
        <div
          className="flex items-center justify-between"
          style={{
            padding: 'var(--spacing-6)',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          <h3
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
            }}
          >
            Edit Pathway: {draft.title}
          </h3>
          <button
            onClick={onClose}
            className="text-2xl leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              outlineColor: 'var(--color-focus-ring)',
              color: 'var(--color-text-secondary)',
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: 'var(--spacing-6)',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {/* Day Summaries */}
            <div>
              <h4
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--spacing-3)',
                }}
              >
                Day Summaries
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                {editedDraft.days.map((day, index) => (
                  <div
                    key={day.day}
                    style={{
                      padding: 'var(--spacing-4)',
                      backgroundColor: 'var(--color-background)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        Day {day.day} Headline
                      </span>
                      <input
                        ref={index === 0 ? firstInputRef : null}
                        type="text"
                        value={day.headline}
                        onChange={(e) => {
                          const updatedDays = [...editedDraft.days]
                          updatedDays[index] = { ...day, headline: e.target.value }
                          setEditedDraft({ ...editedDraft, days: updatedDays })
                        }}
                        style={{
                          padding: 'var(--spacing-2)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-2)' }}>
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        Day {day.day} Summary (optional)
                      </span>
                      <textarea
                        value={day.summary || ''}
                        onChange={(e) => {
                          const updatedDays = [...editedDraft.days]
                          updatedDays[index] = { ...day, summary: e.target.value }
                          setEditedDraft({ ...editedDraft, days: updatedDays })
                        }}
                        rows={3}
                        style={{
                          padding: 'var(--spacing-2)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text-primary)',
                          resize: 'vertical',
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Rationale */}
            <div>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                  Rationale (optional)
                </span>
                <textarea
                  value={editedDraft.rationale || ''}
                  onChange={(e) => setEditedDraft({ ...editedDraft, rationale: e.target.value })}
                  rows={4}
                  style={{
                    padding: 'var(--spacing-2)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                    resize: 'vertical',
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-3"
          style={{
            padding: 'var(--spacing-6)',
            borderTop: '1px solid var(--color-border-subtle)',
          }}
        >
          <Button variant="secondary" onClick={handleDiscard}>
            Discard
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
