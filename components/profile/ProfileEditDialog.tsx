'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { LearnerProfile } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { TagInput } from './inputs/TagInput'
import { TimezoneCombobox } from './inputs/TimezoneCombobox'
import { SessionLengthSlider } from './inputs/SessionLengthSlider'
import { detectTimezone, durationToMinutes, minutesToDuration, interactionStyleToPreference, preferenceToInteractionStyle } from '@/lib/profile/utils'
import { Badge } from '@/components/ui/Badge'

interface ProfileEditDialogProps {
  isOpen: boolean
  onClose: () => void
  profile: LearnerProfile
  onSave: (profile: LearnerProfile) => void
}

type FormData = {
  name: string
  timezone: string
  timezoneOverride: boolean
  ageBand?: '5-8' | '9-12' | '13-16' | '17-20' | '21+'
  languages: string[]
  accessibilityNotes?: string
  preferredLearningTimes: string[]
  preferredDurationMinutes: number
  interactionPreference: 'prefer-solo' | 'prefer-with-others' | 'either-works'
  energyPattern?: 'morning' | 'afternoon' | 'evening-flexible'
  contentFormat: string[]
  interests: string[]
  dislikes: string[]
  currentLevel: 'beginner' | 'intermediate' | 'advanced'
  learningGoals: string[]
  preferredArtifactTypes: string[]
  preferredFieldExperiences: string[]
  reflectionStyles: string[]
  inquiryApproach: 'structured' | 'open-ended' | 'guided'
  collaborationNotes?: string
}

const STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'rhythm', label: 'Rhythm' },
  { id: 'curiosity', label: 'Curiosity' },
  { id: 'experiences', label: 'Experiences' },
  { id: 'projects', label: 'Projects' },
  { id: 'social', label: 'Social' },
]

