'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface TripHeaderProps {
  tripName: string
  sectionName?: string
}

export function TripHeader({ tripName, sectionName }: TripHeaderProps) {
  const router = useRouter()

  const handleBackToTrips = () => {
    // Always navigate to trips list, regardless of history
    router.push('/')
  }

  const breadcrumbItems = ['Trips', tripName]
  if (sectionName) {
    breadcrumbItems.push(sectionName)
  }

  return (
    <div
      style={{
        marginBottom: 'var(--spacing-6)',
        paddingTop: 'var(--spacing-4)',
        paddingBottom: 'var(--spacing-4)',
      }}
    >
      <div className="flex items-center gap-4 flex-wrap">
        <Button
          variant="tertiary"
          size="sm"
          onClick={handleBackToTrips}
          aria-label="Back to Trips"
          style={{
            minHeight: '44px',
            paddingLeft: 'var(--spacing-3)',
            paddingRight: 'var(--spacing-4)',
          }}
        >
          <span style={{ marginRight: 'var(--spacing-2)' }}>←</span>
          Back to Trips
        </Button>
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 flex-1 min-w-0">
          <ol className="flex items-center gap-2 flex-wrap" style={{ 
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}>
            {breadcrumbItems.map((item, index) => (
              <li key={index} className="flex items-center gap-2 flex-shrink-0">
                {index > 0 && (
                  <span 
                    aria-hidden="true" 
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    /
                  </span>
                )}
                <span
                  style={{
                    color: index === breadcrumbItems.length - 1 
                      ? 'var(--color-text-primary)' 
                      : 'var(--color-text-secondary)',
                    fontWeight: index === breadcrumbItems.length - 1 
                      ? 'var(--font-weight-medium)' 
                      : 'var(--font-weight-normal)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: index === breadcrumbItems.length - 1 ? '100%' : '200px',
                  }}
                  title={item}
                >
                  {item}
                </span>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  )
}
