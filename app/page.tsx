'use client'

import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { isFirstTimeUser } from '@/lib/onboarding-utils'

export default function LoginLanding() {
  const { isSignedIn, isLoaded, user } = useUser()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(false)

  // Redirect authenticated users based on first-time status
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setIsChecking(true)
      isFirstTimeUser(user.id).then((isFirstTime) => {
        setIsChecking(false)
        if (isFirstTime) {
          router.push('/profile')
        } else {
          router.push('/home')
        }
      })
    }
  }, [isLoaded, isSignedIn, user, router])

  // Show nothing while checking auth, checking first-time status, or redirecting
  if (!isLoaded || isSignedIn || isChecking) {
    return null
  }

  const handleSignIn = () => {
    router.push('/sign-in')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-background)',
        padding: 'var(--spacing-6)',
      }}
    >
      <Card
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: 'var(--spacing-8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--spacing-6)',
          textAlign: 'center',
          cursor: 'default', // Prevent card hover from interfering with button
        }}
      >
        {/* Michi Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src="/michi-logo.png"
            alt="michi"
            style={{
              height: '64px',
              width: 'auto',
            }}
          />
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-primary)',
            lineHeight: 'var(--line-height-tight)',
            margin: 0,
          }}
        >
          Welcome to Michi
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--line-height-relaxed)',
            margin: 0,
            maxWidth: '480px',
          }}
        >
          A worldschooling learning pathfinding app that helps you plan and manage personalized learning journeys for your trips.
        </p>

        {/* Sign in Button */}
        <button
          type="button"
          onClick={handleSignIn}
          aria-label="Sign in to Michi"
          style={{
            width: '100%',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-michi-green)',
            color: 'var(--color-background)',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-michi-green-hover)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(111, 191, 154, 0.4)'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-michi-green)'
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = '2px solid var(--color-focus-ring)'
            e.currentTarget.style.outlineOffset = '2px'
          }}
          onBlur={(e) => {
            e.currentTarget.style.outline = 'none'
          }}
        >
          Sign in
        </button>
      </Card>
    </div>
  )
}
