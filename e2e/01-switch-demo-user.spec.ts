import { test, expect } from '@playwright/test'

test.describe('E2E-01: Switch Demo User', () => {
  test('should switch between demo users', async ({ page }) => {
    await page.goto('/')

    // Check default user (Alice) - new UI uses Select component
    const select = page.locator('select[aria-label="Select demo user"], select')
    await expect(select).toHaveValue('alice')

    // Switch to Bob
    await select.selectOption('bob')
    await expect(select).toHaveValue('bob')

    // Switch to Sam
    await select.selectOption('sam')
    await expect(select).toHaveValue('sam')

    // Switch back to Alice
    await select.selectOption('alice')
    await expect(select).toHaveValue('alice')
  })

  test('should persist user selection', async ({ page, context }) => {
    await page.goto('/')
    
    // Switch to Bob
    const select = page.locator('select[aria-label="Select demo user"], select')
    await select.selectOption('bob')
    await expect(select).toHaveValue('bob')

    // Reload page
    await page.reload()
    
    // Should still be Bob
    await expect(select).toHaveValue('bob')
  })

  test('should show demo user selector in header', async ({ page }) => {
    await page.goto('/')
    
    // Check header contains demo user selector
    const header = page.locator('header')
    await expect(header).toBeVisible()
    await expect(header.locator('text=Demo User:')).toBeVisible()
    await expect(header.locator('select')).toBeVisible()
  })
})

