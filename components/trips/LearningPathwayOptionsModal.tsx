'use client'

import { useState, useMemo, useEffect } from 'react'
import type { Trip, LearningTarget, LearnerProfile } from '@/types'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Section } from '../ui/Section'
import { getUserSettings } from '@/lib/user-settings'

export type GenerationMode = 'entire-trip' | 'day-by-day' | 'custom-range'

export interface PathwayGenerationOptions {
  generationMode: GenerationMode
  selectedDays: string[] // ISO date strings
  effortTrack: LearningTarget['track']
  weeklyHours?: number
  includeImages: boolean
  includeMaps: boolean
  profileOverrides: {
    currentLevel?: LearnerProfile['pblProfile']['currentLevel']
    preferredArtifactTypes?: LearnerProfile['pblProfile']['preferredArtifactTypes']
    reflectionStyle?: LearnerProfile['experientialProfile']['reflectionStyle']
  }
}

interface LearningPathwayOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (options: PathwayGenerationOptions) => void
  trip: Trip
  learnerProfile: LearnerProfile
  defaultLearningTarget?: LearningTarget
}

export function LearningPathwayOptionsModal({
  isOpen,
  onClose,
  onGenerate,
  trip,
  learnerProfile,
  defaultLearningTarget,
}: LearningPathwayOptionsModalProps) {
  const userSettings = getUserSettings()
  
  // Get all trip dates
  const tripDates = useMemo(() => {
    const dates: string[] = []
    const start = new Date(trip.startDate)
    const end = new Date(trip.endDate)
    const current = new Date(start)
    
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }
    
    return dates
  }, [trip.startDate, trip.endDate])

  // Initialize state
  const [generationMode, setGenerationMode] = useState<GenerationMode>('entire-trip')
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [effortTrack, setEffortTrack] = useState<LearningTarget['track']>(
    defaultLearningTarget?.track || '15min'
  )
  const [weeklyHours, setWeeklyHours] = useState<number>(defaultLearningTarget?.weeklyHours || 0)
  const [includeImages, setIncludeImages] = useState(userSettings.showImagesAndMaps)
  const [includeMaps, setIncludeMaps] = useState(userSettings.showImagesAndMaps)
  const [profileOverrides, setProfileOverrides] = useState<PathwayGenerationOptions['profileOverrides']>({})

  // Initialize selected days based on mode
  useEffect(() => {
    if (generationMode === 'entire-trip') {
      setSelectedDays(tripDates)
    } else if (generationMode === 'day-by-day') {
      // Only first day selected by default
      setSelectedDays(tripDates.length > 0 ? [tripDates[0]] : [])
    } else if (generationMode === 'custom-range') {
      // All days selected for custom range (user can deselect)
      setSelectedDays([...tripDates])
    }
  }, [generationMode, tripDates])

  // Calculate preview stats
  const previewStats = useMemo(() => {
    const numDays = selectedDays.length
    const dailyMinutes = {
      '15min': 15,
      '60min': 60,
      '4hrs': 240,
      'weekly': weeklyHours > 0 ? Math.ceil((weeklyHours * 60) / numDays) : 0,
    }
    
    const estimatedMinutes = dailyMinutes[effortTrack] * numDays
    const estimatedActivities = numDays // One activity per day typically
    
    const warnings: string[] = []
    if (effortTrack === '4hrs' && numDays < 2) {
      warnings.push('4 hours/day may be too intensive for a single day')
    }
    if (effortTrack === 'weekly' && weeklyHours === 0) {
      warnings.push('Please specify weekly hours')
    }
    if (selectedDays.length === 0) {
      warnings.push('Please select at least one day')
    }

    return {
      numDays,
      estimatedActivities,
      estimatedMinutes,
      estimatedHours: Math.round(estimatedMinutes / 60 * 10) / 10,
      warnings,
    }
  }, [selectedDays, effortTrack, weeklyHours])

  const handleDayToggle = (date: string) => {
    if (generationMode === 'entire-trip') return
    
    setSelectedDays((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date]
    )
  }

  const handleGenerate = () => {
    if (selectedDays.length === 0) {
      return
    }
    
    const options: PathwayGenerationOptions = {
      generationMode,
      selectedDays: selectedDays.sort(),
      effortTrack,
      weeklyHours: effortTrack === 'weekly' ? weeklyHours : undefined,
      includeImages,
      includeMaps,
      profileOverrides,
    }
    
    onGenerate(options)
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatDateShort = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div
        className="max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
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
                fontSize: 'var(--font-size-xl)',
                lineHeight: 'var(--line-height-tight)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--spacing-1)',
              }}
            >
              Generate Learning Pathway
            </h2>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {trip.title} • {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
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
        <div className="flex-1 overflow-y-auto" style={{ padding: 'var(--spacing-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
            {/* Generation Mode */}
            <Section title="Generation Mode">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="generationMode"
                    value="entire-trip"
                    checked={generationMode === 'entire-trip'}
                    onChange={(e) => setGenerationMode(e.target.value as GenerationMode)}
                    className="mt-1"
                    style={{ accentColor: 'var(--color-michi-green)' }}
                  />
                  <div className="flex-1">
                    <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                      Entire trip
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-1)' }}>
                      Generate activities for all days in the trip
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="generationMode"
                    value="day-by-day"
                    checked={generationMode === 'day-by-day'}
                    onChange={(e) => setGenerationMode(e.target.value as GenerationMode)}
                    className="mt-1"
                    style={{ accentColor: 'var(--color-michi-green)' }}
                  />
                  <div className="flex-1">
                    <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                      Day by day
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-1)' }}>
                      Select specific days to include
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="generationMode"
                    value="custom-range"
                    checked={generationMode === 'custom-range'}
                    onChange={(e) => setGenerationMode(e.target.value as GenerationMode)}
                    className="mt-1"
                    style={{ accentColor: 'var(--color-michi-green)' }}
                  />
                  <div className="flex-1">
                    <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                      Custom range
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-1)' }}>
                      Select a contiguous range of days
                    </div>
                  </div>
                </label>
              </div>

              {/* Day Selection */}
              {(generationMode === 'day-by-day' || generationMode === 'custom-range') && (
                <div
                  style={{
                    marginTop: 'var(--spacing-4)',
                    padding: 'var(--spacing-4)',
                    borderRadius: 'var(--radius-card)',
                    backgroundColor: 'var(--color-background)',
                    border: '1px solid var(--color-border-subtle)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-text-secondary)',
                      marginBottom: 'var(--spacing-3)',
                    }}
                  >
                    Select days ({selectedDays.length} of {tripDates.length})
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                      gap: 'var(--spacing-2)',
                    }}
                  >
                    {tripDates.map((date) => (
                      <label
                        key={date}
                        className="flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors"
                        style={{
                          backgroundColor: selectedDays.includes(date)
                            ? 'var(--color-surface-hover)'
                            : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedDays.includes(date)) {
                            e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedDays.includes(date)) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDays.includes(date)}
                          onChange={() => handleDayToggle(date)}
                          style={{ accentColor: 'var(--color-michi-green)' }}
                        />
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                          {formatDateShort(date)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </Section>

            {/* Effort Track */}
            <Section title="Effort Track">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                {(['15min', '60min', '4hrs', 'weekly'] as const).map((track) => (
                  <label key={track} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="effortTrack"
                      value={track}
                      checked={effortTrack === track}
                      onChange={() => setEffortTrack(track)}
                      className="mt-1"
                      style={{ accentColor: 'var(--color-michi-green)' }}
                    />
                    <div className="flex-1">
                      <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                        {track === '15min' && '15 min/day'}
                        {track === '60min' && '60 min/day'}
                        {track === '4hrs' && '4 hrs/day'}
                        {track === 'weekly' && 'Weekly hours'}
                      </div>
                    </div>
                  </label>
                ))}
                
                {effortTrack === 'weekly' && (
                  <div style={{ marginLeft: '28px', marginTop: 'var(--spacing-2)' }}>
                    <label className="flex items-center gap-2">
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        Hours per week:
                      </span>
                      <input
                        type="number"
                        min="1"
                        max="40"
                        value={weeklyHours}
                        onChange={(e) => setWeeklyHours(parseInt(e.target.value) || 0)}
                        style={{
                          width: '80px',
                          padding: 'var(--spacing-2)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-background)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </Section>

            {/* Visual Content Toggles */}
            <Section title="Visual Content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-1)' }}>
                      Include images
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                      Each activity will display a representative image with alt text
                    </div>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeImages}
                      onChange={(e) => setIncludeImages(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className="relative w-11 h-6 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        backgroundColor: includeImages ? 'var(--color-michi-green)' : 'var(--color-border)',
                        outlineColor: 'var(--color-focus-ring)',
                      }}
                    >
                      <div
                        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform bg-white"
                        style={{
                          transform: includeImages ? 'translateX(20px)' : 'translateX(0)',
                        }}
                      />
                    </div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)', marginBottom: 'var(--spacing-1)' }}>
                      Include maps
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                      Show approximate locations (city-level only for privacy)
                    </div>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeMaps}
                      onChange={(e) => setIncludeMaps(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className="relative w-11 h-6 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        backgroundColor: includeMaps ? 'var(--color-michi-green)' : 'var(--color-border)',
                        outlineColor: 'var(--color-focus-ring)',
                      }}
                    >
                      <div
                        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform bg-white"
                        style={{
                          transform: includeMaps ? 'translateX(20px)' : 'translateX(0)',
                        }}
                      />
                    </div>
                  </label>
                </div>
              </div>
            </Section>

            {/* Profile Preferences Review */}
            <Section title="Profile Preferences">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
                {/* Current Level */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)' }}>
                      Current Level
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        // Open edit dialog for level
                        const levels: LearnerProfile['pblProfile']['currentLevel'][] = ['beginner', 'intermediate', 'advanced']
                        const current = profileOverrides.currentLevel || learnerProfile.pblProfile.currentLevel
                        const nextIndex = (levels.indexOf(current) + 1) % levels.length
                        setProfileOverrides({ ...profileOverrides, currentLevel: levels[nextIndex] })
                      }}
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-michi-green)',
                        textDecoration: 'underline',
                      }}
                    >
                      Edit for this trip
                    </button>
                  </div>
                  <div style={{ color: 'var(--color-text-primary)' }}>
                    {(profileOverrides.currentLevel || learnerProfile.pblProfile.currentLevel).charAt(0).toUpperCase() +
                      (profileOverrides.currentLevel || learnerProfile.pblProfile.currentLevel).slice(1)}
                  </div>
                </div>

                {/* Preferred Artifact Types */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)' }}>
                      Preferred Artifact Types
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        // Toggle between artifact types
                        const types: LearnerProfile['pblProfile']['preferredArtifactTypes'] = ['written', 'visual', 'audio', 'multimedia']
                        const current = profileOverrides.preferredArtifactTypes || learnerProfile.pblProfile.preferredArtifactTypes
                        // Simple toggle: if written, switch to visual; otherwise switch to written
                        const newTypes = current.includes('written') 
                          ? ['visual'] 
                          : ['written']
                        setProfileOverrides({ ...profileOverrides, preferredArtifactTypes: newTypes })
                      }}
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-michi-green)',
                        textDecoration: 'underline',
                      }}
                    >
                      Edit for this trip
                    </button>
                  </div>
                  <div style={{ color: 'var(--color-text-primary)' }}>
                    {(profileOverrides.preferredArtifactTypes || learnerProfile.pblProfile.preferredArtifactTypes)
                      .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
                      .join(', ')}
                  </div>
                </div>

                {/* Reflection Style */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)' }}>
                      Reflection Style
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const styles: LearnerProfile['experientialProfile']['reflectionStyle'][] = ['journal', 'discussion', 'artistic', 'analytical']
                        const current = profileOverrides.reflectionStyle || learnerProfile.experientialProfile.reflectionStyle
                        const nextIndex = (styles.indexOf(current) + 1) % styles.length
                        setProfileOverrides({ ...profileOverrides, reflectionStyle: styles[nextIndex] })
                      }}
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-michi-green)',
                        textDecoration: 'underline',
                      }}
                    >
                      Edit for this trip
                    </button>
                  </div>
                  <div style={{ color: 'var(--color-text-primary)' }}>
                    {(profileOverrides.reflectionStyle || learnerProfile.experientialProfile.reflectionStyle)
                      .charAt(0).toUpperCase() +
                      (profileOverrides.reflectionStyle || learnerProfile.experientialProfile.reflectionStyle).slice(1)}
                  </div>
                </div>
              </div>
            </Section>

            {/* Preview & Adjust */}
            <Section title="Preview">
              <Card>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Selected days:</span>
                    <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                      {previewStats.numDays}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Estimated activities:</span>
                    <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                      {previewStats.estimatedActivities}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Estimated time:</span>
                    <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                      {previewStats.estimatedHours} hours
                    </span>
                  </div>
                  
                  {previewStats.warnings.length > 0 && (
                    <div
                      style={{
                        marginTop: 'var(--spacing-2)',
                        padding: 'var(--spacing-3)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      {previewStats.warnings.map((warning, idx) => (
                        <div key={idx} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                          ⚠️ {warning}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </Section>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3"
          style={{
            padding: 'var(--spacing-6)',
            borderTop: '1px solid var(--color-border-subtle)',
          }}
        >
          <Button variant="tertiary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={selectedDays.length === 0 || (effortTrack === 'weekly' && weeklyHours === 0)}
          >
            Generate Pathway
          </Button>
        </div>
      </div>
    </div>
  )
}
