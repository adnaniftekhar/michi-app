import { test, expect } from '@playwright/test'

test.describe('E2E-04: Set Learning Target', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Create a trip
    await page.click('text=Create Trip')
    await page.fill('input[name="title"]', 'Learning Trip')
    await page.fill('input[name="startDate"]', '2024-06-01')
    await page.fill('input[name="endDate"]', '2024-06-05')
    await page.fill('input[name="baseLocation"]', 'Location')
    await page.click('button:has-text("Create")')
    await page.click('text=Learning Trip')
    
    // Navigate to Learning Targets tab
    await page.click('button[role="tab"]:has-text("Learning Targets")')
    await expect(page.locator('button[role="tab"][aria-selected="true"]:has-text("Learning Targets")')).toBeVisible()
  })

  test('should set 15 min/day track', async ({ page }) => {
    await page.click('button:has-text("Set Target"), button:has-text("Edit")')

    await page.selectOption('select[name="track"]', '15min')
    await page.click('button[type="submit"]:has-text("Save")')

    await expect(page.locator('text=15 min/day')).toBeVisible()
  })

  test('should set 60 min/day track', async ({ page }) => {
    // First set a target
    await page.click('button:has-text("Set Target")')
    await page.selectOption('select[name="track"]', '15min')
    await page.click('button[type="submit"]:has-text("Save")')
    
    // Then edit it
    await page.click('button:has-text("Edit")')
    await page.selectOption('select[name="track"]', '60min')
    await page.click('button[type="submit"]:has-text("Save")')

    await expect(page.locator('text=60 min/day')).toBeVisible()
  })

  test('should set 4 hrs/day track', async ({ page }) => {
    // First set a target
    await page.click('button:has-text("Set Target")')
    await page.selectOption('select[name="track"]', '15min')
    await page.click('button[type="submit"]:has-text("Save")')
    
    // Then edit it
    await page.click('button:has-text("Edit")')
    await page.selectOption('select[name="track"]', '4hrs')
    await page.click('button[type="submit"]:has-text("Save")')

    await expect(page.locator('text=4 hrs/day')).toBeVisible()
  })

  test('should set weekly hours track with valid hours', async ({ page }) => {
    await page.click('button:has-text("Set Target")')
    await page.selectOption('select[name="track"]', 'weekly')
    await page.fill('input[name="weeklyHours"]', '7')
    await page.click('button[type="submit"]:has-text("Save")')

    await expect(page.locator('text=7 hrs/week')).toBeVisible()
  })

  test('should reject weekly hours if <= 0', async ({ page }) => {
    await page.click('button:has-text("Set Target")')

    await page.selectOption('select[name="track"]', 'weekly')
    await page.fill('input[name="weeklyHours"]', '0')
    
    // Submit - error should appear inline
    await page.click('button[type="submit"]:has-text("Save")')
    
    // Check for error message
    await expect(page.locator('text=Weekly hours must be greater than 0')).toBeVisible()
  })
})

