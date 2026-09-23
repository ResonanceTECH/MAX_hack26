import { expect, test } from '@playwright/test'

test('[STATE-COMP-EMPTY] companies empty state is explicit', async ({ page }) => {
  await page.goto('/companies')
  await page.getByRole('textbox', { name: 'Поиск компаний' }).fill('___нет_такой_компании___')
  await expect(page.getByText('Компании не найдены')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Сбросить' }).last()).toBeVisible()
})

test('[STATE-NOT-EMPTY] notifications are not a blank screen', async ({ page }) => {
  await page.goto('/notifications')
  await expect(page.getByRole('heading', { name: 'Уведомления' })).toBeVisible()
  await expect(page.getByRole('link').filter({ hasText: 'Новое предложение' })).toBeVisible()
})
