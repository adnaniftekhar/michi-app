'use client'

import { Button } from '@/components/ui/Button'
import { markOnboardingComplete } from '@/lib/onboarding-utils'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onEditProfile: () => void
  userId: string
}

export function OnboardingModal({ isOpen, onClose, onEditProfile, userId }: OnboardingModalProps) {
  if (!isOpen) return null

  const handleGotIt = () => {
    markOnboardingComplete(userId)
    onClose()
  }

  const handleEditProfile = () => {
    onEditProfile()
    // Don't mark as complete yet - let them complete the profile first
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15, 20, 25, 0.75)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-8 py-6 border-b"
          style={{
            borderColor: 'var(--color-border)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            Welcome to Michi! 👋
          </h2>
          <button
            onClick={onClose}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 rounded-lg p-2 transition-colors"
            style={{
              outlineColor: 'var(--color-focus-ring)',
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 overflow-y-auto" style={{ flex: 1 }}>
          <div className="space-y-6">
            <div>
              <p
                style={{
                  fontSize: 'var(--font-size-base)',
                  lineHeight: 'var(--line-height-relaxed)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--spacing-4)',
                }}
              >
                We're excited to help you plan personalized learning journeys for your trips!
              </p>
            </div>

            <div
              style={{
                padding: 'var(--spacing-4)',
                backgroundColor: 'var(--color-background)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <h3
                style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--spacing-2)',
                }}
              >
                Step 1: Create Your Learner Profile
              </h3>
              <p
                style={{
                  fontSize: 'var(--font-size-base)',
                  lineHeight: 'var(--line-height-normal)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--spacing-3)',
                }}
              >
                Your learner profile helps us understand your interests, learning style, and preferences. This information is used to generate personalized learning pathways for each trip.
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  lineHeight: 'var(--line-height-normal)',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                💡 Look for the info icons (ℹ️) next to fields for definitions and examples.
              </p>
            </div>

            <div
              style={{
                padding: 'var(--spacing-4)',
                backgroundColor: 'var(--color-background)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <h3
                style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--spacing-2)',
                }}
              >
                Step 2: Create Your First Trip
              </h3>
              <p
                style={{
                  fontSize: 'var(--font-size-base)',
                  lineHeight: 'var(--line-height-normal)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Once your profile is set up, create your first trip! We'll use your profile to generate AI-powered learning pathways tailored to your interests and the trip location.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-4 px-8 py-6 border-t"
          style={{
            borderColor: 'var(--color-border)',
          }}
        >
          <Button
            variant="secondary"
            onClick={handleGotIt}
          >
            Got it
          </Button>
          <Button
            onClick={handleEditProfile}
            style={{
              backgroundColor: 'var(--color-michi-green)',
              color: 'var(--color-background)',
            }}
          >
            Edit Profile
          </Button>
        </div>
      </div>
    </div>
  )
}
