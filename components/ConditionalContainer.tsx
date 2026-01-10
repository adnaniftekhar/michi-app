'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface ConditionalContainerProps {
  children: ReactNode
}

export function ConditionalContainer({ children }: ConditionalContainerProps) {
  const pathname = usePathname()
  
  // On landing page and auth routes, don't apply container styles
  if (pathname === '/' || pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
    return <>{children}</>
  }
  
  // On other pages, apply the standard container
  return (
    <div className="container mx-auto" style={{ 
      maxWidth: '1100px',
      paddingLeft: 'var(--spacing-4)',
      paddingRight: 'var(--spacing-4)',
      paddingTop: 'var(--spacing-8)',
      paddingBottom: 'var(--spacing-8)',
    }}>
      {children}
    </div>
  )
}
