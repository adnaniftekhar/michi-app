'use client'

import type { LearnerProfile } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { detectTimezone, durationToMinutes, interactionStyleToPreference } from '@/lib/profile/utils'

interface ProfileViewProps {
  profile: LearnerProfile
}

export function ProfileView({ profile }: ProfileViewProps) {
  const detectedTz = typeof window !== 'undefined' ? detectTimezone() : profile.timezone
  const sessionMinutes = (profile.preferences as any).preferredDurationMinutes || durationToMinutes(profile.preferences.preferredDuration)
  const interactionPref = (profile.preferences as any).interactionPreference || interactionStyleToPreference(profile.preferences.interactionStyle)
  
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
              <div className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Current Level
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
            <div className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Preferred Artifact Types
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
            <div className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Reflection Styles
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
            <div className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Inquiry Approach
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
    </div>
  )
}

