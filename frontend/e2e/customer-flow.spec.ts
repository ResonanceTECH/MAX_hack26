import { expect, test } from '@playwright/test'
import { gap, reachOpportunityForm } from './helpers'

test('customer flow: the same business user publishes a request and reaches a deal', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Что нужно вашему бизнесу?' })).toBeVisible()
  await page.getByRole('link', { name: 'Создать запрос' }).first().click()
  await reachOpportunityForm(
    page,
    'Нужен подрядчик на внедрение CRM для сети из 12 клиник. Бюджет до 500 тысяч. React и интеграция с 1С. Срок два месяца.',
  )
  await page.getByLabel('Название').fill('CRM для 12 клиник — поток заказчика')
  await page.getByRole('button', { name: 'К предпросмотру' }).click()
  await expect(page.getByRole('heading', { name: 'Как заказ увидят исполнители' })).toBeVisible()
  await expect(page.getByText('CRM для 12 клиник — поток заказчика')).toBeVisible()
  await page.getByRole('button', { name: 'Опубликовать' }).click()
  await expect(page.getByRole('heading', { name: 'Запрос опубликован' })).toBeVisible()
  await expect(
    page.getByRole('heading', { name: /TechFlow|DataCraft|МедСнаб/ }),
    gap(
      'FAIL',
      'тот же Business User публикует запрос, но не получает рекомендации компаний. Сравнение, shortlist и Deal Room из нового запроса недоступны: предложений нет, shortlist не связан с кнопкой «В shortlist».',
    ),
  ).toBeVisible()
})
