'use client'

import { usePathname } from 'next/navigation'
import { Header } from './Header'

export function ConditionalHeader() {
  const pathname = usePathname()
  
  // Hide header on landing page and auth routes
  if (pathname === '/' || pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
    return null
  }
  
  return <Header />
}
