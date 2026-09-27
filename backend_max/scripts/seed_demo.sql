-- Демо-данные B2B Match (упрощённый SQL-seed).
-- Идемпотентно: повторный запуск не дублирует строки по max_user_id / inn / title.
--
-- Полный seed (матчинг + Wave A extras) лучше через API:
--   POST /auth/max {"dev_max_user_id": 7777001}
--   POST /api/admin/seed
--
-- Применение на сервере:
--   docker compose exec -T db psql -U b2b -d b2b_match < backend_max/scripts/seed_demo.sql

BEGIN;

-- ---------- пользователи ----------
INSERT INTO users (max_user_id, first_name, last_name, username, email, role, is_admin, status, created_at)
VALUES
  (7777001, 'Анна', 'Смирнова', 'anna_smirnova', 'anna@mebelpro.example', 'PLATFORM_ADMIN', true, 'active', NOW()),
  (7777002, 'Дмитрий', 'Кузнецов', 'dkuz', 'dmitry@digitallab.example', 'COMPANY_ADMIN', false, 'active', NOW()),
  (7777003, 'Ольга', 'Ветрова', 'ovetrova', 'olga@webforge.example', 'BUSINESS_USER', false, 'active', NOW()),
  (7777004, 'Марат', 'Гарипов', 'mgaripov', 'marat@logistic.example', 'COMPANY_ADMIN', false, 'active', NOW()),
  (7777005, 'Екатерина', 'Соколова', 'esokolova', 'kate@marketlab.example', 'COMPANY_ADMIN', false, 'active', NOW()),
  (7777006, 'Игорь', 'Белов', 'ibelov', 'igor@stroy.example', 'COMPANY_ADMIN', false, 'active', NOW()),
  (7777007, 'Наталья', 'Орлова', 'norlova', 'natalya@finservice.example', 'COMPANY_ADMIN', false, 'active', NOW()),
  (7777008, 'Павел', 'Титов', 'ptitov', 'pavel@print.example', 'COMPANY_ADMIN', false, 'active', NOW()),
  (7777009, 'Мария', 'Модератор', 'moderator', 'moderator@b2b.local', 'MODERATOR', false, 'active', NOW())
