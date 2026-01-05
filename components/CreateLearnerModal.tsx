'use client'

import { useState, useEffect } from 'react'
import type { LearnerProfile } from '@/types'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { TagInput } from './profile/inputs/TagInput'
import { TimezoneCombobox } from './profile/inputs/TimezoneCombobox'
import { SessionLengthSlider } from './profile/inputs/SessionLengthSlider'
import { detectTimezone, durationToMinutes, minutesToDuration, interactionStyleToPreference, preferenceToInteractionStyle } from '@/lib/profile/utils'

interface CreateLearnerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (user: { id: string; name: string; timezone: string }, profile: LearnerProfile) => void
}

const STEPS = [
  { id: 'basics', label: 'Basics' },
  { id: 'rhythm', label: 'Rhythm' },
  { id: 'curiosity', label: 'Curiosity' },
  { id: 'experiences', label: 'Experiences' },
  { id: 'projects', label: 'Projects' },
  { id: 'social', label: 'Social' },
]

export function CreateLearnerModal({ isOpen, onClose, onSave }: CreateLearnerModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [timezoneOverride, setTimezoneOverride] = useState(false)
  const [detectedTz, setDetectedTz] = useState<string>('')
  
  const [formData, setFormData] = useState({
    name: '',
    timezone: '',
    timezoneOverride: false,
    ageBand: undefined as '5-8' | '9-12' | '13-16' | '17-20' | '21+' | undefined,
    languages: [] as string[],
    accessibilityNotes: '',
    preferredLearningTimes: [] as string[],
    preferredDurationMinutes: 60,
    interactionPreference: 'either-works' as 'prefer-solo' | 'prefer-with-others' | 'either-works',
    energyPattern: undefined as 'morning' | 'afternoon' | 'evening-flexible' | undefined,
    contentFormat: [] as string[],
    interests: [] as string[],
    dislikes: [] as string[],
    currentLevel: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    learningGoals: [] as string[],
    preferredArtifactTypes: [] as string[],
    preferredFieldExperiences: [] as string[],
    reflectionStyles: ['journal'] as string[],
    inquiryApproach: 'guided' as 'structured' | 'open-ended' | 'guided',
    collaborationNotes: '',
  })

  useEffect(() => {
    if (isOpen) {
      const tz = detectTimezone()
      setDetectedTz(tz)
      setFormData(prev => ({ ...prev, timezone: tz }))
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Please enter a name')
      return
    }

    const userId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const user = {
      id: userId,
      name: formData.name.trim(),
      timezone: formData.timezone,
      isCustom: true,
    }

    const profile: LearnerProfile = {
      name: formData.name.trim(),
      timezone: formData.timezone,
      ageBand: formData.ageBand,
      languages: formData.languages,
      accessibilityNotes: formData.accessibilityNotes || undefined,
      preferences: {
        preferredLearningTimes: formData.preferredLearningTimes,
        preferredDuration: minutesToDuration(formData.preferredDurationMinutes), // Legacy
        preferredDurationMinutes: formData.preferredDurationMinutes,
        interactionStyle: preferenceToInteractionStyle(formData.interactionPreference), // Legacy
        interactionPreference: formData.interactionPreference,
        energyPattern: formData.energyPattern,
        contentFormat: formData.contentFormat as any[],
      },
      constraints: {},
      pblProfile: {
        interests: formData.interests,
        dislikes: formData.dislikes.length > 0 ? formData.dislikes : undefined,
        currentLevel: formData.currentLevel,
        learningGoals: formData.learningGoals,
        preferredArtifactTypes: formData.preferredArtifactTypes as any[],
      },
      experientialProfile: {
        preferredFieldExperiences: formData.preferredFieldExperiences,
        reflectionStyle: formData.reflectionStyles[0] || 'journal', // Legacy
        reflectionStyles: formData.reflectionStyles,
        inquiryApproach: formData.inquiryApproach,
      },
      socialPreferences: {
        collaborationNotes: formData.collaborationNotes || undefined,
      },
    }

    onSave(user, profile)
    onClose()
    
    // Reset form
    const tz = detectTimezone()
    setFormData({
      name: '',
      timezone: tz,
      timezoneOverride: false,
      ageBand: undefined,
      languages: [],
      accessibilityNotes: '',
      preferredLearningTimes: [],
      preferredDurationMinutes: 60,
      interactionPreference: 'either-works',
      energyPattern: undefined,
      contentFormat: [],
      interests: [],
      dislikes: [],
      currentLevel: 'intermediate',
      learningGoals: [],
      preferredArtifactTypes: [],
      preferredFieldExperiences: [],
      reflectionStyles: ['journal'],
      inquiryApproach: 'guided',
      collaborationNotes: '',
    })
    setCurrentStep(0)
    setTimezoneOverride(false)
  }

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
              Create New Learner
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
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
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                                setFormData({ ...formData, timezone: detectedTz })
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
                          value={formData.timezone}
                          onChange={(tz) => setFormData({ ...formData, timezone: tz })}
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
                        value={formData.ageBand || ''}
                        onChange={(e) => setFormData({ ...formData, ageBand: e.target.value as any || undefined })}
                        options={[
                          { value: '', label: 'Not specified' },
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
                      value={formData.languages}
                      onChange={(langs) => setFormData({ ...formData, languages: langs })}
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
                        value={formData.accessibilityNotes}
                        onChange={(e) => setFormData({ ...formData, accessibilityNotes: e.target.value })}
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
                              const current = formData.preferredLearningTimes
                              const newTimes = current.includes(time)
                                ? current.filter(t => t !== time)
                                : [...current, time]
                              setFormData({ ...formData, preferredLearningTimes: newTimes })
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                            style={{
                              backgroundColor: formData.preferredLearningTimes.includes(time)
                                ? 'var(--color-michi-green)'
                                : 'var(--color-background)',
                              color: formData.preferredLearningTimes.includes(time)
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
                      value={formData.preferredDurationMinutes}
                      onChange={(minutes) => setFormData({ ...formData, preferredDurationMinutes: minutes })}
                    />
                    <div>
                      <Select
                        label="Energy Pattern"
                        value={formData.energyPattern || ''}
                        onChange={(e) => setFormData({ ...formData, energyPattern: e.target.value as any || undefined })}
                        options={[
                          { value: '', label: 'Not specified' },
                          { value: 'morning', label: 'Morning person (most alert in AM)' },
                          { value: 'afternoon', label: 'Afternoon person (most alert in PM)' },
                          { value: 'evening-flexible', label: 'Evening or flexible' },
                        ]}
                      />
                    </div>
                    <div>
                      <label
                        className="block mb-2 font-medium"
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        Content Format
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {['reading', 'video', 'hands-on', 'discussion', 'reflection'].map((format) => (
                          <button
                            key={format}
                            type="button"
                            onClick={() => {
                              const current = formData.contentFormat
                              const newFormats = current.includes(format)
                                ? current.filter(f => f !== format)
                                : [...current, format]
                              setFormData({ ...formData, contentFormat: newFormats })
                            }}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                            style={{
                              backgroundColor: formData.contentFormat.includes(format)
                                ? 'var(--color-michi-green)'
                                : 'var(--color-background)',
                              color: formData.contentFormat.includes(format)
                                ? 'var(--color-background)'
                                : 'var(--color-text-primary)',
                              border: '1px solid var(--color-border)',
                              outlineColor: 'var(--color-focus-ring)',
                            }}
                          >
                            {format.charAt(0).toUpperCase() + format.slice(1)}
                          </button>
                        ))}
                      </div>
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
                      value={formData.interests}
                      onChange={(interests) => setFormData({ ...formData, interests })}
                      placeholder="Add interests (e.g., history, science, art)"
                      helperText="AI uses this to suggest relevant learning topics and field experiences."
                    />
                    <TagInput
                      label="Dislikes / Avoid"
                      value={formData.dislikes}
                      onChange={(dislikes) => setFormData({ ...formData, dislikes })}
                      placeholder="Things to avoid (e.g., crowded places, loud noises)"
                      helperText="AI will avoid suggesting activities related to these."
                    />
                    <div>
                      <Select
                        label="Current Level"
                        value={formData.currentLevel}
                        onChange={(e) => setFormData({ ...formData, currentLevel: e.target.value as any })}
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
                      value={formData.learningGoals}
                      onChange={(goals) => setFormData({ ...formData, learningGoals: goals })}
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
                              const current = formData.preferredFieldExperiences
                              const newExps = current.includes(exp)
                                ? current.filter(e => e !== exp)
                                : [...current, exp]
                              setFormData({ ...formData, preferredFieldExperiences: newExps })
                            }}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                            style={{
                              backgroundColor: formData.preferredFieldExperiences.includes(exp)
                                ? 'var(--color-michi-green)'
                                : 'var(--color-background)',
                              color: formData.preferredFieldExperiences.includes(exp)
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
                        value={formData.preferredFieldExperiences}
                        onChange={(exps) => setFormData({ ...formData, preferredFieldExperiences: exps })}
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
                              const current = formData.preferredArtifactTypes
                              const newTypes = current.includes(type)
                                ? current.filter(t => t !== type)
                                : [...current, type]
                              setFormData({ ...formData, preferredArtifactTypes: newTypes })
                            }}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                            style={{
                              backgroundColor: formData.preferredArtifactTypes.includes(type)
                                ? 'var(--color-michi-green)'
                                : 'var(--color-background)',
                              color: formData.preferredArtifactTypes.includes(type)
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
                              const current = formData.reflectionStyles
                              const newStyles = current.includes(style)
                                ? current.filter(s => s !== style)
                                : [...current, style]
                              setFormData({ ...formData, reflectionStyles: newStyles })
                            }}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                            style={{
                              backgroundColor: formData.reflectionStyles.includes(style)
                                ? 'var(--color-michi-green)'
                                : 'var(--color-background)',
                              color: formData.reflectionStyles.includes(style)
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
                        value={formData.inquiryApproach}
                        onChange={(e) => setFormData({ ...formData, inquiryApproach: e.target.value as any })}
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
                              borderColor: formData.interactionPreference === option.value ? 'var(--color-michi-green)' : 'var(--color-border)',
                              backgroundColor: formData.interactionPreference === option.value ? 'rgba(111, 191, 154, 0.1)' : 'transparent',
                              outlineColor: 'var(--color-focus-ring)',
                            }}
                          >
                            <input
                              type="radio"
                              checked={formData.interactionPreference === option.value}
                              onChange={() => setFormData({ ...formData, interactionPreference: option.value })}
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
                        value={formData.collaborationNotes}
                        onChange={(e) => setFormData({ ...formData, collaborationNotes: e.target.value })}
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
                  Create Learner
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
