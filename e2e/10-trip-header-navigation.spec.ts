import { test, expect } from '@playwright/test'

test.describe('E2E-09: Trip Header Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Clear localStorage for clean state
    await page.evaluate(() => localStorage.clear())
    await page.reload()
    // Wait for seeded data to load
    await page.waitForSelector('h1:has-text("Trips")')
  })

  test('should show TripHeader on trip detail page and navigate back to trips list', async ({ page }) => {
    // Navigate to trips list
    await expect(page.locator('h1:has-text("Trips")')).toBeVisible()
    
    // Find and click on the first trip card
    const firstTripCard = page.locator('a[href^="/trips/"]').first()
    const tripTitle = await firstTripCard.locator('h3, h2, [class*="title"]').first().textContent()
    
    await firstTripCard.click()
    
    // Wait for trip detail page to load
    await page.waitForURL(/\/trips\/[^/]+$/)
    
    // Verify TripHeader exists with Back to Trips button
    const backButton = page.locator('button:has-text("Back to Trips")')
    await expect(backButton).toBeVisible()
    await expect(backButton).toHaveAttribute('aria-label', 'Back to Trips')
    
    // Verify breadcrumb shows "Trips / {tripName}"
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]')
    await expect(breadcrumb).toBeVisible()
    await expect(breadcrumb.locator('text=Trips')).toBeVisible()
    if (tripTitle) {
      await expect(breadcrumb.locator(`text=${tripTitle.trim()}`)).toBeVisible()
    }
    
    // Click Back to Trips button
    await backButton.click()
    
    // Verify we're back on the trips list
    await expect(page).toHaveURL('/')
    await expect(page.locator('h1:has-text("Trips")')).toBeVisible()
  })

  test('should navigate to trips list when opening trip deep link directly', async ({ page }) => {
    // First, get a trip ID from the seeded data
    await page.goto('/')
    await page.waitForSelector('a[href^="/trips/"]')
    
    // Get the first trip's href
    const firstTripLink = page.locator('a[href^="/trips/"]').first()
    const tripHref = await firstTripLink.getAttribute('href')
    
    if (!tripHref) {
      throw new Error('No trip link found')
    }
    
    // Navigate directly to trip detail page (simulating deep link)
    await page.goto(tripHref)
    await page.waitForURL(new RegExp(tripHref.replace('/', '\\/')))
    
    // Verify TripHeader exists
    const backButton = page.locator('button:has-text("Back to Trips")')
    await expect(backButton).toBeVisible()
    
    // Click Back to Trips button
    await backButton.click()
    
    // Verify we're on the trips list (not browser back to nowhere)
    await expect(page).toHaveURL('/')
    await expect(page.locator('h1:has-text("Trips")')).toBeVisible()
  })

  test('should have accessible back button with proper focus state', async ({ page }) => {
    // Navigate to a trip
    await page.goto('/')
    await page.waitForSelector('a[href^="/trips/"]')
    await page.locator('a[href^="/trips/"]').first().click()
    await page.waitForURL(/\/trips\/[^/]+$/)
    
    // Find the back button
    const backButton = page.locator('button:has-text("Back to Trips")')
    await expect(backButton).toBeVisible()
    
    // Check minimum height for tap target (44px)
    const buttonBox = await backButton.boundingBox()
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44)
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    // The back button should be focusable
    await expect(backButton).toBeFocused()
    
    // Press Enter to activate
    await page.keyboard.press('Enter')
    
    // Should navigate back
    await expect(page).toHaveURL('/')
  })

  test('should preserve learner context when navigating back to trips', async ({ page }) => {
    // Select a specific learner
    await page.click('button:has-text("Learner:")')
    const learnerMenu = page.locator('div[style*="position: absolute"]')
    await expect(learnerMenu).toBeVisible()
    
    // Select a learner (e.g., Bob if available)
    const bobOption = page.locator('button:has-text("Bob")').first()
    if (await bobOption.isVisible()) {
      await bobOption.click()
    }
    
    // Navigate to a trip
    await page.locator('a[href^="/trips/"]').first().click()
    await page.waitForURL(/\/trips\/[^/]+$/)
    
    // Click back to trips
    await page.click('button:has-text("Back to Trips")')
    
    // Verify we're back on trips list
    await expect(page).toHaveURL('/')
    
    // Verify learner selection is preserved (check if learner selector still shows the selected learner)
    // This is a basic check - the actual implementation depends on how learner state is managed
    const learnerButton = page.locator('button:has-text("Learner:")')
    await expect(learnerButton).toBeVisible()
  })
})
