import { test, expect } from '@playwright/test'

test.describe('E2E-05: Generate Schedule Blocks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Create a trip
    await page.click('text=Create Trip')
    await page.fill('input[name="title"]', 'Schedule Trip')
    await page.fill('input[name="startDate"]', '2024-06-01')
    await page.fill('input[name="endDate"]', '2024-06-03') // 3 days
    await page.fill('input[name="baseLocation"]', 'Location')
    await page.click('button:has-text("Create")')
    await page.click('text=Schedule Trip')
    
    // Navigate to Schedule tab
    await page.click('button[role="tab"]:has-text("Schedule")')
    await expect(page.locator('button[role="tab"][aria-selected="true"]:has-text("Schedule")')).toBeVisible()
  })

  test('should require learning target before generating', async ({ page }) => {
    // The Generate Schedule button should be disabled or show message
    const generateButton = page.locator('button:has-text("Generate Schedule"), button:has-text("Set learning target first")')
    await expect(generateButton).toBeVisible()
  })

  test('should generate blocks for 15min track', async ({ page }) => {
    // Navigate to Learning Targets tab
    await page.click('button[role="tab"]:has-text("Learning Targets")')
    await page.click('button:has-text("Set Target")')
    await page.selectOption('select[name="track"]', '15min')
    await page.click('button[type="submit"]:has-text("Save")')

    // Navigate back to Schedule tab
    await page.click('button[role="tab"]:has-text("Schedule")')
    
    // Generate schedule
    await page.click('button:has-text("Generate Schedule")')

    // Should have 3 blocks (one per day)
    const blocks = page.locator('text=Learning Block')
    await expect(blocks).toHaveCount(3)

    // Check duration
    const firstBlock = page.locator('text=Learning Block').first()
    await expect(firstBlock.locator('..')).toContainText('15 min')
  })

  test('should generate blocks for 60min track', async ({ page }) => {
    // First set a target
    await page.click('button[role="tab"]:has-text("Learning Targets")')
    await page.click('button:has-text("Set Target")')
    await page.selectOption('select[name="track"]', '15min')
    await page.click('button[type="submit"]:has-text("Save")')
    
    // Then edit it
    await page.click('button:has-text("Edit")')
    await page.selectOption('select[name="track"]', '60min')
    await page.click('button[type="submit"]:has-text("Save")')

    await page.click('button[role="tab"]:has-text("Schedule")')
    await page.click('button:has-text("Generate Schedule")')

    const blocks = page.locator('text=Learning Block')
    await expect(blocks).toHaveCount(3)
    
    const firstBlock = page.locator('text=Learning Block').first()
    await expect(firstBlock.locator('..')).toContainText('60 min')
  })

  test('should generate blocks for weekly track', async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Learning Targets")')
    await page.click('button:has-text("Set Target")')
    await page.selectOption('select[name="track"]', 'weekly')
    await page.fill('input[name="weeklyHours"]', '7')
    await page.click('button[type="submit"]:has-text("Save")')

    await page.click('button[role="tab"]:has-text("Schedule")')
    await page.click('button:has-text("Generate Schedule")')

    const blocks = page.locator('text=Learning Block')
    await expect(blocks).toHaveCount(3)
  })

  test('should replace only generated blocks on regenerate', async ({ page }) => {
    // Set target and generate
    await page.click('button[role="tab"]:has-text("Learning Targets")')
    await page.click('button:has-text("Set Target")')
    await page.selectOption('select[name="track"]', '15min')
    await page.click('button[type="submit"]:has-text("Save")')
    
    await page.click('button[role="tab"]:has-text("Schedule")')
    await page.click('button:has-text("Generate Schedule")')

    // Change target and regenerate
    await page.click('button[role="tab"]:has-text("Learning Targets")')
    await page.click('button:has-text("Edit")')
    await page.selectOption('select[name="track"]', '60min')
    await page.click('button[type="submit"]:has-text("Save")')
    
    await page.click('button[role="tab"]:has-text("Schedule")')
    await page.click('button:has-text("Generate Schedule")')

    // Should still have 3 blocks
    const blocks = page.locator('text=Learning Block')
    await expect(blocks).toHaveCount(3)
    
    // Duration should be updated
    const firstBlock = page.locator('text=Learning Block').first()
    await expect(firstBlock.locator('..')).toContainText('60 min')
  })
})

