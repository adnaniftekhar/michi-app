'use client'

import { useDemoUser } from '@/contexts/DemoUserContext'
import { getAllUsers, DEMO_USERS } from '@/lib/demo-users'
import type { DemoUser } from '@/types'
import { clearAllData } from '@/lib/storage'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Select } from './ui/Select'
import { Button } from './ui/Button'
import { useState, useEffect } from 'react'
import { CreateLearnerModal } from './CreateLearnerModal'
import { saveCustomUser, saveCustomProfile } from '@/lib/custom-users'
import { showToast } from './ui/Toast'

export function Header() {
  const { currentUser, setCurrentUserId } = useDemoUser()
  const pathname = usePathname()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [users, setUsers] = useState<DemoUser[]>(DEMO_USERS)

  // Load users only on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    setUsers(getAllUsers())
  }, [])

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
              className="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                outlineColor: 'var(--color-focus-ring)',
              }}
            >
              <img
                src="/michi-logo.png"
                alt="michi"
                style={{
                  height: '48px',
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  clearAllData()
                  window.location.reload()
                }
              }}
              className="text-xs px-2 py-1 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
                outlineColor: 'var(--color-focus-ring)',
              }}
              title="Reset all demo data to seeded state"
            >
              Reset Demo Data
            </button>
            <Link
              href="/profile"
              className="text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                color: 'var(--color-text-secondary)',
                outlineColor: 'var(--color-focus-ring)',
              }}
            >
              Profile
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowCreateModal(true)}
            >
              + New Learner
            </Button>
            <label className="flex items-center gap-2 text-sm">
              <span style={{ color: 'var(--color-text-secondary)' }}>User:</span>
              <Select
                value={currentUser.id}
                onChange={(e) => {
                  setCurrentUserId(e.target.value)
                  // Reload users after switching to get updated names
                  if (mounted) {
                    setUsers(getAllUsers())
                  }
                }}
                options={users.map((user) => ({
                  value: user.id,
                  label: user.name + (user.isCustom ? ' (Custom)' : ''),
                }))}
                style={{ minWidth: '120px' }}
                aria-label="Select user"
              />
            </label>
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
    </header>
  )
}
