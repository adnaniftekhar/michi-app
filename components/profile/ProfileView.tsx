'use client'

import { useState, useEffect } from 'react'
import type { LearnerProfile } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { InfoIcon } from '@/components/ui/Tooltip'
import { detectTimezone, durationToMinutes, interactionStyleToPreference } from '@/lib/profile/utils'
import { getUserSettings, updateUserSettings } from '@/lib/user-settings'

interface ProfileViewProps {
  profile: LearnerProfile
}

export function ProfileView({ profile }: ProfileViewProps) {
  const detectedTz = typeof window !== 'undefined' ? detectTimezone() : profile.timezone
  const sessionMinutes = (profile.preferences as any).preferredDurationMinutes || durationToMinutes(profile.preferences.preferredDuration)
  const interactionPref = (profile.preferences as any).interactionPreference || interactionStyleToPreference(profile.preferences.interactionStyle)
  const [showImagesAndMaps, setShowImagesAndMaps] = useState(true)

  useEffect(() => {
    const settings = getUserSettings()
    setShowImagesAndMaps(settings.showImagesAndMaps)
  }, [])

  const handleToggleImagesAndMaps = () => {
    const newValue = !showImagesAndMaps
    setShowImagesAndMaps(newValue)
    updateUserSettings({ showImagesAndMaps: newValue })
  }
  
  const interactionLabels: Record<string, string> = {
    'prefer-solo': 'Prefer Solo',
    'prefer-with-others': 'Prefer With Others',
    'either-works': 'Either Works',
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <h3
          className="font-semibold mb-4"
          style={{
            fontSize: 'var(--font-size-lg)',
            lineHeight: 'var(--line-height-tight)',
            color: 'var(--color-text-primary)',
          }}
        >
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Name
            </div>
            <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {profile.name}
            </div>
          </div>
          <div>
            <div className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Timezone
            </div>
            <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {profile.timezone}
              {profile.timezone === detectedTz && (
                <span className="ml-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  (Detected)
                </span>
              )}
            </div>
          </div>
          {(profile as any).ageBand && (
            <div>
              <div className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Age Band
              </div>
              <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {(profile as any).ageBand} years
              </div>
            </div>
          )}
          {(profile as any).languages && (profile as any).languages.length > 0 && (
            <div>
              <div className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Languages
              </div>
              <div className="flex flex-wrap gap-2">
                {((profile as any).languages as string[]).map((lang) => (
                  <Badge key={lang} variant="default">{lang}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
        {(profile as any).accessibilityNotes && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <div className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Accessibility Notes
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {(profile as any).accessibilityNotes}
            </div>
          </div>
        )}
      </Card>

      {/* Learning Rhythm */}
      <Card>
        <h3
          className="font-semibold mb-4"
          style={{
            fontSize: 'var(--font-size-lg)',
            lineHeight: 'var(--line-height-tight)',
            color: 'var(--color-text-primary)',
          }}
        >
          Learning Rhythm
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Preferred Times
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.preferences.preferredLearningTimes.map((time) => (
                <Badge key={time} variant="default">
                  {time.charAt(0).toUpperCase() + time.slice(1)}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Session Length
            </div>
            <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {sessionMinutes} minutes
            </div>
          </div>
          {(profile.preferences as any).energyPattern && (
            <div>
              <div className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Energy Pattern
              </div>
              <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {((profile.preferences as any).energyPattern as string).replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Curiosity */}
      <Card>
        <h3
          className="font-semibold mb-4"
          style={{
            fontSize: 'var(--font-size-lg)',
            lineHeight: 'var(--line-height-tight)',
            color: 'var(--color-text-primary)',
          }}
        >
          Interests & Goals
        </h3>
        <div className="space-y-4">
          <div>
            <div className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Interests
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.pblProfile.interests.map((interest) => (
                <Badge key={interest} variant="default">{interest}</Badge>
              ))}
            </div>
          </div>
          {(profile.pblProfile as any).dislikes && ((profile.pblProfile as any).dislikes as string[]).length > 0 && (
            <div>
              <div className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                Dislikes / Avoid
              </div>
              <div className="flex flex-wrap gap-2">
                {((profile.pblProfile as any).dislikes as string[]).map((dislike) => (
                  <Badge key={dislike} variant="danger">{dislike}</Badge>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm mb-1 flex items-center" style={{ color: 'var(--color-text-secondary)' }}>
                Current Level
                <InfoIcon
                  tooltipContent="Beginner: new to the topic; Intermediate: some familiarity; Advanced: comfortable exploring complex ideas. This level affects the complexity of suggested activities."
                  aria-label="Information about Current Level"
                />
              </div>
              <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {profile.pblProfile.currentLevel.charAt(0).toUpperCase() + profile.pblProfile.currentLevel.slice(1)}
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Learning Goals
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.pblProfile.learningGoals.map((goal) => (
                <Badge key={goal} variant="default">{goal}</Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Experiences */}
      <Card>
        <h3
          className="font-semibold mb-4"
          style={{
            fontSize: 'var(--font-size-lg)',
            lineHeight: 'var(--line-height-tight)',
            color: 'var(--color-text-primary)',
          }}
        >
          Field Experiences
        </h3>
        <div>
          <div className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Preferred Field Experiences
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.experientialProfile.preferredFieldExperiences.map((exp) => (
              <Badge key={exp} variant="default">{exp}</Badge>
            ))}
          </div>
        </div>
      </Card>

      {/* Projects */}
      <Card>
        <h3
          className="font-semibold mb-4"
          style={{
            fontSize: 'var(--font-size-lg)',
            lineHeight: 'var(--line-height-tight)',
            color: 'var(--color-text-primary)',
          }}
        >
          Projects & Reflection
        </h3>
        <div className="space-y-4">
          <div>
            <div className="text-sm mb-2 flex items-center" style={{ color: 'var(--color-text-secondary)' }}>
              Preferred Artifact Types
              <InfoIcon
                tooltipContent="Written artifacts include journals and essays; Visual artifacts include drawings and photos; Audio artifacts include recordings and podcasts; Multimedia combines multiple formats."
                aria-label="Information about Preferred Artifact Types"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.pblProfile.preferredArtifactTypes.map((type) => (
                <Badge key={type} variant="default">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm mb-2 flex items-center" style={{ color: 'var(--color-text-secondary)' }}>
              Reflection Styles
              <InfoIcon
                tooltipContent="Journal: written reflections; Discussion: talking through ideas; Artistic: creative expression; Analytical: structured analysis. Choose styles that align with your child's preferences."
                aria-label="Information about Reflection Styles"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {((profile.experientialProfile as any).reflectionStyles || [profile.experientialProfile.reflectionStyle]).map((style: string) => (
                <Badge key={style} variant="default">
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm mb-1 flex items-center" style={{ color: 'var(--color-text-secondary)' }}>
              Inquiry Approach
              <InfoIcon
                tooltipContent="Structured: guided activities with clear steps; Guided: some structure with flexibility; Open-ended: more exploratory learning. This affects how learning tasks are designed."
                aria-label="Information about Inquiry Approach"
              />
            </div>
            <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {profile.experientialProfile.inquiryApproach.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
          </div>
        </div>
      </Card>

      {/* Social */}
      <Card>
        <h3
          className="font-semibold mb-4"
          style={{
            fontSize: 'var(--font-size-lg)',
            lineHeight: 'var(--line-height-tight)',
            color: 'var(--color-text-primary)',
          }}
        >
          Social Preferences
        </h3>
        <div className="space-y-4">
          <div>
            <div className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Collaboration Preference
            </div>
            <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {interactionLabels[interactionPref] || profile.preferences.interactionStyle.charAt(0).toUpperCase() + profile.preferences.interactionStyle.slice(1)}
            </div>
          </div>
          {(profile as any).socialPreferences?.collaborationNotes && (
            <div>
              <div className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Collaboration Notes
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {(profile as any).socialPreferences.collaborationNotes}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Settings */}
      <Card>
        <h3
          className="font-semibold mb-4"
          style={{
            fontSize: 'var(--font-size-lg)',
            lineHeight: 'var(--line-height-tight)',
            color: 'var(--color-text-primary)',
          }}
        >
          Display Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>
                Show images and maps
              </div>
              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Display activity images and map icons in learning pathways
              </div>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showImagesAndMaps}
                onChange={handleToggleImagesAndMaps}
                className="sr-only"
              />
              <div
                className="relative w-11 h-6 rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  backgroundColor: showImagesAndMaps ? 'var(--color-michi-green)' : 'var(--color-border)',
                  outlineColor: 'var(--color-focus-ring)',
                }}
              >
                <div
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform bg-white"
                  style={{
                    transform: showImagesAndMaps ? 'translateX(20px)' : 'translateX(0)',
                  }}
                />
              </div>
            </label>
          </div>
        </div>
      </Card>
    </div>
  )
}

