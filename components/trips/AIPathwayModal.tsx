'use client'

import { useState } from 'react'
import type { AIPlanResponse, AIPlanDay } from '@/lib/ai-plan-schema'
import type { Trip } from '@/types'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { LoadingSpinner } from '../ui/LoadingSpinner'

interface AIPathwayModalProps {
  isOpen: boolean
  onClose: () => void
  draft: AIPlanResponse | null
  onApply: (draft: AIPlanResponse) => void
  isLoading: boolean
  trip: Trip
}

export function AIPathwayModal({ isOpen, onClose, draft, onApply, isLoading, trip }: AIPathwayModalProps) {
  if (!isOpen) return null

  // Calculate dates for each day
  const getDateForDay = (dayNumber: number): Date => {
    const startDate = new Date(trip.startDate)
    const dayDate = new Date(startDate)
    dayDate.setDate(startDate.getDate() + (dayNumber - 1))
    return dayDate
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2
            className="font-semibold"
            style={{
              fontSize: 'var(--font-size-xl)',
              lineHeight: 'var(--line-height-tight)',
            }}
          >
            Draft Learning Pathway
          </h2>
          <button
            onClick={onClose}
            className="text-2xl leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ outlineColor: 'var(--color-focus-ring)' }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <LoadingSpinner size="lg" />
              <div style={{ color: 'var(--color-text-secondary)' }}>
                Generating learning pathway...
              </div>
            </div>
          )}

          {draft && (
            <div className="space-y-6">
              {draft.summary && (
                <Card>
                  <div
                    className="font-medium mb-2"
                    style={{
                      fontSize: 'var(--font-size-base)',
                      lineHeight: 'var(--line-height-tight)',
                    }}
                  >
                    Summary
                  </div>
                  <p
                    style={{
                      color: 'var(--color-text-primary)',
                      lineHeight: 'var(--line-height-normal)',
                    }}
                  >
                    {draft.summary}
                  </p>
                </Card>
              )}

              {draft.verifyLocally && (
                <Card className="border-yellow-300" style={{ borderColor: '#fbbf24' }}>
                  <div
                    className="font-medium mb-2"
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: '#92400e',
                    }}
                  >
                    Verify Locally
                  </div>
                  <p
                    className="text-sm"
                    style={{
                      color: '#78350f',
                      lineHeight: 'var(--line-height-normal)',
                    }}
                  >
                    {draft.verifyLocally}
                  </p>
                </Card>
              )}

              <div className="space-y-4">
                {draft.days.map((day) => (
                  <DayCard key={day.day} day={day} date={getDateForDay(day.day)} />
                ))}
              </div>
            </div>
          )}
        </div>

        {draft && !isLoading && (
          <div
            className="flex items-center justify-end gap-2 p-4 border-t"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onApply(draft)}>Apply</Button>
          </div>
        )}
      </div>
    </div>
  )
}

function DayCard({ day, date }: { day: AIPlanDay; date: Date }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDate = (d: Date): string => {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <Card>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ outlineColor: 'var(--color-focus-ring)' }}
      >
        <div className="flex items-center justify-between">
          <div
            className="font-semibold"
            style={{
              fontSize: 'var(--font-size-base)',
              lineHeight: 'var(--line-height-tight)',
            }}
          >
            {formatDate(date)}
          </div>
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {isExpanded ? '−' : '+'}
          </span>
        </div>
        <div
          className="text-sm mt-1"
          style={{
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--line-height-normal)',
          }}
        >
          {day.drivingQuestion}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <div
              className="text-xs font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Field Experience
            </div>
            <p
              className="text-sm"
              style={{
                color: 'var(--color-text-primary)',
                lineHeight: 'var(--line-height-normal)',
              }}
            >
              {day.fieldExperience}
            </p>
          </div>

          <div>
            <div
              className="text-xs font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Inquiry Task
            </div>
            <p
              className="text-sm"
              style={{
                color: 'var(--color-text-primary)',
                lineHeight: 'var(--line-height-normal)',
              }}
            >
              {day.inquiryTask}
            </p>
          </div>

          <div>
            <div
              className="text-xs font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Artifact
            </div>
            <p
              className="text-sm"
              style={{
                color: 'var(--color-text-primary)',
                lineHeight: 'var(--line-height-normal)',
              }}
            >
              {day.artifact}
            </p>
          </div>

          <div>
            <div
              className="text-xs font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Reflection Prompt
            </div>
            <p
              className="text-sm"
              style={{
                color: 'var(--color-text-primary)',
                lineHeight: 'var(--line-height-normal)',
              }}
            >
              {day.reflectionPrompt}
            </p>
          </div>

          <div>
            <div
              className="text-xs font-medium mb-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Critique Step
            </div>
            <p
              className="text-sm"
              style={{
                color: 'var(--color-text-primary)',
                lineHeight: 'var(--line-height-normal)',
              }}
            >
              {day.critiqueStep}
            </p>
          </div>

          {day.scheduleBlocks.length > 0 && (
            <div>
              <div
                className="text-xs font-medium mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Schedule Blocks ({day.scheduleBlocks.length})
              </div>
              <div className="space-y-2">
                {day.scheduleBlocks.map((block, idx) => (
                  <div
                    key={idx}
                    className="text-xs p-2 rounded"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div className="font-medium">{block.title}</div>
                    {block.description && (
                      <div
                        className="mt-1"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {block.description}
                      </div>
                    )}
                    <div
                      className="mt-1"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {new Date(block.startTime).toLocaleString()} • {block.duration} min
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

