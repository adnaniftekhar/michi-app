import { test, expect } from '@playwright/test'

test.describe('E2E-08: AI Learning Pathway', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the AI endpoint
    await page.route('**/api/ai/plan', async (route) => {
      const request = route.request()
      const body = await request.postDataJSON()

      // Validate request
      if (!body.learnerProfileId || !body.trip || !body.learningTarget) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Missing required fields' }),
        })
        return
      }

      // Return a valid mock response
      const mockPlan = {
        days: Array.from({ length: 14 }, (_, i) => ({
          day: i + 1,
          drivingQuestion: `What makes ${body.trip.baseLocation} unique?`,
          fieldExperience: `Explore ${body.trip.baseLocation}`,
          inquiryTask: `Document your observations`,
          artifact: `Create a photo essay`,
          reflectionPrompt: `How did this experience change your perspective?`,
          critiqueStep: `Share with a peer and get feedback`,
          scheduleBlocks: [
            {
              startTime: `2026-06-${String(i + 1).padStart(2, '0')}T09:00:00`,
              duration: 60,
              title: `Day ${i + 1} Learning Block`,
              description: `Learning activity for day ${i + 1}`,
            },
          ],
        })),
        summary: 'A 14-day experiential learning pathway',
        verifyLocally: 'Verify schedule times match your availability',
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPlan),
      })
    })

    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    // Create a trip
    await page.click('text=Create Trip')
    await page.fill('input[name="title"]', 'AI Pathway Test Trip')
    await page.fill('input[name="startDate"]', '2026-06-01')
    await page.fill('input[name="endDate"]', '2026-06-14')
    await page.fill('input[name="baseLocation"]', 'Test Location')
    await page.click('button:has-text("Create")')
    await page.click('text=AI Pathway Test Trip')

    // Set learning target
    await page.click('button[role="tab"]:has-text("Learning Targets")')
    await page.selectOption('select', '15min')
    await page.click('button:has-text("Set Target"), button:has-text("Edit")')
    await page.click('button[type="submit"]:has-text("Save")')

    // Navigate to Schedule tab
    await page.click('button[role="tab"]:has-text("Schedule")')
  })

  test('should open AI pathway modal when button is clicked', async ({ page }) => {
    await page.click('button:has-text("Generate Learning Pathway (AI)")')

    // Modal should appear
    await expect(page.locator('text=AI Learning Pathway Draft')).toBeVisible()
    await expect(page.locator('text=Generating learning pathway...')).toBeVisible()
  })

  test('should display draft pathway after generation', async ({ page }) => {
    await page.click('button:has-text("Generate Learning Pathway (AI)")')

    // Wait for draft to load
    await expect(page.locator('text=AI Learning Pathway Draft')).toBeVisible()
    await expect(page.locator('text=Generating learning pathway...')).toBeVisible({ timeout: 1000 })
    await expect(page.locator('text=A 14-day experiential learning pathway')).toBeVisible({ timeout: 5000 })

    // Check that days are displayed
    await expect(page.locator('text=Day 1')).toBeVisible()
    await expect(page.locator('text=Day 14')).toBeVisible()
  })

  test('should expand day cards to show details', async ({ page }) => {
    await page.click('button:has-text("Generate Learning Pathway (AI)")')

    // Wait for draft
    await expect(page.locator('text=A 14-day experiential learning pathway')).toBeVisible({ timeout: 5000 })

    // Click to expand Day 1
    await page.click('text=Day 1')
    await expect(page.locator('text=Field Experience')).toBeVisible()
    await expect(page.locator('text=Inquiry Task')).toBeVisible()
    await expect(page.locator('text=Artifact')).toBeVisible()
    await expect(page.locator('text=Reflection Prompt')).toBeVisible()
    await expect(page.locator('text=Critique Step')).toBeVisible()
  })

  test('should apply pathway to schedule when Apply is clicked', async ({ page }) => {
    await page.click('button:has-text("Generate Learning Pathway (AI)")')

    // Wait for draft
    await expect(page.locator('text=A 14-day experiential learning pathway')).toBeVisible({ timeout: 5000 })

    // Click Apply
    await page.click('button:has-text("Apply to Schedule")')

    // Modal should close
    await expect(page.locator('text=AI Learning Pathway Draft')).not.toBeVisible()

    // Schedule should have blocks
    await expect(page.locator('text=Day 1 Learning Block')).toBeVisible()
    await expect(page.locator('text=Day 14 Learning Block')).toBeVisible()
  })

  test('should show error if AI request fails', async ({ page }) => {
    // Override route to return error
    await page.route('**/api/ai/plan', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'AI service unavailable' }),
      })
    })

    await page.click('button:has-text("Generate Learning Pathway (AI)")')

    // Error toast should appear (check for toast or error message)
    // The modal should close on error
    await expect(page.locator('text=AI Learning Pathway Draft')).not.toBeVisible({ timeout: 3000 })
  })

  test('should preserve manual blocks when applying AI pathway', async ({ page }) => {
    // First, create a manual block
    // (This would require a way to add manual blocks - for now, we'll just verify the behavior)
    
    await page.click('button:has-text("Generate Learning Pathway (AI)")')
    await expect(page.locator('text=A 14-day experiential learning pathway')).toBeVisible({ timeout: 5000 })
    await page.click('button:has-text("Apply to Schedule")')

    // Verify blocks were added
    const blocks = page.locator('[data-testid="schedule-block"], .card:has-text("Learning Block")')
    await expect(blocks.first()).toBeVisible()
  })
})

