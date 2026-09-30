import { expect, type Locator, type Page } from '@playwright/test'

export function gap(kind: 'FAIL' | 'NOT_IMPLEMENTED', message: string) {
  return `${kind}: ${message}`
}

export async function gotoApp(page: Page, path: string) {
  await page.goto(path)
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
}

export function cardByHeading(page: Page, title: string | RegExp): Locator {
  return page
    .locator('div')
    .filter({ has: page.getByRole('heading', { level: 3, name: title }) })
    .filter({
      has: page.getByRole('link', { name: /Подробнее|Открыть/ }),
    })
    .last()
}

export function textbox(page: Page, name: string | RegExp): Locator {
  return page.getByRole('textbox', { name })
}

export function cardWithAction(
  page: Page,
  heading: string,
  action: string | RegExp,
  role: 'button' | 'link' = 'button',
): Locator {
  return page
    .locator('div')
    .filter({ has: page.getByRole('heading', { level: 3, name: heading, exact: true }) })
    .filter({ has: page.getByRole(role, { name: action, exact: typeof action === 'string' }) })
    .last()
}

export function sectionByHeading(page: Page, title: string): Locator {
  return page.locator('section').filter({ has: page.getByRole('heading', { name: title }) })
}

export async function chooseSelect(page: Page, label: string, option: string) {
  await page.getByLabel(label, { exact: true }).click()
  await page.getByRole('option', { name: option, exact: true }).click()
}

/** RegionAutocomplete (freeSolo combobox) — type to filter, then pick. */
export async function chooseRegion(page: Page, option: string) {
  const field = page.getByLabel('Регион', { exact: true })
  await field.click()
  await field.fill(option)
  await page.getByRole('option', { name: option, exact: true }).click()
}

export async function horizontalOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  )
}

export async function fillProposal(page: Page, description: string, price = '455000') {
  await page.getByLabel(/Стоимость/).fill(price)
  await page.getByLabel(/Срок, дней/).fill('40')
  await page.getByLabel('Описание предложения').fill(description)
  await page.getByLabel('Что включено').fill('Дизайн, интеграция с 1С')
  // case_ref is optional and must be a real company case — leave «Без привязки»
}

const OPPORTUNITY_TEXT =
  'Нужен подрядчик на разработку CRM для медицинской компании. Бюджет до 500 тысяч. React, интеграция с 1С. Срок два месяца.'

export async function reachOpportunityForm(page: Page, text = OPPORTUNITY_TEXT) {
  await page.getByLabel('Описание задачи').fill(text)
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await expect(page.getByRole('heading', { name: 'Мы поняли ваш запрос так' })).toBeVisible()
  await page.getByRole('button', { name: 'Редактировать и опубликовать' }).click()
  await expect(page.getByLabel('Название')).toBeVisible()
}
