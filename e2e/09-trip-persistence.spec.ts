import { test, expect } from '@playwright/test'

test.describe('Trip Persistence', () => {
  test('should persist trips across logout/login', async ({ page }) => {
    // Sign in
    await page.goto('/sign-in')
    await page.fill('input[name="identifier"]', 'test@example.com')
    await page.click('button[type="submit"]')
    // Wait for sign in to complete (adjust selectors based on your Clerk setup)
    await page.waitForURL('/home', { timeout: 10000 })

    // Create a trip
    await page.click('text=Create trip')
    await page.fill('input[name="title"]', 'Persistence Test Trip')
    await page.fill('input[name="startDate"]', '2026-06-01')
    await page.fill('input[name="endDate"]', '2026-06-07')
    await page.fill('input[name="baseLocation"]', 'Test Location')
    await page.click('button[type="submit"]')

    // Verify trip appears
    await expect(page.locator('text=Persistence Test Trip')).toBeVisible()

    // Logout
    // Note: Adjust selector based on your logout button
    await page.click('[aria-label="User menu"]')
    await page.click('text=Sign out')
    await page.waitForURL('/')

    // Sign in again
    await page.goto('/sign-in')
    await page.fill('input[name="identifier"]', 'test@example.com')
    await page.click('button[type="submit"]')
    await page.waitForURL('/home', { timeout: 10000 })

    // Verify trip still exists
    await expect(page.locator('text=Persistence Test Trip')).toBeVisible()
  })

  test('should not allow User A to access User B trips', async ({ page, context }) => {
    // Create a second browser context for User B
    const userBContext = await context.browser()?.newContext()
    if (!userBContext) {
      test.skip()
      return
    }
    const userBPage = await userBContext.newPage()

    try {
      // User A: Sign in and create a trip
      await page.goto('/sign-in')
      await page.fill('input[name="identifier"]', 'userA@example.com')
      await page.click('button[type="submit"]')
      await page.waitForURL('/home', { timeout: 10000 })

      await page.click('text=Create trip')
      await page.fill('input[name="title"]', 'User A Private Trip')
      await page.fill('input[name="startDate"]', '2026-06-01')
      await page.fill('input[name="endDate"]', '2026-06-07')
      await page.fill('input[name="baseLocation"]', 'Location A')
      await page.click('button[type="submit"]')

      const tripCard = page.locator('text=User A Private Trip')
      await expect(tripCard).toBeVisible()
      const tripHref = await tripCard.locator('..').getAttribute('href')
      const tripId = tripHref?.split('/').pop()

      // User B: Sign in
      await userBPage.goto('/sign-in')
      await userBPage.fill('input[name="identifier"]', 'userB@example.com')
      await userBPage.click('button[type="submit"]')
      await userBPage.waitForURL('/home', { timeout: 10000 })

      // User B: Try to access User A's trip via API
      const response = await userBPage.request.get(`/api/trips/${tripId}`)
      expect(response.status()).toBe(404)

      // User B: Try to update User A's trip
      const updateResponse = await userBPage.request.patch(`/api/trips/${tripId}`, {
        data: { title: 'Hacked Title' },
      })
      expect(updateResponse.status()).toBe(404)

      // User B: Try to delete User A's trip
      const deleteResponse = await userBPage.request.delete(`/api/trips/${tripId}`)
      expect(deleteResponse.status()).toBe(404)
    } finally {
      await userBPage.close()
      await userBContext.close()
    }
  })
})
