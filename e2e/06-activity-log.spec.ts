import { test, expect } from '@playwright/test'

test.describe('E2E-06: Activity Log', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Create a trip
    await page.click('text=Create Trip')
    await page.fill('input[name="title"]', 'Activity Trip')
    await page.fill('input[name="startDate"]', '2024-06-01')
    await page.fill('input[name="endDate"]', '2024-06-05')
    await page.fill('input[name="baseLocation"]', 'Location')
    await page.click('button:has-text("Create")')
    await page.click('text=Activity Trip')
    
    // Navigate to Activity Logs tab
    await page.click('button[role="tab"]:has-text("Activity Logs")')
    await expect(page.locator('button[role="tab"][aria-selected="true"]:has-text("Activity Logs")')).toBeVisible()
  })

  test('should add activity log entry', async ({ page }) => {
    await page.click('button:has-text("Add Log")')

    // Fill in form
    await page.fill('input[type="datetime-local"]', '2024-06-02T15:00')
    await page.fill('input[name="title"]', 'Completed Chapter 1')
    await page.fill('textarea[name="notes"]', 'Learned about React hooks')
    await page.fill('input[name="tags"]', 'react, hooks, learning')

    await page.click('button[type="submit"]:has-text("Add")')

    // Verify log appears
    await expect(page.locator('text=Completed Chapter 1')).toBeVisible()
    await expect(page.locator('text=Learned about React hooks')).toBeVisible()
    // Tags are rendered as spans, check they exist
    await expect(page.locator('text=react').first()).toBeVisible()
    await expect(page.locator('text=hooks').first()).toBeVisible()
    await expect(page.locator('text=learning').first()).toBeVisible()
  })

  test('should add activity log with LINK artifact', async ({ page }) => {
    await page.click('text=Add Log')

    await page.fill('input[type="datetime-local"]', '2024-06-02T15:00')
    await page.fill('input[name="title"]', 'Found useful resource')
    await page.fill('textarea[name="notes"]', 'Great tutorial')
    await page.selectOption('select[name="artifactType"]', 'LINK')
    await page.fill('input[name="artifactUrl"]', 'https://example.com/tutorial')

    await page.click('button[type="submit"]:has-text("Add")')

    // Verify log and artifact
    await expect(page.locator('text=Found useful resource')).toBeVisible()
    const link = page.locator('a[href="https://example.com/tutorial"]')
    await expect(link).toBeVisible()
    await expect(link).toHaveText('https://example.com/tutorial')
  })

  test('should add activity log with NOTE artifact', async ({ page }) => {
    await page.click('text=Add Log')

    await page.fill('input[type="datetime-local"]', '2024-06-02T15:00')
    await page.fill('input[name="title"]', 'Key insights')
    await page.fill('textarea[name="notes"]', 'Important notes')
    await page.selectOption('select[name="artifactType"]', 'NOTE')
    await page.fill('textarea[name="artifactText"]', 'Remember: Always use useEffect for side effects')

    await page.click('button[type="submit"]:has-text("Add")')

    // Verify log and artifact
    await expect(page.locator('text=Key insights')).toBeVisible()
    await expect(page.locator('text=Remember: Always use useEffect for side effects')).toBeVisible()
  })

  test('should display logs in reverse chronological order', async ({ page }) => {
    // Add first log
    await page.click('button:has-text("Add Log")')
    await page.fill('input[type="datetime-local"]', '2024-06-02T10:00')
    await page.fill('input[name="title"]', 'First Log')
    await page.click('button[type="submit"]:has-text("Add")')

    // Add second log (later time)
    await page.click('button:has-text("Add Log")')
    await page.fill('input[type="datetime-local"]', '2024-06-02T15:00')
    await page.fill('input[name="title"]', 'Second Log')
    await page.click('button[type="submit"]:has-text("Add")')

    // Second log should appear first (newest first)
    const firstLog = page.locator('text=First Log')
    const secondLog = page.locator('text=Second Log')
    
    // Get the bounding boxes to check order
    const secondBox = await secondLog.boundingBox()
    const firstBox = await firstLog.boundingBox()
    
    // Second log should be above first log (smaller y coordinate = newer first)
    expect(secondBox?.y).toBeLessThan(firstBox?.y || Infinity)
  })
})

