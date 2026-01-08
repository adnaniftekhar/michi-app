import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TripHeader } from '../TripHeader'

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('TripHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render back button and breadcrumb with trip name', () => {
    render(<TripHeader tripName="Paris Adventure" />)
    
    // Check back button exists
    const backButton = screen.getByRole('button', { name: /back to trips/i })
    expect(backButton).toBeInTheDocument()
    expect(backButton).toHaveAttribute('aria-label', 'Back to Trips')
    
    // Check breadcrumb
    const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i })
    expect(breadcrumb).toBeInTheDocument()
    
    // Check breadcrumb items
    expect(screen.getByText('Trips')).toBeInTheDocument()
    expect(screen.getByText('Paris Adventure')).toBeInTheDocument()
  })

  it('should render breadcrumb with section name when provided', () => {
    render(<TripHeader tripName="Paris Adventure" sectionName="Schedule" />)
    
    expect(screen.getByText('Trips')).toBeInTheDocument()
    expect(screen.getByText('Paris Adventure')).toBeInTheDocument()
    expect(screen.getByText('Schedule')).toBeInTheDocument()
  })

  it('should navigate to trips list when back button is clicked', () => {
    render(<TripHeader tripName="Paris Adventure" />)
    
    const backButton = screen.getByRole('button', { name: /back to trips/i })
    fireEvent.click(backButton)
    
    expect(mockPush).toHaveBeenCalledWith('/')
    expect(mockPush).toHaveBeenCalledTimes(1)
  })

  it('should have proper breadcrumb structure with separators', () => {
    render(<TripHeader tripName="Paris Adventure" sectionName="Schedule" />)
    
    const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i })
    const listItems = breadcrumb.querySelectorAll('li')
    
    // Should have 3 items: Trips, Paris Adventure, Schedule
    expect(listItems).toHaveLength(3)
    
    // Check separators exist between items
    const separators = breadcrumb.querySelectorAll('span[aria-hidden="true"]')
    expect(separators.length).toBeGreaterThan(0)
  })

  it('should apply correct styling to last breadcrumb item', () => {
    render(<TripHeader tripName="Paris Adventure" />)
    
    const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i })
    const lastItem = breadcrumb.querySelector('li:last-child span')
    
    expect(lastItem).toBeInTheDocument()
    // The last item should have primary text color and medium font weight
    expect(lastItem).toHaveStyle({
      color: 'var(--color-text-primary)',
    })
  })

  it('should handle long trip names with ellipsis', () => {
    const longTripName = 'A Very Long Trip Name That Should Be Truncated With Ellipsis When It Exceeds The Maximum Width'
    render(<TripHeader tripName={longTripName} />)
    
    const tripNameElement = screen.getByText(longTripName)
    expect(tripNameElement).toBeInTheDocument()
    // Check that it has text-overflow: ellipsis style
    expect(tripNameElement).toHaveStyle({
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    })
  })

  it('should have minimum height of 44px for back button (accessibility)', () => {
    render(<TripHeader tripName="Paris Adventure" />)
    
    const backButton = screen.getByRole('button', { name: /back to trips/i })
    expect(backButton).toHaveStyle({
      minHeight: '44px',
    })
  })
})
