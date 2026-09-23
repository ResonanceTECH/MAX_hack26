import { expect, test } from '@playwright/test'
import { gap, reachOpportunityForm } from './helpers'

const TITLE = 'CRM для сети клиник — аудит публикации'

test('[CR-01] create page exists', async ({ page }) => {
  await page.goto('/opportunities/create')
  await expect(page.getByRole('heading', { name: 'Создание запроса' })).toBeVisible()
  await expect(page.getByLabel('Описание задачи')).toBeVisible()
})

test('[CR-02] empty description is rejected', async ({ page }) => {
  await page.goto('/opportunities/create')
  await expect(page.getByRole('button', { name: 'Продолжить' })).toBeDisabled()
  await page.getByLabel('Описание задачи').fill('коротко')
  await expect(page.getByRole('button', { name: 'Продолжить' })).toBeDisabled()
})

test('[CR-03] [CR-04] [CR-05] [CR-06] [CR-07] [CR-08] [CR-09] normal text becomes a structured request', async ({
  page,
}) => {
  await page.goto('/opportunities/create')
  await page.getByLabel('Описание задачи').fill(
    'Нужен подрядчик на разработку CRM для медицинской компании. Бюджет до 500 тысяч. React, интеграция с 1С.',
  )
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await expect(page.getByRole('heading', { name: 'Мы поняли ваш запрос так' })).toBeVisible()
  await expect(page.getByText('Разработка ПО')).toBeVisible()
  await expect(page.getByText('Healthcare')).toBeVisible()
  await expect(page.getByText(/500/)).toBeVisible()
  await expect(page.getByText('React')).toBeVisible()
  await expect(page.getByText('1С')).toBeVisible()
})

test('[CR-10] [CR-11] structured values stay editable across steps', async ({ page }) => {
  await page.goto('/opportunities/create')
  await reachOpportunityForm(page)
  const title = page.getByLabel('Название')
  await title.fill(TITLE)
  await page.getByRole('button', { name: 'Назад' }).click()
  await expect(page.getByRole('heading', { name: 'Мы поняли ваш запрос так' })).toBeVisible()
  await page.getByRole('button', { name: 'Редактировать и опубликовать' }).click()
  await expect(page.getByLabel('Название')).toHaveValue(TITLE)
})

test('[CR-12] required fields are validated', async ({ page }) => {
  await page.goto('/opportunities/create')
  await reachOpportunityForm(page)
  await page.getByLabel('Название').fill('CRM')
  await page.getByLabel('Описание').fill('слишком коротко')
  await page.getByLabel('Отрасли (через запятую)').fill('')
  await page.getByRole('button', { name: 'К предпросмотру' }).click()
  await expect(page.getByText('Укажите название (минимум 5 символов)')).toBeVisible()
  await expect(page.getByText('Опишите задачу подробнее')).toBeVisible()
  await expect(page.getByText('Укажите хотя бы одну отрасль')).toBeVisible()
})

test('[CR-13] [CR-16] [CR-17] [CR-18] [CR-19] preview publishes into my requests', async ({
  page,
}) => {
  await page.goto('/opportunities/create')
  await reachOpportunityForm(page)
  await page.getByLabel('Название').fill(TITLE)
  await page.getByRole('button', { name: 'К предпросмотру' }).click()
  await expect(page.getByRole('heading', { name: 'Как заказ увидят исполнители' })).toBeVisible()
  await expect(page.getByText(TITLE)).toBeVisible()
  await page.getByRole('button', { name: 'Опубликовать' }).click()
  await expect(page.getByRole('heading', { name: 'Запрос опубликован' })).toBeVisible()
  await page.getByRole('button', { name: 'Перейти к запросу' }).click()
  await expect(page.getByRole('heading', { level: 1, name: TITLE })).toBeVisible()
  await expect(page.getByText('Опубликован', { exact: true })).toBeVisible()
  await page.goto('/my/requests')
  await expect(page.getByText(TITLE)).toBeVisible()
})

test('[CR-14] [CR-15] save draft lands in drafts', async ({ page }) => {
  await page.goto('/opportunities/create')
  await reachOpportunityForm(page)
  await page.getByLabel('Название').fill('Черновик CRM для аудита')
  await page.getByRole('button', { name: 'К предпросмотру' }).click()
  await page.getByRole('button', { name: 'Сохранить черновик' }).click()
  await page.goto('/my/requests')
  await page.getByRole('tab', { name: /Черновики/ }).click()
  await expect(
    page.getByText('Черновик CRM для аудита'),
    gap('NOT_IMPLEMENTED', '«Сохранить черновик» вызывает publish(), статус становится published'),
  ).toBeVisible()
})

test('[CR-20] publishing produces matching results', async ({ page }) => {
  await page.goto('/opportunities/create')
  await reachOpportunityForm(page)
  await page.getByLabel('Название').fill('Запрос с рекомендациями')
  await page.getByRole('button', { name: 'К предпросмотру' }).click()
  await page.getByRole('button', { name: 'Опубликовать' }).click()
  await expect(page.getByRole('heading', { name: 'Запрос опубликован' })).toBeVisible()
  await expect(
    page.getByText(/Почему подходит/),
    gap('NOT_IMPLEMENTED', 'после публикации показывается захардкоженное «Найдено 8», без компаний и объяснения'),
  ).toBeVisible()
})
