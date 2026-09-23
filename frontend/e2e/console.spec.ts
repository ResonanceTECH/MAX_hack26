import { expect, test } from '@playwright/test'

const paths = [
  '/',
  '/opportunities',
  '/opportunities/opp-crm-clinics',
  '/opportunities/create',
  '/companies',
  '/companies/company-techflow',
  '/my',
  '/my/requests',
  '/my/proposals',
  '/my/shortlist',
  '/my/negotiations',
  '/opportunities/opp-crm-clinics/proposals',
  '/opportunities/opp-crm-clinics/compare',
  '/proposals/prop-1',
  '/deals/deal-1',
  '/notifications',
  '/profile/company',
  '/favorites',
  '/missing-page',
]

test('[CONSOLE-01] critical routes do not throw', async ({ page }) => {
  const pageErrors: string[] = []
  const consoleErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    const text = message.text()
    if (/favicon/i.test(text)) return
    consoleErrors.push(text)
  })
  for (const path of paths) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
  }
  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
