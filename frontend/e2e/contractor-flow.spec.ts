import { expect, test } from '@playwright/test'
import { fillProposal, gap } from './helpers'

const DESC = 'Критический отклик Business User: CRM для клиник за 40 дней, интеграция с 1С, обучение.'

test('contractor flow: the same business user answers a foreign request', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Что нужно вашему бизнесу?' })).toBeVisible()
  await page.getByRole('link', { name: 'Возможности' }).click()
  await page.getByRole('textbox', { name: 'Поиск возможностей' }).fill('CRM для сети клиник')
  await page.getByRole('link', { name: 'Подробнее' }).first().click()
  await expect(page.getByRole('heading', { level: 1, name: 'Разработка CRM для сети клиник' })).toBeVisible()
  await expect(page.getByText(/94% соответствия/)).toBeVisible()
  await expect(page.getByText('Почему подходит вам')).toBeVisible()
  await expect(page.getByText('Есть опыт Healthcare')).toBeVisible()
  await page.getByRole('link', { name: 'Предложить решение' }).click()
  await fillProposal(page, DESC, '455000')
  await page.getByLabel(/Срок, дней/).fill('42')
  await page.getByRole('button', { name: 'Отправить предложение' }).click()
  await expect(page.getByRole('heading', { name: 'Предложение отправлено' })).toBeVisible()
  await page.getByRole('link', { name: 'Мои отклики' }).click()
  await expect(
    page.getByText(/455\s*000/),
    gap(
      'FAIL',
      'отклик записан в mock, но «Мои отклики» остаются на кэше useMyProposals (staleTime 30s, нет invalidate)',
    ),
  ).toBeVisible()
})
