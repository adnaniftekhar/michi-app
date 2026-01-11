'use client'

import { useDemoUser } from '@/contexts/DemoUserContext'
import { getLearnerProfile, getLearnerProfileAsync } from '@/lib/learner-profiles'
import { saveCustomProfile, saveCustomUser } from '@/lib/custom-users'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { ProfileView } from '@/components/profile/ProfileView'
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog'
import { useState, useEffect } from 'react'
import type { LearnerProfile } from '@/types'
import { showToast } from '@/components/ui/Toast'

export default function ProfilePage() {
  const { currentUserId, currentUser } = useDemoUser()
  const [isEditing, setIsEditing] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [profile, setProfile] = useState<LearnerProfile | null>(null)

  // Load profile only on client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    const loadProfile = async () => {
      // Use async version for Clerk users, sync for demo users
      const initialProfile = currentUserId.startsWith('user_') 
        ? await getLearnerProfileAsync(currentUserId)
        : getLearnerProfile(currentUserId)
      setProfile(initialProfile)
    }
    loadProfile()
  }, [currentUserId])

  // Update profile when user changes or when exiting edit mode
  useEffect(() => {
    if (mounted && !isEditing) {
      const loadProfile = async () => {
        // Use async version for Clerk users, sync for demo users
        const newProfile = currentUserId.startsWith('user_')
          ? await getLearnerProfileAsync(currentUserId)
          : getLearnerProfile(currentUserId)
        setProfile(newProfile)
      }
      loadProfile()
    }
  }, [currentUserId, isEditing, mounted])

  const handleSave = async (updatedProfile: LearnerProfile) => {
    try {
      // Save profile (works for both custom and demo users - saved profiles override built-in ones)
      // This will save to API if user is authenticated, localStorage otherwise
      await saveCustomProfile(currentUserId, updatedProfile)
      
      // Update the user's name to match the profile name (works for both custom and demo users)
      const updatedUser = {
        ...currentUser,
        name: updatedProfile.name,
        isCustom: currentUser.isCustom || true, // Mark as custom if it wasn't already
      }
      saveCustomUser(updatedUser)
      
      // Update the profile state to reflect saved changes
      const savedProfile = currentUserId.startsWith('user_')
        ? await getLearnerProfileAsync(currentUserId)
        : getLearnerProfile(currentUserId)
      setProfile(savedProfile)
      setIsEditing(false)
      showToast('Profile updated', 'success')
    } catch (error) {
      console.error('Error saving profile:', error)
      showToast('Failed to save profile', 'error')
    }
  }

  // Show loading state until mounted
  if (!mounted || !profile) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
        Loading...
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title="Learner Profile"
        subtitle={`Profile for ${currentUser.name}`}
        action={
          !isEditing && (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )
        }
      />

      <div
        style={{
          marginBottom: 'var(--spacing-6)',
          padding: 'var(--spacing-4)',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-card)',
        }}
      >
        <p
          style={{
            fontSize: 'var(--font-size-base)',
            lineHeight: 'var(--line-height-normal)',
            color: 'var(--color-text-secondary)',
            margin: 0,
          }}
        >
          Look for the info icons (ℹ️) next to fields for definitions and examples. These tooltips help you understand how each setting influences the learning pathway.
        </p>
      </div>

      {profile && <ProfileView profile={profile} />}

      <ProfileEditDialog
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        profile={profile}
        onSave={handleSave}
      />
    </>
  )
}

