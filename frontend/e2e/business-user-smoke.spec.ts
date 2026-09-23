import { expect, test } from '@playwright/test'

const routes: Array<[string, string, string | RegExp]> = [
  ['SM-01', '/', 'Что нужно вашему бизнесу?'],
  ['SM-02', '/opportunities', 'Возможности'],
  ['SM-03', '/opportunities/opp-crm-clinics', 'Разработка CRM для сети клиник'],
  ['SM-04', '/opportunities/create', 'Создание запроса'],
  ['SM-05', '/companies', 'Компании'],
  ['SM-06', '/companies/company-techflow', 'TechFlow'],
  ['SM-07', '/my', 'Мои процессы'],
  ['SM-08', '/my/requests', 'Мои запросы'],
  ['SM-09', '/my/proposals', 'Мои отклики'],
  ['SM-10', '/my/shortlist', 'Shortlist'],
  ['SM-11', '/my/negotiations', 'Переговоры'],
  ['SM-12', '/opportunities/opp-dl-ecommerce/proposals', 'Предложения'],
  ['SM-13', '/opportunities/opp-crm-clinics/compare', 'Сравнение предложений'],
  ['SM-14', '/proposals/prop-8', 'TechFlow'],
  ['SM-15', '/deals/deal-1', /Digital Lab ×/],
  ['SM-16', '/notifications', 'Уведомления'],
  ['SM-17', '/profile/company', 'Профиль компании'],
  ['SM-18', '/favorites', 'Избранное'],
  ['SM-19', '/this-route-does-not-exist', '404'],
]

for (const [id, path, heading] of routes) {
  test(`[${id}] ${path} renders, opens directly, and survives back navigation`, async ({
    page,
  }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await page.goto(path)
    const title = page.getByRole('heading', { level: 1 }).filter({ hasText: heading })
    await expect(title).toBeVisible()
    if (path !== '/') {
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1, name: 'Что нужно вашему бизнесу?' })).toBeVisible()
      await page.goBack()
      await expect(title).toBeVisible()
    } else {
      await page.goto('/opportunities')
      await page.goBack()
      await expect(title).toBeVisible()
    }
    expect(pageErrors).toEqual([])
  })
}
