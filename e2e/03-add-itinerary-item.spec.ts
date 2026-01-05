import { test, expect } from '@playwright/test'

test.describe('E2E-03: Add Itinerary Item', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Create a trip first
    await page.click('text=Create Trip')
    await page.fill('input[name="title"]', 'Test Trip')
    await page.fill('input[name="startDate"]', '2024-06-01')
    await page.fill('input[name="endDate"]', '2024-06-05')
    await page.fill('input[name="baseLocation"]', 'Test Location')
    await page.click('button:has-text("Create")')

    // Navigate to trip detail
    await page.click('text=Test Trip')
    
    // Wait for tabs to load
    await expect(page.locator('button[role="tab"]:has-text("Itinerary")')).toBeVisible()
  })

  test('should add itinerary item', async ({ page }) => {
    // Ensure we're on Itinerary tab (should be default)
    await expect(page.locator('button[role="tab"][aria-selected="true"]:has-text("Itinerary")')).toBeVisible()
    
    // Click add item button
    await page.click('button:has-text("Add Item")')

    // Fill in form
    await page.fill('input[type="datetime-local"]', '2024-06-02T14:30')
    await page.fill('input[name="title"]', 'Visit Eiffel Tower')
    await page.fill('input[name="location"]', 'Champ de Mars, Paris')
    await page.fill('textarea[name="notes"]', 'Bring camera')

    // Submit form
    await page.click('button[type="submit"]:has-text("Add")')

    // Verify item appears
    await expect(page.locator('text=Visit Eiffel Tower')).toBeVisible()
    await expect(page.locator('text=Champ de Mars, Paris')).toBeVisible()
    await expect(page.locator('text=Bring camera')).toBeVisible()
  })

  test('should display items sorted by date/time', async ({ page }) => {
    // Add first item
    await page.click('button:has-text("Add Item")')
    await page.fill('input[type="datetime-local"]', '2024-06-03T10:00')
    await page.fill('input[name="title"]', 'Second Item')
    await page.fill('input[name="location"]', 'Location 2')
    await page.click('button[type="submit"]:has-text("Add")')

    // Add second item (earlier date)
    await page.click('button:has-text("Add Item")')
    await page.fill('input[type="datetime-local"]', '2024-06-02T09:00')
    await page.fill('input[name="title"]', 'First Item')
    await page.fill('input[name="location"]', 'Location 1')
    await page.click('button[type="submit"]:has-text("Add")')

    // Check order (first item should appear before second)
    const firstItem = page.locator('text=First Item')
    const secondItem = page.locator('text=Second Item')
    
    // Get the bounding boxes to check order
    const firstBox = await firstItem.boundingBox()
    const secondBox = await secondItem.boundingBox()
    
    // First item should be above second item (smaller y coordinate)
    expect(firstBox?.y).toBeLessThan(secondBox?.y || Infinity)
  })
})