export function ProfileEditDialog({ isOpen, onClose, profile, onSave }: ProfileEditDialogProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [timezoneOverride, setTimezoneOverride] = useState(false)
  const [detectedTz, setDetectedTz] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      setDetectedTz(detectTimezone())
    }
  }, [isOpen])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: profile.name,
      timezone: profile.timezone || detectTimezone(),
      timezoneOverride: false,
      ageBand: (profile as any).ageBand,
      languages: (profile as any).languages || [],
      accessibilityNotes: (profile as any).accessibilityNotes,
      preferredLearningTimes: profile.preferences.preferredLearningTimes,
      preferredDurationMinutes: (profile.preferences as any).preferredDurationMinutes || durationToMinutes(profile.preferences.preferredDuration),
      interactionPreference: (profile.preferences as any).interactionPreference || interactionStyleToPreference(profile.preferences.interactionStyle),
      energyPattern: (profile.preferences as any).energyPattern,
      contentFormat: profile.preferences.contentFormat,
      interests: profile.pblProfile.interests,
      dislikes: (profile.pblProfile as any).dislikes || [],
      currentLevel: profile.pblProfile.currentLevel,
      learningGoals: profile.pblProfile.learningGoals,
      preferredArtifactTypes: profile.pblProfile.preferredArtifactTypes,
      preferredFieldExperiences: profile.experientialProfile.preferredFieldExperiences,
      reflectionStyles: (profile.experientialProfile as any).reflectionStyles || [profile.experientialProfile.reflectionStyle],
      inquiryApproach: profile.experientialProfile.inquiryApproach,
      collaborationNotes: (profile as any).socialPreferences?.collaborationNotes,
    },
  })

  const onSubmit = (data: FormData) => {
    const updatedProfile: LearnerProfile = {
      name: data.name,
      timezone: data.timezone,
      ageBand: data.ageBand,
      languages: data.languages,
      accessibilityNotes: data.accessibilityNotes,
      preferences: {
        preferredLearningTimes: data.preferredLearningTimes,
        preferredDuration: minutesToDuration(data.preferredDurationMinutes), // Keep for backward compat
        preferredDurationMinutes: data.preferredDurationMinutes,
        interactionStyle: preferenceToInteractionStyle(data.interactionPreference), // Keep for backward compat
        interactionPreference: data.interactionPreference,
        energyPattern: data.energyPattern,
        contentFormat: data.contentFormat as any,
      },
      constraints: profile.constraints,
      pblProfile: {
        interests: data.interests,
        dislikes: data.dislikes,
        currentLevel: data.currentLevel,
        learningGoals: data.learningGoals,
        preferredArtifactTypes: data.preferredArtifactTypes as any,
      },
      experientialProfile: {
        preferredFieldExperiences: data.preferredFieldExperiences,
        reflectionStyle: data.reflectionStyles[0] || 'journal', // Keep for backward compat
        reflectionStyles: data.reflectionStyles,
        inquiryApproach: data.inquiryApproach,
      },
      socialPreferences: {
        collaborationNotes: data.collaborationNotes,
      },
    }
    onSave(updatedProfile)
    onClose()
  }

  if (!isOpen) return null

  const currentStepData = STEPS[currentStep]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15, 20, 25, 0.75)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-surface)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-8 py-6 border-b sticky top-0 bg-white z-10"
          style={{ 
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
          }}
        >
          <div>
            <h2
              className="font-semibold mb-1"
              style={{
                fontSize: '24px',
                lineHeight: '1.3',
                color: 'var(--color-text-primary)',
                fontWeight: '600',
              }}
            >
              Edit Learner Profile
            </h2>
            <p
              className="text-sm"
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '14px',
              }}
            >
              Step {currentStep + 1} of {STEPS.length}: {currentStepData.label}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none hover:opacity-70 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg p-1"
            style={{ 
              color: 'var(--color-text-secondary)',
              outlineColor: 'var(--color-focus-ring)',
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-8 py-4 border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <div className="flex items-center gap-2">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(idx)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                  style={{
                    backgroundColor: idx === currentStep ? 'var(--color-michi-green)' : 'transparent',
                    color: idx === currentStep ? 'var(--color-background)' : 'var(--color-text-secondary)',
                    outlineColor: 'var(--color-focus-ring)',
                  }}
                >
                  {step.label}
                </button>
                {idx < STEPS.length - 1 && (
                  <span className="mx-1" style={{ color: 'var(--color-text-secondary)' }}>→</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="px-8 py-6 space-y-6">
            {currentStep === 0 && (
              <div className="space-y-6">
                <div>
                  <h3
                    className="font-semibold mb-4"
                    style={{
                      fontSize: '18px',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    <Input
                      label="Name"
                      {...register('name', { required: true })}
                      error={errors.name?.message}
                      required
                    />
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label
                          className="block font-medium"
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          Timezone
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={timezoneOverride}
                            onChange={(e) => {
                              setTimezoneOverride(e.target.checked)
                              if (!e.target.checked) {
                                setValue('timezone', detectedTz)
                              }
                            }}
                            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                            style={{ outlineColor: 'var(--color-focus-ring)' }}
                          />
                          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                            Override timezone
                          </span>
                        </label>
                      </div>
                      {!timezoneOverride ? (
                        <div
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: 'var(--color-background)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          <span className="text-sm">Detected: </span>
                          <span className="font-medium">{detectedTz}</span>
                        </div>
                      ) : (
                        <TimezoneCombobox
                          value={watch('timezone')}
                          onChange={(tz) => setValue('timezone', tz)}
                          detectedTimezone={detectedTz}
                        />
                      )}
                      <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        AI uses this to schedule learning blocks at appropriate local times.
                      </p>
                    </div>
                    <div>
                      <Select
                        label="Age Band"
                        value={watch('ageBand') || ''}
                        onChange={(e) => setValue('ageBand', e.target.value as any)}
                        options={[
                          { value: '5-8', label: '5-8 years' },
                          { value: '9-12', label: '9-12 years' },
                          { value: '13-16', label: '13-16 years' },
                          { value: '17-20', label: '17-20 years' },
                          { value: '21+', label: '21+ years' },
                        ]}
                      />
                      <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        AI uses this to adjust complexity and engagement level.
                      </p>
                    </div>
                    <TagInput
                      label="Languages"
                      value={watch('languages') || []}
                      onChange={(langs) => setValue('languages', langs)}
                      placeholder="Add languages (e.g., English, Spanish)"
                      helperText="Languages the learner speaks or is learning"
                    />
                    <div>
                      <label
                        className="block mb-2 font-medium"
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        Accessibility Notes
                      </label>
                      <textarea
                        {...register('accessibilityNotes')}
                        rows={3}
                        placeholder="Any accessibility needs or accommodations..."
                        className="w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
                        style={{
                          padding: '12px 16px',
                          fontSize: 'var(--font-size-base)',
                          lineHeight: 'var(--line-height-normal)',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-background)',
                          color: 'var(--color-text-primary)',
                          outlineColor: 'var(--color-focus-ring)',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3
                    className="font-semibold mb-4"
                    style={{
                      fontSize: '18px',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Learning Rhythm
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label
                        className="block mb-2 font-medium"
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        Preferred Time of Day
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['morning', 'afternoon', 'evening'].map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => {
                              const current = watch('preferredLearningTimes') || []
                              const newTimes = current.includes(time)
                                ? current.filter(t => t !== time)
                                : [...current, time]
                              setValue('preferredLearningTimes', newTimes)
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                            style={{
                              backgroundColor: (watch('preferredLearningTimes') || []).includes(time)
                                ? 'var(--color-michi-green)'
                                : 'var(--color-background)',
                              color: (watch('preferredLearningTimes') || []).includes(time)
                                ? 'var(--color-background)'
                                : 'var(--color-text-primary)',
                              border: '1px solid var(--color-border)',
                              outlineColor: 'var(--color-focus-ring)',
                            }}
                          >
                            {time.charAt(0).toUpperCase() + time.slice(1)}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        AI uses this to schedule learning blocks at optimal times.
                      </p>
                    </div>
                    <SessionLengthSlider
                      value={watch('preferredDurationMinutes') || 60}
                      onChange={(minutes) => setValue('preferredDurationMinutes', minutes)}
                    />
                    <div>
                      <label
                        className="block mb-2 font-medium"
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        Energy Pattern
                      </label>
                      <Select
                        {...register('energyPattern')}
                        options={[
                          { value: 'morning', label: 'Morning person (most alert in AM)' },
                          { value: 'afternoon', label: 'Afternoon person (most alert in PM)' },
                          { value: 'evening-flexible', label: 'Evening or flexible' },
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3
                    className="font-semibold mb-4"
                    style={{
                      fontSize: '18px',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Interests & Goals
                  </h3>
                  <div className="space-y-6">
                    <TagInput
                      label="Interests"
                      value={watch('interests') || []}
                      onChange={(interests) => setValue('interests', interests)}
                      placeholder="Add interests (e.g., history, science, art)"
                      helperText="AI uses this to suggest relevant learning topics and field experiences."
                    />
                    <TagInput
                      label="Dislikes / Avoid"
                      value={watch('dislikes') || []}
                      onChange={(dislikes) => setValue('dislikes', dislikes)}
                      placeholder="Things to avoid (e.g., crowded places, loud noises)"
                      helperText="AI will avoid suggesting activities related to these."
                    />
                    <div>
                      <Select
                        label="Current Level"
                        value={watch('currentLevel')}
                        onChange={(e) => setValue('currentLevel', e.target.value as any)}
                        options={[
                          { value: 'beginner', label: 'Beginner' },
                          { value: 'intermediate', label: 'Intermediate' },
                          { value: 'advanced', label: 'Advanced' },
                        ]}
                        required
                      />
                      <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        AI uses this to adjust complexity and depth of learning activities.
                      </p>
                    </div>
                    <TagInput
                      label="Learning Goals"
                      value={watch('learningGoals') || []}
                      onChange={(goals) => setValue('learningGoals', goals)}
                      placeholder="Add learning goals (e.g., fluency in Spanish, understand local history)"
                      helperText="AI uses this to align learning activities with your objectives."
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3
                    className="font-semibold mb-4"
                    style={{
                      fontSize: '18px',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Field Experiences
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label
                        className="block mb-2 font-medium"
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        Preferred Field Experiences
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {['museums', 'nature', 'markets', 'historical sites', 'cultural events', 'labs', 'workshops'].map((exp) => (
                          <button
                            key={exp}
                            type="button"
                            onClick={() => {
                              const current = watch('preferredFieldExperiences') || []
                              const newExps = current.includes(exp)
                                ? current.filter(e => e !== exp)
                                : [...current, exp]
                              setValue('preferredFieldExperiences', newExps)
                            }}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                            style={{
                              backgroundColor: (watch('preferredFieldExperiences') || []).includes(exp)
                                ? 'var(--color-michi-green)'
                                : 'var(--color-background)',
                              color: (watch('preferredFieldExperiences') || []).includes(exp)
                                ? 'var(--color-background)'
                                : 'var(--color-text-primary)',
                              border: '1px solid var(--color-border)',
                              outlineColor: 'var(--color-focus-ring)',
                            }}
                          >
                            {exp}
                          </button>
                        ))}
                      </div>
                      <TagInput
                        value={watch('preferredFieldExperiences') || []}
                        onChange={(exps) => setValue('preferredFieldExperiences', exps)}
                        placeholder="Or add custom field experiences"
                        helperText="AI uses this to suggest relevant real-world learning opportunities."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3
                    className="font-semibold mb-4"
                    style={{
                      fontSize: '18px',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Projects & Reflection
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label
                        className="block mb-2 font-medium"
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        Preferred Artifact Types
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['written', 'visual', 'audio', 'multimedia'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              const current = watch('preferredArtifactTypes') || []
                              const newTypes = current.includes(type)
                                ? current.filter(t => t !== type)
                                : [...current, type]
                              setValue('preferredArtifactTypes', newTypes)
                            }}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                            style={{
                              backgroundColor: (watch('preferredArtifactTypes') || []).includes(type)
                                ? 'var(--color-michi-green)'
                                : 'var(--color-background)',
                              color: (watch('preferredArtifactTypes') || []).includes(type)
                                ? 'var(--color-background)'
                                : 'var(--color-text-primary)',
                              border: '1px solid var(--color-border)',
                              outlineColor: 'var(--color-focus-ring)',
                            }}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        AI uses this to suggest appropriate project outputs.
                      </p>
                    </div>
                    <div>
                      <label
                        className="block mb-2 font-medium"
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        Reflection Styles
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['journal', 'discussion', 'artistic', 'analytical'].map((style) => (
                          <button
                            key={style}
                            type="button"
                            onClick={() => {
                              const current = watch('reflectionStyles') || []
                              const newStyles = current.includes(style)
                                ? current.filter(s => s !== style)
                                : [...current, style]
                              setValue('reflectionStyles', newStyles)
                            }}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                            style={{
                              backgroundColor: (watch('reflectionStyles') || []).includes(style)
                                ? 'var(--color-michi-green)'
                                : 'var(--color-background)',
                              color: (watch('reflectionStyles') || []).includes(style)
                                ? 'var(--color-background)'
                                : 'var(--color-text-primary)',
                              border: '1px solid var(--color-border)',
                              outlineColor: 'var(--color-focus-ring)',
                            }}
                          >
                            {style.charAt(0).toUpperCase() + style.slice(1)}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        AI uses this to craft appropriate reflection prompts.
                      </p>
                    </div>
                    <div>
                      <Select
                        label="Inquiry Approach"
                        value={watch('inquiryApproach')}
                        onChange={(e) => setValue('inquiryApproach', e.target.value as any)}
                        options={[
                          { value: 'structured', label: 'Structured (clear steps and guidance)' },
                          { value: 'guided', label: 'Guided (some structure with flexibility)' },
                          { value: 'open-ended', label: 'Open-ended (explore freely)' },
                        ]}
                        required
                      />
                      <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        AI uses this to design inquiry tasks with appropriate structure.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h3
                    className="font-semibold mb-4"
                    style={{
                      fontSize: '18px',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Social Preferences
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label
                        className="block mb-2 font-medium"
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        Collaboration Preference
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: 'prefer-solo', label: 'Prefer Solo', helper: 'Works best independently' },
                          { value: 'prefer-with-others', label: 'Prefer With Others', helper: 'Thrives in group settings' },
                          { value: 'either-works', label: 'Either Works', helper: 'Comfortable with both approaches' },
                        ].map((option) => (
                          <label
                            key={option.value}
                            className="flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2"
                            style={{
                              borderColor: watch('interactionPreference') === option.value ? 'var(--color-michi-green)' : 'var(--color-border)',
                              backgroundColor: watch('interactionPreference') === option.value ? 'rgba(111, 191, 154, 0.1)' : 'transparent',
                              outlineColor: 'var(--color-focus-ring)',
                            }}
                          >
                            <input
                              type="radio"
                              checked={watch('interactionPreference') === option.value}
                              onChange={() => setValue('interactionPreference', option.value)}
                              className="mt-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                              style={{ outlineColor: 'var(--color-focus-ring)' }}
                            />
                            <div className="flex-1">
                              <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                                {option.label}
                              </div>
                              <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                {option.helper}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                      <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        AI uses this to choose independent vs group-friendly activities.
                      </p>
                    </div>
                    <div>
                      <label
                        className="block mb-2 font-medium"
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        Collaboration Notes (Optional)
                      </label>
                      <textarea
                        {...register('collaborationNotes')}
                        rows={3}
                        placeholder="Any additional notes about collaboration preferences..."
                        className="w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
                        style={{
                          padding: '12px 16px',
                          fontSize: 'var(--font-size-base)',
                          lineHeight: 'var(--line-height-normal)',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-background)',
                          color: 'var(--color-text-primary)',
                          outlineColor: 'var(--color-focus-ring)',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-8 py-6 border-t sticky bottom-0"
            style={{ 
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
          >
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
              >
                Cancel
              </Button>
              {currentStep < STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                >
                  Next
                </Button>
              ) : (
                <Button type="submit">
                  Save Profile
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

