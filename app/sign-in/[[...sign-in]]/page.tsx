'use client'

import { SignIn } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function SignInPage() {
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  // Redirect authenticated users to home
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/home')
    }
  }, [isLoaded, isSignedIn, router])

  // Show nothing while checking auth or redirecting
  if (!isLoaded || isSignedIn) {
    return null
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
      <div
        style={{
          maxWidth: '460px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--spacing-6)',
        }}
      >
        {/* Michi Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <img
            src="/michi-logo.png"
            alt="michi"
            style={{
              height: '56px',
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
            textAlign: 'center',
            width: '100%',
          }}
        >
          Sign in
        </h1>

        {/* Helper Text */}
        <p
          style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--line-height-normal)',
            margin: 0,
            textAlign: 'center',
            width: '100%',
            marginBottom: 'var(--spacing-2)',
          }}
        >
          Use your email or Google to continue.
        </p>

        {/* Clerk Sign In Component */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 'var(--spacing-2)' }}>
          <SignIn
            appearance={{
              variables: {
                colorBackground: '#161C22',
                colorInputBackground: '#0F1419',
                colorInputText: '#E6EDF3',
                colorText: '#E6EDF3',
                colorTextSecondary: '#9AA4AE',
                colorPrimary: '#6FBF9A',
                colorDanger: '#DC2626',
                borderRadius: '10px',
                fontFamily: 'Inter, system-ui, sans-serif',
              },
              elements: {
                rootBox: {
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                },
                card: {
                  backgroundColor: '#161C22',
                  border: '1px solid #242C33',
                  borderRadius: '12px',
                  width: '100%',
                  maxWidth: '100%',
                },
                headerTitle: {
                  color: '#E6EDF3',
                  fontSize: '24px',
                  fontWeight: '600',
                },
                headerSubtitle: {
                  color: '#9AA4AE',
                  fontSize: '15px',
                },
                formButtonPrimary: {
                  backgroundColor: '#6FBF9A',
                  color: '#0F1419',
                  fontSize: '15px',
                  fontWeight: '600',
                  borderRadius: '8px',
                },
                formFieldInput: {
                  backgroundColor: '#0F1419',
                  color: '#E6EDF3',
                  borderColor: '#242C33',
                  fontSize: '15px',
                },
                formFieldLabel: {
                  color: '#E6EDF3',
                  fontSize: '14px',
                  fontWeight: '500',
                },
                socialButtonsBlockButton: {
                  backgroundColor: '#0F1419',
                  color: '#E6EDF3',
                  borderColor: '#242C33',
                  fontSize: '15px',
                },
                footerActionLink: {
                  color: '#6FBF9A',
                },
                identityPreviewText: {
                  color: '#E6EDF3',
                },
                identityPreviewEditButton: {
                  color: '#9AA4AE',
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
