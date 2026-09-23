import { expect, test } from '@playwright/test'
import { cardByHeading, horizontalOverflow } from './helpers'

const widths = [375, 390, 768, 1024, 1440]

test('[RESP-01] no horizontal overflow', async ({ page }) => {
  const failures: string[] = []
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/', '/opportunities', '/companies', '/opportunities/opp-crm-clinics']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
      if (await horizontalOverflow(page)) failures.push(`${width} ${path}`)
    }
  }
  expect(failures).toEqual([])
})

test('[RESP-02] bottom navigation on mobile', async ({ page }) => {
  for (const width of [375, 390]) {
    await page.setViewportSize({ width, height: 844 })
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Главная' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Создать', exact: true })).toBeVisible()
  }
})

test('[RESP-03] sidebar on desktop', async ({ page }) => {
  for (const width of [1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/')
    await expect(page.getByRole('navigation', { name: 'Основная навигация' })).toBeVisible()
  }
})

test('[RESP-04] filter drawer on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/opportunities')
  await page.getByRole('button', { name: 'Открыть фильтры' }).click()
  const apply = page.getByRole('button', { name: 'Применить' })
  const heading = page.getByRole('heading', { name: 'Фильтры' })
  await expect(heading).toBeVisible()
  await expect(apply).toBeVisible()
  for (const box of [await heading.boundingBox(), await apply.boundingBox()]) {
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(-1)
    expect(box!.y).toBeGreaterThanOrEqual(-1)
    expect(box!.x + box!.width).toBeLessThanOrEqual(391)
    expect(box!.y + box!.height).toBeLessThanOrEqual(845)
  }
})

test('[RESP-05] comparison is usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/opportunities/opp-crm-clinics/compare')
  await expect(page.getByRole('table', { name: 'Сравнение предложений' })).toBeVisible()
  expect(await horizontalOverflow(page)).toBe(false)
  await expect(page.getByRole('columnheader', { name: 'Digital Lab' })).toBeVisible()
})

test('[RESP-06] sticky CTA does not cover bottom navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/opportunities/opp-crm-clinics')
  const cta = page.getByRole('link', { name: 'Предложить решение' })
  const nav = page.locator('.MuiBottomNavigation-root')
  await expect(cta).toBeVisible()
  await expect(nav).toBeVisible()
  const ctaBox = await cta.boundingBox()
  const navBox = await nav.boundingBox()
  expect(ctaBox).not.toBeNull()
  expect(navBox).not.toBeNull()
  expect(ctaBox!.y + ctaBox!.height).toBeLessThanOrEqual(navBox!.y + 1)
})

test('[RESP-07] dialogs fit the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await cardByHeading(page, 'Разработка CRM для сети клиник')
    .getByRole('button', { name: /Match Score 94/ })
    .click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  const box = await dialog.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(-1)
  expect(box!.y).toBeGreaterThanOrEqual(-1)
  expect(box!.x + box!.width).toBeLessThanOrEqual(391)
  expect(box!.y + box!.height).toBeLessThanOrEqual(845)
})

test('[RESP-08] long titles do not overflow the heading', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/opportunities/opp-logistics-ural')
  const overflow = await page.locator('h1').evaluate((node) => {
    const parent = node.parentElement
    if (!parent) return true
    return node.scrollWidth > parent.clientWidth + 1
  })
  expect(overflow).toBe(false)
})
