import { test, expect } from '@playwright/test'

test.describe('E2E-02: Create Trip', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Clear localStorage for clean state
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should create a new trip', async ({ page }) => {
    // Check PageHeader is visible
    await expect(page.locator('h1:has-text("Trips")')).toBeVisible()
    
    // Click create trip button
    await page.click('button:has-text("Create Trip")')

    // Fill in form
    await page.fill('input[name="title"]', 'Paris Adventure')
    await page.fill('input[name="startDate"]', '2024-06-01')
    await page.fill('input[name="endDate"]', '2024-06-10')
    await page.fill('input[name="baseLocation"]', 'Paris, France')

    // Submit form
    await page.click('button:has-text("Create")')

    // Verify trip appears in list (new card layout)
    await expect(page.locator('text=Paris Adventure')).toBeVisible()
    // Check date range format
    await expect(page.locator('text=Jun')).toBeVisible()
    await expect(page.locator('text=Paris, France')).toBeVisible()
  })

  test('should cancel trip creation', async ({ page }) => {
    await page.click('text=Create Trip')
    await page.click('button:has-text("Cancel")')
    
    // Form should be hidden
    await expect(page.locator('form')).not.toBeVisible()
  })
})

