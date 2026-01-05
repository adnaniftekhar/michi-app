'use client'

import { useState } from 'react'
import type { ScheduleBlock } from '@/types'
import { Button } from '../ui/Button'

interface EditScheduleBlockModalProps {
  isOpen: boolean
  onClose: () => void
  block: ScheduleBlock | null
  onSave: (blockId: string, formData: FormData) => void
}

export function EditScheduleBlockModal({ isOpen, onClose, block, onSave }: EditScheduleBlockModalProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['driving-question', 'inquiry-exploration', 'artifact', 'reflection']))
  const [showDescription, setShowDescription] = useState(false)

  if (!isOpen || !block) return null

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    onSave(block.id, formData)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15, 20, 25, 0.75)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
        }}
      >
        {/* Sticky Header */}
        <div
          className="flex items-center justify-between px-8 py-6 border-b sticky top-0 bg-white z-10"
          style={{ borderColor: '#e5e7eb' }}
        >
          <div>
            <h2
              className="font-semibold mb-1"
              style={{
                fontSize: '28px',
                lineHeight: '1.3',
                color: '#111827',
                fontWeight: '600',
              }}
            >
              Edit Learning Block
            </h2>
            <p
              className="text-sm"
              style={{
                color: '#6b7280',
                fontSize: '14px',
                lineHeight: '1.5',
              }}
            >
              Design a meaningful learning experience
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none hover:opacity-70 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg p-1"
            style={{ 
              color: '#6b7280',
              outlineColor: 'var(--color-michi-green)',
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="px-8 py-8 space-y-8">
            {/* Section A: Core Details */}
            <div
              className="rounded-xl p-6"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label
                    className="block mb-2 font-medium"
                    style={{
                      fontSize: '13px',
                      color: '#374151',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={block.title}
                    required
                    className="w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
                    style={{
                      padding: '14px 16px',
                      fontSize: '18px',
                      lineHeight: '1.5',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontWeight: '600',
                      borderRadius: '8px',
                      outlineColor: 'var(--color-michi-green)',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-michi-green)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(111, 191, 154, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>
                <div>
                  <label
                    className="block mb-2 font-medium"
                    style={{
                      fontSize: '13px',
                      color: '#374151',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Duration
                  </label>
                  <input
                    type="number"
                    name="duration"
                    defaultValue={block.duration}
                    min="1"
                    required
                    className="w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
                    style={{
                      padding: '14px 16px',
                      fontSize: '16px',
                      lineHeight: '1.5',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontWeight: '600',
                      borderRadius: '8px',
                      outlineColor: 'var(--color-michi-green)',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-michi-green)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(111, 191, 154, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    className="block mb-2 font-medium"
                    style={{
                      fontSize: '13px',
                      color: '#374151',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    defaultValue={new Date(block.startTime).toISOString().slice(0, 16)}
                    required
                    className="w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
                    style={{
                      padding: '14px 16px',
                      fontSize: '15px',
                      lineHeight: '1.5',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#ffffff',
                      color: '#111827',
                      fontWeight: '500',
                      borderRadius: '8px',
                      outlineColor: 'var(--color-michi-green)',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-michi-green)'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(111, 191, 154, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>

              {/* Optional Description - Collapsible */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowDescription(!showDescription)}
                  className="flex items-center gap-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg px-2 py-1"
                  style={{
                    color: '#6b7280',
                    outlineColor: 'var(--color-michi-green)',
                  }}
                >
                  <span>{showDescription ? '−' : '+'}</span>
                  <span>Add description</span>
                </button>
                {showDescription && (
                  <div className="mt-3">
                    <textarea
                      name="description"
                      defaultValue={block.description || ''}
                      rows={2}
                      placeholder="Brief context for this learning block..."
                      className="w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
                      style={{
                        padding: '12px 16px',
                        fontSize: '15px',
                        lineHeight: '1.5',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        outlineColor: 'var(--color-michi-green)',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section B: Learning Design (PBL) */}
            <div className="space-y-6">
              <div>
                <h3
                  className="font-semibold mb-2"
                  style={{
                    fontSize: '20px',
                    lineHeight: '1.4',
                    color: '#111827',
                    fontWeight: '600',
                  }}
                >
                  Learning Design
                </h3>
                <p
                  className="text-sm"
                  style={{
                    color: '#6b7280',
                    lineHeight: '1.5',
                  }}
                >
                  Structure the learning arc using Project-Based Learning principles
                </p>
              </div>

              {/* Driving Question - Emphasized */}
              <div
                className="rounded-xl p-6 border-2 transition-colors"
                style={{
                  backgroundColor: expandedSections.has('driving-question') ? '#f0fdf4' : '#ffffff',
                  borderColor: expandedSections.has('driving-question') ? 'var(--color-michi-green)' : '#e5e7eb',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleSection('driving-question')}
                  className="w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
                  style={{ outlineColor: 'var(--color-michi-green)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div
                        className="font-semibold mb-1"
                        style={{
                          fontSize: '16px',
                          color: '#111827',
                          fontWeight: '600',
                        }}
                      >
                        What are we trying to understand?
                      </div>
                      <p
                        className="text-sm"
                        style={{
                          color: '#6b7280',
                          lineHeight: '1.5',
                        }}
                      >
                        The driving question that guides inquiry and connects learning to real-world relevance
                      </p>
                    </div>
                    <span style={{ color: '#6b7280', fontSize: '20px' }}>
                      {expandedSections.has('driving-question') ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {expandedSections.has('driving-question') && (
                  <div className="mt-4">
                    <textarea
                      name="drivingQuestion"
                      defaultValue={block.drivingQuestion || ''}
                      rows={3}
                      placeholder="e.g., How can geometric principles observed in architecture optimize structural integrity?"
                      className="w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
                      style={{
                        padding: '16px',
                        fontSize: '16px',
                        lineHeight: '1.6',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        outlineColor: 'var(--color-michi-green)',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Inquiry & Exploration - Combined */}
              <div
                className="rounded-xl p-6 border transition-colors"
                style={{
                  backgroundColor: expandedSections.has('inquiry-exploration') ? '#f9fafb' : '#ffffff',
                  borderColor: '#e5e7eb',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleSection('inquiry-exploration')}
                  className="w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
                  style={{ outlineColor: 'var(--color-michi-green)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div
                        className="font-semibold mb-1"
                        style={{
                          fontSize: '16px',
                          color: '#111827',
                          fontWeight: '600',
                        }}
                      >
                        Inquiry & Exploration
                      </div>
                      <p
                        className="text-sm"
                        style={{
                          color: '#6b7280',
                          lineHeight: '1.5',
                        }}
                      >
                        What will we investigate, and where or how will we explore this?
                      </p>
                    </div>
                    <span style={{ color: '#6b7280', fontSize: '20px' }}>
                      {expandedSections.has('inquiry-exploration') ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {expandedSections.has('inquiry-exploration') && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label
                        className="block mb-2 text-sm font-medium"
                        style={{ color: '#374151' }}
                      >
                        Inquiry Task
                      </label>
                      <textarea
                        name="inquiryTask"
                        defaultValue={block.inquiryTask || ''}
                        rows={3}
                        placeholder="What specific task will the learner investigate or explore?"
                        className="w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
                        style={{
                          padding: '14px 16px',
                          fontSize: '15px',
                          lineHeight: '1.5',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          outlineColor: 'var(--color-michi-green)',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block mb-2 text-sm font-medium"
                        style={{ color: '#374151' }}
                      >
                        Field Experience
                      </label>
                      <textarea
                        name="fieldExperience"
                        defaultValue={block.fieldExperience || ''}
                        rows={3}
                        placeholder="Where or how will the learner engage in real-world exploration?"
                        className="w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
                        style={{
                          padding: '14px 16px',
                          fontSize: '15px',
                          lineHeight: '1.5',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          outlineColor: 'var(--color-michi-green)',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block mb-2 text-sm font-medium"
                        style={{ color: '#374151' }}
                      >
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        defaultValue={block.location || ''}
                        placeholder="e.g., Museum of History, Central Park"
                        className="w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
                        style={{
                          padding: '14px 16px',
                          fontSize: '15px',
                          lineHeight: '1.5',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          outlineColor: 'var(--color-michi-green)',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block mb-2 text-sm font-medium"
                        style={{ color: '#374151' }}
                      >
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        defaultValue={block.notes || ''}
                        rows={3}
                        placeholder="Additional notes about the location or experience..."
                        className="w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
                        style={{
                          padding: '14px 16px',
                          fontSize: '15px',
                          lineHeight: '1.5',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          outlineColor: 'var(--color-michi-green)',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Artifact */}
              <div
                className="rounded-xl p-6 border transition-colors"
                style={{
                  backgroundColor: expandedSections.has('artifact') ? '#f9fafb' : '#ffffff',
                  borderColor: '#e5e7eb',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleSection('artifact')}
                  className="w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
                  style={{ outlineColor: 'var(--color-michi-green)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div
                        className="font-semibold mb-1"
                        style={{
                          fontSize: '16px',
                          color: '#111827',
                          fontWeight: '600',
                        }}
                      >
                        How will learning be demonstrated?
                      </div>
                      <p
                        className="text-sm"
                        style={{
                          color: '#6b7280',
                          lineHeight: '1.5',
                        }}
                      >
                        The tangible output that shows understanding and application
                      </p>
                    </div>
                    <span style={{ color: '#6b7280', fontSize: '20px' }}>
                      {expandedSections.has('artifact') ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {expandedSections.has('artifact') && (
                  <div className="mt-4">
                    <textarea
                      name="artifact"
                      defaultValue={block.artifact || ''}
                      rows={3}
                      placeholder="e.g., A written report, photo essay, presentation, prototype..."
                      className="w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
                      style={{
                        padding: '14px 16px',
                        fontSize: '15px',
                        lineHeight: '1.5',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#ffffff',
                        color: '#111827',
                        outlineColor: 'var(--color-michi-green)',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Reflection */}
              <div
                className="rounded-xl p-6 border transition-colors"
                style={{
                  backgroundColor: expandedSections.has('reflection') ? '#f9fafb' : '#ffffff',
                  borderColor: '#e5e7eb',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleSection('reflection')}
                  className="w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
                  style={{ outlineColor: 'var(--color-michi-green)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div
                        className="font-semibold mb-1"
                        style={{
                          fontSize: '16px',
                          color: '#111827',
                          fontWeight: '600',
                        }}
                      >
                        Reflection & Critique
                      </div>
                      <p
                        className="text-sm"
                        style={{
                          color: '#6b7280',
                          lineHeight: '1.5',
                        }}
                      >
                        How will the learner reflect on their experience and receive feedback?
                      </p>
                    </div>
                    <span style={{ color: '#6b7280', fontSize: '20px' }}>
                      {expandedSections.has('reflection') ? '−' : '+'}
                    </span>
                  </div>
                </button>
                {expandedSections.has('reflection') && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label
                        className="block mb-2 text-sm font-medium"
                        style={{ color: '#374151' }}
                      >
                        Reflection Prompt
                      </label>
                      <textarea
                        name="reflectionPrompt"
                        defaultValue={block.reflectionPrompt || ''}
                        rows={2}
                        placeholder="What prompt will guide the learner's reflection?"
                        className="w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
                        style={{
                          padding: '14px 16px',
                          fontSize: '15px',
                          lineHeight: '1.5',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          outlineColor: 'var(--color-michi-green)',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="block mb-2 text-sm font-medium"
                        style={{ color: '#374151' }}
                      >
                        Critique Step
                      </label>
                      <textarea
                        name="critiqueStep"
                        defaultValue={block.critiqueStep || ''}
                        rows={2}
                        placeholder="How will the learner get feedback and improve?"
                        className="w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg"
                        style={{
                          padding: '14px 16px',
                          fontSize: '15px',
                          lineHeight: '1.5',
                          border: '1px solid #d1d5db',
                          backgroundColor: '#ffffff',
                          color: '#111827',
                          outlineColor: 'var(--color-michi-green)',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div
            className="flex items-center justify-end gap-3 px-8 py-6 border-t sticky bottom-0 bg-white"
            style={{ borderColor: '#e5e7eb' }}
          >
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                borderColor: '#d1d5db',
                color: '#374151',
                padding: '10px 20px',
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              style={{
                backgroundColor: 'var(--color-michi-green)',
                color: '#ffffff',
                padding: '10px 24px',
                fontSize: '15px',
                fontWeight: '600',
              }}
            >
              Save Learning Block
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
