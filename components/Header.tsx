'use client'

import { useDemoUser } from '@/contexts/DemoUserContext'
import { getAllUsers, DEMO_USERS } from '@/lib/demo-users'
import type { DemoUser } from '@/types'
import { clearAllData } from '@/lib/storage'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from './ui/Button'
import { useState, useEffect, useRef } from 'react'
import { CreateLearnerModal } from './CreateLearnerModal'
import { saveCustomUser, saveCustomProfile } from '@/lib/custom-users'
import { showToast } from './ui/Toast'
import { ConfirmDialog } from './ui/ConfirmDialog'

export function Header() {
  const { currentUser, setCurrentUserId } = useDemoUser()
  const pathname = usePathname()
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showLearnerMenu, setShowLearnerMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [users, setUsers] = useState<DemoUser[]>(DEMO_USERS)
  const menuRef = useRef<HTMLDivElement>(null)

  // Load users only on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    setUsers(getAllUsers())
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowLearnerMenu(false)
      }
    }

    if (showLearnerMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showLearnerMenu])

  const handleResetData = () => {
    if (typeof window !== 'undefined') {
      clearAllData()
      window.location.reload()
    }
  }

  // Extract trip title from pathname if on trip detail page
  const tripMatch = pathname.match(/^\/trips\/([^/]+)$/)
  const isTripPage = tripMatch !== null

  return (
    <header
      className="border-b sticky top-0 z-40"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="container mx-auto px-4 py-3"
        style={{ maxWidth: '1100px' }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-opacity"
              style={{
                outlineColor: 'var(--color-focus-ring)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              <img
                src="/michi-logo.png"
                alt="michi"
                style={{
                  height: '40px',
                  width: 'auto',
                }}
              />
            </Link>
            {isTripPage && (
              <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-2 text-sm">
                <Link
                  href="/"
                  className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    color: 'var(--color-text-secondary)',
                    outlineColor: 'var(--color-focus-ring)',
                  }}
                >
                  Trips
                </Link>
                <span aria-hidden="true" style={{ color: 'var(--color-text-secondary)' }}>
                  /
                </span>
                <span style={{ color: 'var(--color-text-primary)' }}>Trip</span>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/profile')}
            >
              Profile
            </Button>
            <div
              style={{
                width: '1px',
                height: '24px',
                backgroundColor: 'var(--color-border)',
                marginLeft: 'var(--spacing-1)',
                marginRight: 'var(--spacing-1)',
              }}
              aria-hidden="true"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              + New Learner
            </Button>
            <div
              style={{
                width: '1px',
                height: '24px',
                backgroundColor: 'var(--color-border)',
                marginLeft: 'var(--spacing-1)',
                marginRight: 'var(--spacing-1)',
              }}
              aria-hidden="true"
            />
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowLearnerMenu(!showLearnerMenu)}
                className="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  padding: 'var(--spacing-2) var(--spacing-3)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-primary)',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-button)',
                  outlineColor: 'var(--color-focus-ring)',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface)'
                }}
                aria-label="Select learner"
                aria-expanded={showLearnerMenu}
              >
                <span style={{ color: 'var(--color-text-secondary)' }}>Learner:</span>
                <span>{currentUser.name}</span>
                <span style={{ color: 'var(--color-text-tertiary)' }}>
                  {showLearnerMenu ? '▲' : '▼'}
                </span>
              </button>
              {showLearnerMenu && (
                <div
                  className="absolute right-0 mt-2 z-50"
                  style={{
                    minWidth: '200px',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-card)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle)',
                      padding: 'var(--spacing-2)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontWeight: 'var(--font-weight-medium)',
                        padding: 'var(--spacing-2) var(--spacing-3)',
                      }}
                    >
                      Select learner
                    </div>
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setCurrentUserId(user.id)
                          // Reload users after switching to get updated names
                          if (mounted) {
                            setUsers(getAllUsers())
                          }
                          setShowLearnerMenu(false)
                        }}
                        className="w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                        style={{
                          padding: 'var(--spacing-3)',
                          fontSize: 'var(--font-size-sm)',
                          color: currentUser.id === user.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                          backgroundColor: currentUser.id === user.id ? 'var(--color-background)' : 'transparent',
                          outlineColor: 'var(--color-focus-ring)',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (currentUser.id !== user.id) {
                            e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currentUser.id !== user.id) {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }
                        }}
                      >
                        {user.name}
                        {user.isCustom && (
                          <span style={{ color: 'var(--color-text-tertiary)', marginLeft: 'var(--spacing-2)' }}>
                            (Custom)
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div
                    style={{
                      borderTop: '1px solid var(--color-border-subtle)',
                      padding: 'var(--spacing-2)',
                    }}
                  >
                    <button
                      onClick={() => {
                        setShowLearnerMenu(false)
                        setShowResetConfirm(true)
                      }}
                      className="w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                      style={{
                        padding: 'var(--spacing-3)',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-danger)',
                        outlineColor: 'var(--color-focus-ring)',
                        transition: 'background-color 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      Reset demo data
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <CreateLearnerModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={(user, profile) => {
          saveCustomUser(user)
          saveCustomProfile(user.id, profile)
          setCurrentUserId(user.id)
          // Refresh users list to include the new user
          if (mounted) {
            setUsers(getAllUsers())
          }
          setShowCreateModal(false)
          showToast('New learner created!', 'success')
        }}
      />
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetData}
        title="Reset demo data"
        message="This will clear all your trips, schedules, and activity logs and restore the default demo data. This action cannot be undone."
        confirmLabel="Reset data"
        cancelLabel="Cancel"
        variant="danger"
      />
    </header>
  )
}
