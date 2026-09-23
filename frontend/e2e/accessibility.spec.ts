import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

async function seriousViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze()
  return results.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact ?? ''),
  )
}

const pages = [
  ['/', 'home'],
  ['/opportunities', 'opportunities'],
  ['/opportunities/opp-crm-clinics', 'opportunity'],
  ['/companies', 'companies'],
  ['/companies/company-techflow', 'company'],
  ['/opportunities/create', 'create'],
  ['/opportunities/opp-crm-clinics/compare', 'comparison'],
] as const

test('[A11Y-01] [A11Y-08] keyboard reaches a control and activates it', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const find = page.getByRole('main').getByRole('link', { name: 'Найти заказ' })
  await find.focus()
  await expect(find).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/opportunities/)
})

test('[A11Y-02] search fields have labels', async ({ page }) => {
  await page.goto('/opportunities')
  await expect(page.getByRole('textbox', { name: 'Поиск возможностей' })).toBeVisible()
  await page.goto('/companies')
  await expect(page.getByRole('textbox', { name: 'Поиск компаний' })).toBeVisible()
})

test('[A11Y-03] icon buttons have names', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/opportunities/opp-crm-clinics')
  await expect(page.getByRole('button', { name: 'Убрать из избранного' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Поделиться' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Уведомления/ })).toBeVisible()
})

test('[A11Y-04] focused controls keep a visible outline', async ({ page }) => {
  await page.goto('/opportunities')
  const search = page.getByRole('textbox', { name: 'Поиск возможностей' })
  await search.focus()
  const outline = await search.evaluate((node) => getComputedStyle(node).outlineStyle)
  const focused = await page.evaluate(() => {
    const active = document.activeElement
    if (!active) return 'none'
    return getComputedStyle(active).outlineStyle
  })
  expect(outline === 'none' && focused === 'none').toBe(false)
})

test('[A11Y-05] form errors are tied to the fields', async ({ page }) => {
  await page.goto('/opportunities/opp-mobile-app/propose')
  await expect(page.getByLabel(/Стоимость/)).toBeVisible()
  await page.getByRole('button', { name: 'Отправить предложение' }).click()
  const price = page.getByLabel(/Стоимость/)
  await expect(price).toHaveAttribute('aria-invalid', 'true')
  await expect(price).toHaveAttribute('aria-describedby', /.+/ )
})

test('[A11Y-06] match score includes text', async ({ page }) => {
  await page.goto('/opportunities/opp-crm-clinics')
  await expect(page.getByText(/94% соответствия/)).toBeVisible()
})

test('[A11Y-07] statuses include text', async ({ page }) => {
  await page.goto('/opportunities/opp-crm-clinics')
  await expect(page.getByText('Сбор предложений')).toBeVisible()
})

for (const [path, name] of pages) {
  test(`[A11Y-AXE] ${name}`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
    const violations = await seriousViolations(page)
    expect(
      violations.map((violation) => `${violation.id}: ${violation.help}`),
      `axe serious/critical on ${path}`,
    ).toEqual([])
  })
}
