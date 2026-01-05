import { test, expect } from '@playwright/test'

test.describe('E2E-07: Seeded Data', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Clear all data to test fresh seed
    await page.evaluate(() => {
      localStorage.clear()
    })
    await page.reload()
  })

  test('should show multiple trips immediately on fresh load', async ({ page }) => {
    // After reload, seed data should be initialized
    await page.waitForTimeout(500) // Allow seed to initialize
    
    // Should see multiple trips
    const tripCards = page.locator('text=Frankfurt Foundations, text=Kyoto Culture Sprint, text=Costa Rica Nature Lab')
    await expect(tripCards.first()).toBeVisible({ timeout: 5000 })
    
    // Count trip cards
    const trips = page.locator('a[href^="/trips/"]')
    const count = await trips.count()
    expect(count).toBeGreaterThanOrEqual(3)
  })

  test('should show seeded trips for all demo users', async ({ page }) => {
    await page.waitForTimeout(500)
    
    // Check Alice's trips
    await expect(page.locator('text=Frankfurt Foundations')).toBeVisible()
    await expect(page.locator('text=Kyoto Culture Sprint')).toBeVisible()
    await expect(page.locator('text=Costa Rica Nature Lab')).toBeVisible()
    
    // Switch to Bob
    const select = page.locator('select[aria-label="Select demo user"], select')
    await select.selectOption('bob')
    await page.waitForTimeout(300)
    
    // Bob should also have trips
    await expect(page.locator('text=Frankfurt Foundations')).toBeVisible()
    
    // Switch to Sam
    await select.selectOption('sam')
    await page.waitForTimeout(300)
    
    // Sam should also have trips
    await expect(page.locator('text=Frankfurt Foundations')).toBeVisible()
  })

  test('should show populated itinerary in trip detail', async ({ page }) => {
    await page.waitForTimeout(500)
    
    // Click on a trip
    await page.click('text=Frankfurt Foundations')
    
    // Wait for tabs to load
    await expect(page.locator('button[role="tab"]:has-text("Itinerary")')).toBeVisible()
    
    // Itinerary tab should be populated (not empty)
    const itineraryItems = page.locator('text=Morning Museum Visit, text=City Walking Tour, text=Language Exchange Meetup')
    await expect(itineraryItems.first()).toBeVisible({ timeout: 5000 })
  })

  test('should show populated schedule blocks in trip detail', async ({ page }) => {
    await page.waitForTimeout(500)
    
    await page.click('text=Frankfurt Foundations')
    await page.click('button[role="tab"]:has-text("Schedule")')
    
    // Schedule should have blocks
    const scheduleBlocks = page.locator('text=Learning Block')
    const count = await scheduleBlocks.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should show populated activity logs in trip detail', async ({ page }) => {
    await page.waitForTimeout(500)
    
    await page.click('text=Frankfurt Foundations')
    await page.click('button[role="tab"]:has-text("Activity Logs")')
    
    // Logs should be populated
    const logs = page.locator('text=Completed Chapter 1, text=Grammar Practice Session, text=Vocabulary Building')
    await expect(logs.first()).toBeVisible({ timeout: 5000 })
  })

  test('should show learning target in trip detail', async ({ page }) => {
    await page.waitForTimeout(500)
    
    await page.click('text=Frankfurt Foundations')
    await page.click('button[role="tab"]:has-text("Learning Targets")')
    
    // Learning target should be set
    await expect(page.locator('text=15 min/day, text=60 min/day, text=7 hrs/week').first()).toBeVisible({ timeout: 5000 })
  })

  test('should reset demo data and re-seed on reload', async ({ page }) => {
    await page.waitForTimeout(500)
    
    // Verify trips exist
    await expect(page.locator('text=Frankfurt Foundations')).toBeVisible()
    
    // Click reset button
    await page.click('button:has-text("Reset Demo Data")')
    
    // Wait for reload
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(500)
    
    // Trips should be back after reload
    await expect(page.locator('text=Frankfurt Foundations')).toBeVisible({ timeout: 5000 })
  })
})