ON CONFLICT (max_user_id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  username = EXCLUDED.username,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_admin = EXCLUDED.is_admin,
  status = EXCLUDED.status;

-- ---------- компании ----------
INSERT INTO companies (
  user_id, name, inn, description,
  registration_date, company_status, verification_source,
  industries, services, competencies, regions,
  budget_min, budget_max, max_term_days,
  cases, certificates, website, phone, email,
  rating, is_verified, platform_status, verification_status,
  settings_json, created_at, updated_at
)
SELECT u.id, v.name, v.inn, v.description,
       v.registration_date::date, v.company_status, v.verification_source,
       v.industries::json, v.services::json, v.competencies::json, v.regions::json,
       v.budget_min, v.budget_max, v.max_term_days,
       v.cases::json, v.certificates::json, v.website, v.phone, v.email,
       v.rating, v.is_verified, 'ACTIVE', v.verification_status,
       '{}'::json, NOW(), NOW()
FROM (VALUES
  (7777001, 'МебельПро', '1655011001',
   'Производитель корпусной мебели. Собственное производство в Казани, 12 лет на рынке.',
   '2012-04-17', 'Действующая', 'ЕГРЮЛ (тестовые данные)',
   '["Производство"]', '["мебель на заказ"]',
   '["производство мебели","корпусная мебель","деревообработка"]',
   '["Казань","Татарстан","Вся Россия"]',
   100000, 1500000, 45,
   '[{"title":"Мебель для сети кофеен","description":"Изготовление 200 столов и 600 стульев за 40 дней"}]',
   '["ГОСТ 16371-2014"]', 'https://mebelpro.example', '+7 900 000-00-01', 'anna@mebelpro.example',
   4.6::float8, true, 'VERIFIED'),
  (7777002, 'DigitalLab', '7705002002',
   'Разработка веб-сервисов и интеграций. React, Python, 1С, CRM-автоматизация.',
   '2015-09-02', 'Действующая', 'ЕГРЮЛ (тестовые данные)',
   '["IT-разработка"]', '["web-разработка","интеграции","автоматизация"]',
   '["react","python","1с","api","crm","интернет-магазин"]',
   '["Москва","Вся Россия"]',
   300000, 5000000, 90,
   '[{"title":"B2B-портал для дистрибьютора","description":"Каталог, личный кабинет, интеграция с 1С, 2 месяца"}]',
   '["Сертификат 1С:Франчайзи"]', 'https://digitallab.example', '+7 900 000-00-02', 'dmitry@digitallab.example',
   4.8::float8, true, 'VERIFIED'),
  (7777003, 'WebForge', '7806003003',
   'Веб-студия: сайты, интернет-магазины, дизайн. Работаем с МСП по всей России.',
   '2018-01-25', 'Действующая', 'ЕГРЮЛ (тестовые данные)',
   '["IT-разработка","Дизайн"]', '["web-разработка","графический дизайн"]',
   '["react","figma","wordpress","интернет-магазин","дизайн"]',
   '["Санкт-Петербург","Ленинградская область","Вся Россия"]',
   100000, 800000, 60,
   '[{"title":"Сайт кафе с доставкой","description":"WordPress, 150 тыс. ₽, 3 недели"}]',
   '[]', 'https://webforge.example', '+7 900 000-00-03', 'olga@webforge.example',
   4.4::float8, true, 'VERIFIED'),
  (7777004, 'ЛогистикГрупп', '1656004004',
   'Доставка по городу и межгород. Складские услуги и фулфилмент для интернет-магазинов.',
   '2019-06-11', 'Действующая', NULL,
   '["Логистика"]', '["доставка по городу","грузоперевозки","фулфилмент"]',
   '["доставка","фулфилмент","склад"]',
   '["Казань","Татарстан","Вся Россия"]',
   30000, 500000, 30,
   '[{"title":"Фулфилмент для ИМ одежды","description":"2000 заказов/мес"}]',
   '[]', '', '+7 900 000-00-04', 'marat@logistic.example',
   4.0::float8, false, 'NOT_VERIFIED'),
  (7777005, 'МаркетЛаб', '6678005005',
   'Маркетинговое агентство: SMM, контекстная реклама, SEO для МСП.',
   '2016-11-08', 'Действующая', 'ЕГРЮЛ (тестовые данные)',
   '["Маркетинг и реклама"]', '["smm-продвижение","контекстная реклама","seo"]',
   '["smm","контекстная реклама","яндекс.директ","seo"]',
   '["Екатеринбург","Свердловская область","Вся Россия"]',
   50000, 600000, 30,
   '[{"title":"SMM для сети пекарен","description":"Рост подписчиков в 4 раза за квартал"}]',
   '["Сертификат Яндекс.Директ"]', 'https://marketlab.example', '+7 900 000-00-05', 'kate@marketlab.example',
   4.5::float8, true, 'VERIFIED'),
  (7777006, 'СтройКомплект', '5407006006',
   'Ремонт офисов и торговых помещений под ключ. Собственные бригады.',
   '2014-03-30', 'Действующая', NULL,
   '["Строительство и ремонт"]', '["ремонт помещений","отделочные работы"]',
   '["ремонт","отделка","электромонтаж"]',
   '["Новосибирск","Вся Россия"]',
   200000, 3000000, 120,
   '[{"title":"Ремонт офиса 400 м²","description":"45 дней, 2,8 млн ₽"}]',
   '[]', '', '+7 900 000-00-06', 'igor@stroy.example',
   3.9::float8, false, 'NOT_VERIFIED'),
  (7777007, 'ФинСервис', '7725007007',
   'Бухгалтерское сопровождение малого бизнеса. Отчётность, налоги, зарплата.',
   '2011-12-14', 'Действующая', 'ЕГРЮЛ (тестовые данные)',
   '["Бухгалтерия и финансы"]', '["бухгалтерское сопровождение","налоговый консалтинг"]',
   '["бухгалтерия","отчётность","налоги"]',
   '["Москва","Вся Россия"]',
   10000, 200000, 365,
   '[{"title":"Бухгалтерия для ИТ-стартапа","description":"Сопровождение 3 года"}]',
   '[]', 'https://finservice.example', '+7 900 000-00-07', 'natalya@finservice.example',
   4.7::float8, true, 'VERIFIED'),
  (7777008, 'ПечатьЦентр', '6318008008',
   'Полиграфия: визитки, упаковка, сувенирная продукция. Типография в Самаре.',
   '2017-07-19', 'Действующая', NULL,
   '["Производство"]', '["полиграфия","упаковка"]',
   '["полиграфия","печать","упаковка"]',
   '["Самара","Вся Россия"]',
   20000, 400000, 21,
   '[{"title":"Упаковка для кондитерской","description":"10 000 коробок, 2 недели"}]',
   '[]', '', '+7 900 000-00-08', 'pavel@print.example',
   4.1::float8, false, 'NOT_VERIFIED')
) AS v(
  max_user_id, name, inn, description,
  registration_date, company_status, verification_source,
  industries, services, competencies, regions,
  budget_min, budget_max, max_term_days,
  cases, certificates, website, phone, email,
  rating, is_verified, verification_status
)
JOIN users u ON u.max_user_id = v.max_user_id
WHERE NOT EXISTS (SELECT 1 FROM companies c WHERE c.inn = v.inn);

-- owner-membership для COMPANY_ADMIN / PLATFORM_ADMIN
INSERT INTO company_members (
  company_id, user_id, first_name, last_name, email,
  member_role, status, invited_at, joined_at
)
SELECT c.id, u.id, u.first_name, u.last_name, COALESCE(u.email, 'user' || u.max_user_id || '@b2b.local'),
       'COMPANY_ADMIN', 'active', NOW(), NOW()
FROM companies c
JOIN users u ON u.id = c.user_id
WHERE u.role IN ('COMPANY_ADMIN', 'PLATFORM_ADMIN')
  AND NOT EXISTS (
    SELECT 1 FROM company_members m
    WHERE m.company_id = c.id AND m.user_id = u.id
  );

-- ---------- запросы (opportunities) ----------
INSERT INTO requests (
  company_id, title, description_raw, category, subcategory,
  requirements, required_certificates, budget_min, budget_max,
  deadline_days, regions, proposals_deadline_days, status,
  created_at, published_at
)
SELECT c.id, v.title, v.description_raw, v.category, v.subcategory,
       v.requirements::json, '[]'::json, v.budget_min, v.budget_max,
       v.deadline_days, v.regions::json, 14, 'published',
       NOW(), NOW()
FROM (VALUES
  ('МебельПро',
   'Разработка интернет-магазина мебели',
   'Нужна разработка интернет-магазина для производителя мебели. React, интеграция с 1С, бюджет 400-600 тысяч рублей, срок два месяца, Москва.',
   'IT-разработка', 'web-разработка',
   '["react","1с","интернет-магазин"]',
   400000, 600000, 60, '["Москва","Вся Россия"]'),
  ('ПечатьЦентр',
   'SMM и контекстная реклама для типографии',
   'Требуется SMM-продвижение и контекстная реклама для типографии. Бюджет до 150 тысяч, срок один месяц, регион Самара.',
   'Маркетинг и реклама', 'smm-продвижение',
   '["smm","контекстная реклама"]',
   50000, 150000, 30, '["Самара","Вся Россия"]'),
  ('СтройКомплект',
   'Поставка упаковки и полиграфии',
   'Нужен поставщик упаковки и полиграфии для сети из трёх магазинов. От 100 до 300 тысяч рублей, поставки два раза в месяц, Новосибирск.',
   'Производство', 'полиграфия',
   '["упаковка","полиграфия"]',
   100000, 300000, 30, '["Новосибирск","Вся Россия"]')
) AS v(by_company, title, description_raw, category, subcategory, requirements, budget_min, budget_max, deadline_days, regions)
JOIN companies c ON c.name = v.by_company
WHERE NOT EXISTS (SELECT 1 FROM requests r WHERE r.title = v.title);

-- ---------- матчи (фиксированные score для демо UI) ----------
INSERT INTO request_matches (request_id, company_id, score, criteria, created_at)
SELECT r.id, c.id, m.score, m.criteria::json, NOW()
FROM (VALUES
  ('Разработка интернет-магазина мебели', 'DigitalLab', 95,
   '[{"name":"competencies","matched":true,"weight":40},{"name":"budget","matched":true,"weight":25},{"name":"region","matched":true,"weight":20},{"name":"term","matched":true,"weight":15}]'),
  ('Разработка интернет-магазина мебели', 'WebForge', 82,
   '[{"name":"competencies","matched":true,"weight":40},{"name":"budget","matched":true,"weight":25},{"name":"region","matched":true,"weight":20}]'),
  ('SMM и контекстная реклама для типографии', 'МаркетЛаб', 93,
   '[{"name":"competencies","matched":true,"weight":40},{"name":"budget","matched":true,"weight":25},{"name":"region","matched":false,"weight":20}]'),
  ('Поставка упаковки и полиграфии', 'ПечатьЦентр', 88,
   '[{"name":"competencies","matched":true,"weight":40},{"name":"budget","matched":true,"weight":25}]')
) AS m(request_title, company_name, score, criteria)
JOIN requests r ON r.title = m.request_title
JOIN companies c ON c.name = m.company_name
WHERE NOT EXISTS (
  SELECT 1 FROM request_matches rm
  WHERE rm.request_id = r.id AND rm.company_id = c.id
);

-- ---------- отклик (пример) ----------
INSERT INTO proposals (
  request_id, company_id, price, term_days, solution_text, case_ref, comment, status, created_at
)
SELECT r.id, c.id, 520000, 55,
       'Соберём интернет-магазин на React + API, подключим обмен с 1С по REST, каталог и ЛК дилера.',
       'B2B-портал для дистрибьютора',
       'Готовы стартовать в течение недели',
       'sent', NOW()
FROM requests r
JOIN companies c ON c.name = 'DigitalLab'
WHERE r.title = 'Разработка интернет-магазина мебели'
  AND NOT EXISTS (
    SELECT 1 FROM proposals p
    WHERE p.request_id = r.id AND p.company_id = c.id
  );

-- ---------- уведомление владельцу запроса ----------
INSERT INTO notification_log (user_id, target_user_id, text, ok, is_read, created_at)
SELECT owner.id, owner.max_user_id,
       'Новый отклик на «Разработка интернет-магазина мебели» от DigitalLab',
       true, false, NOW()
FROM users owner
WHERE owner.max_user_id = 7777001
  AND NOT EXISTS (
    SELECT 1 FROM notification_log n
    WHERE n.target_user_id = 7777001
      AND n.text LIKE 'Новый отклик на «Разработка интернет-магазина мебели»%'
  );

COMMIT;

-- сверка
SELECT 'users' AS entity, COUNT(*) FROM users
UNION ALL SELECT 'companies', COUNT(*) FROM companies
UNION ALL SELECT 'requests', COUNT(*) FROM requests
UNION ALL SELECT 'matches', COUNT(*) FROM request_matches
UNION ALL SELECT 'proposals', COUNT(*) FROM proposals;
