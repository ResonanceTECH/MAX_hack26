export type DictionaryType =
  | 'categories'
  | 'subcategories'
  | 'industries'
  | 'skills'
  | 'technologies'
  | 'regions'
  | 'documentTypes'
  | 'opportunityTypes'
  | 'verificationReasons'
  | 'reportReasons'

export type DictionaryStatus = 'active' | 'archived'

export interface DictionaryItem {
  id: string
  type: DictionaryType
  name: string
  slug: string
  parentId?: string | null
  aliases?: string[]
  status: DictionaryStatus
  sortOrder: number
  createdAt: string
  updatedAt: string
  usageCount: number
  /** Technology category grouping */
  category?: string
  description?: string
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ё/g, 'e')
    .replace(/[^a-z0-9а-я]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

function item(
  partial: Omit<DictionaryItem, 'slug' | 'sortOrder' | 'createdAt' | 'updatedAt' | 'usageCount' | 'aliases'> &
    Partial<Pick<DictionaryItem, 'slug' | 'sortOrder' | 'createdAt' | 'updatedAt' | 'usageCount' | 'aliases' | 'category' | 'description'>>,
): DictionaryItem {
  const createdAt = partial.createdAt ?? '2025-01-01T00:00:00.000Z'
  return {
    id: partial.id,
    type: partial.type,
    name: partial.name,
    slug: partial.slug ?? slugify(partial.name),
    parentId: partial.parentId ?? null,
    aliases: partial.aliases,
    status: partial.status,
    sortOrder: partial.sortOrder ?? 0,
    createdAt,
    updatedAt: partial.updatedAt ?? createdAt,
    usageCount: partial.usageCount ?? 0,
    category: partial.category,
    description: partial.description,
  }
}

export function getDictionaryItemById(id: string): DictionaryItem | undefined {
  return mockDictionaries.find((d) => d.id === id)
}

export const mockDictionaries: DictionaryItem[] = [
  // categories 20+
  item({ id: 'cat-dev', type: 'categories', name: 'Разработка ПО', status: 'active', usageCount: 42, sortOrder: 1 }),
  item({ id: 'cat-supply', type: 'categories', name: 'Поставки', status: 'active', usageCount: 28, sortOrder: 2 }),
  item({ id: 'cat-logistics', type: 'categories', name: 'Логистика', status: 'active', usageCount: 19, sortOrder: 3 }),
  item({ id: 'cat-marketing', type: 'categories', name: 'Маркетинг', status: 'active', usageCount: 24, sortOrder: 4 }),
  item({ id: 'cat-design', type: 'categories', name: 'Дизайн', status: 'active', usageCount: 16, sortOrder: 5 }),
  item({ id: 'cat-consulting', type: 'categories', name: 'Консалтинг', status: 'active', usageCount: 21, sortOrder: 6 }),
  item({ id: 'cat-security', type: 'categories', name: 'ИБ и безопасность', status: 'active', usageCount: 14, sortOrder: 7 }),
  item({ id: 'cat-cloud', type: 'categories', name: 'Облачные сервисы', status: 'active', usageCount: 18, sortOrder: 8 }),
  item({ id: 'cat-analytics', type: 'categories', name: 'Аналитика и BI', status: 'active', usageCount: 22, sortOrder: 9 }),
  item({ id: 'cat-hr', type: 'categories', name: 'HR-технологии', status: 'active', usageCount: 9, sortOrder: 10 }),
  item({ id: 'cat-finance', type: 'categories', name: 'Финансовые сервисы', status: 'active', usageCount: 11, sortOrder: 11 }),
  item({ id: 'cat-iot', type: 'categories', name: 'IoT-решения', status: 'active', usageCount: 7, sortOrder: 12 }),
  item({ id: 'cat-ai', type: 'categories', name: 'AI / ML', status: 'active', usageCount: 15, sortOrder: 13 }),
  item({ id: 'cat-support', type: 'categories', name: 'Поддержка и аутсорсинг', status: 'active', usageCount: 13, sortOrder: 14 }),
  item({ id: 'cat-manufacturing', type: 'categories', name: 'Производство', status: 'active', usageCount: 20, sortOrder: 15 }),
  item({ id: 'cat-edu', type: 'categories', name: 'Обучение', status: 'active', usageCount: 8, sortOrder: 16 }),
  item({ id: 'cat-legal', type: 'categories', name: 'Юридические услуги', status: 'active', usageCount: 5, sortOrder: 17 }),
  item({ id: 'cat-equipment', type: 'categories', name: 'Оборудование', status: 'active', usageCount: 17, sortOrder: 18 }),
  item({ id: 'cat-packaging', type: 'categories', name: 'Упаковка', status: 'active', usageCount: 12, sortOrder: 19 }),
  item({ id: 'cat-other', type: 'categories', name: 'Прочее', status: 'active', usageCount: 4, sortOrder: 99 }),
  item({ id: 'cat-legacy-fax', type: 'categories', name: 'Факс-услуги', status: 'archived', usageCount: 0, sortOrder: 100 }),

  item({ id: 'sub-crm', type: 'subcategories', name: 'CRM-системы', parentId: 'cat-dev', status: 'active', usageCount: 15 }),
  item({ id: 'sub-portal', type: 'subcategories', name: 'B2B-порталы', parentId: 'cat-dev', status: 'active', usageCount: 11 }),
  item({ id: 'sub-integration', type: 'subcategories', name: 'Интеграции', parentId: 'cat-dev', status: 'active', usageCount: 19 }),
  item({ id: 'sub-ftl', type: 'subcategories', name: 'FTL-перевозки', parentId: 'cat-logistics', status: 'active', usageCount: 8 }),

  // industries 10+
  item({ id: 'ind-it', type: 'industries', name: 'IT', status: 'active', usageCount: 55 }),
  item({ id: 'ind-healthcare', type: 'industries', name: 'Healthcare', status: 'active', usageCount: 22 }),
  item({ id: 'ind-retail', type: 'industries', name: 'Retail', status: 'active', usageCount: 31 }),
  item({ id: 'ind-manufacturing', type: 'industries', name: 'Manufacturing', status: 'active', usageCount: 18 }),
  item({ id: 'ind-logistics', type: 'industries', name: 'Logistics', status: 'active', usageCount: 27 }),
  item({ id: 'ind-marketing', type: 'industries', name: 'Marketing', status: 'active', usageCount: 16 }),
  item({ id: 'ind-finance', type: 'industries', name: 'Finance', status: 'active', usageCount: 14 }),
  item({ id: 'ind-education', type: 'industries', name: 'Education', status: 'active', usageCount: 9 }),
  item({ id: 'ind-energy', type: 'industries', name: 'Energy', status: 'active', usageCount: 7 }),
  item({ id: 'ind-construction', type: 'industries', name: 'Construction', status: 'active', usageCount: 11 }),
  item({ id: 'ind-agro', type: 'industries', name: 'Agro', status: 'active', usageCount: 6 }),

  // skills 20+
  item({ id: 'sk-react', type: 'skills', name: 'React', status: 'active', usageCount: 40 }),
  item({ id: 'sk-fastapi', type: 'skills', name: 'FastAPI', status: 'active', usageCount: 17 }),
  item({ id: 'sk-typescript', type: 'skills', name: 'TypeScript', status: 'active', usageCount: 38 }),
  item({ id: 'sk-python', type: 'skills', name: 'Python', status: 'active', usageCount: 35 }),
  item({ id: 'sk-java', type: 'skills', name: 'Java', status: 'active', usageCount: 22 }),
  item({ id: 'sk-nodejs', type: 'skills', name: 'Node.js', status: 'active', usageCount: 28 }),
  item({ id: 'sk-devops', type: 'skills', name: 'DevOps', status: 'active', usageCount: 19 }),
  item({ id: 'sk-ux', type: 'skills', name: 'UX Research', status: 'active', usageCount: 12 }),
  item({ id: 'sk-pm', type: 'skills', name: 'Project Management', status: 'active', usageCount: 25 }),
  item({ id: 'sk-qa', type: 'skills', name: 'QA Automation', status: 'active', usageCount: 14 }),
  item({ id: 'sk-dataeng', type: 'skills', name: 'Data Engineering', status: 'active', usageCount: 16 }),
  item({ id: 'sk-ml', type: 'skills', name: 'Machine Learning', status: 'active', usageCount: 13 }),
  item({ id: 'sk-sales', type: 'skills', name: 'B2B Sales', status: 'active', usageCount: 21 }),
  item({ id: 'sk-copy', type: 'skills', name: 'Copywriting', status: 'active', usageCount: 10 }),
  item({ id: 'sk-1c', type: 'skills', name: '1С', status: 'active', usageCount: 30 }),
  item({ id: 'sk-k8s', type: 'skills', name: 'Kubernetes', status: 'active', usageCount: 15 }),
  item({ id: 'sk-sql', type: 'skills', name: 'SQL', status: 'active', usageCount: 33 }),
  item({ id: 'sk-figma', type: 'skills', name: 'Figma', status: 'active', usageCount: 18 }),
  item({ id: 'sk-scrum', type: 'skills', name: 'Scrum', status: 'active', usageCount: 20 }),
  item({ id: 'sk-security', type: 'skills', name: 'AppSec', status: 'active', usageCount: 8 }),
  item({ id: 'sk-golang', type: 'skills', name: 'Go', status: 'active', usageCount: 11 }),

  // technologies 30+
  item({ id: 'tech-ts', type: 'technologies', name: 'TypeScript', status: 'active', usageCount: 48, category: 'Frontend' }),
  item({ id: 'tech-pg', type: 'technologies', name: 'PostgreSQL', status: 'active', usageCount: 33, category: 'Database' }),
  item({ id: 'tech-jquery', type: 'technologies', name: 'jQuery', status: 'archived', usageCount: 2, category: 'Frontend' }),
  item({ id: 'tech-react', type: 'technologies', name: 'React', status: 'active', usageCount: 52, category: 'Frontend' }),
  item({ id: 'tech-vue', type: 'technologies', name: 'Vue', status: 'active', usageCount: 18, category: 'Frontend' }),
  item({ id: 'tech-angular', type: 'technologies', name: 'Angular', status: 'active', usageCount: 12, category: 'Frontend' }),
  item({ id: 'tech-next', type: 'technologies', name: 'Next.js', status: 'active', usageCount: 21, category: 'Frontend' }),
  item({ id: 'tech-python', type: 'technologies', name: 'Python', status: 'active', usageCount: 40, category: 'Backend' }),
  item({ id: 'tech-java', type: 'technologies', name: 'Java', status: 'active', usageCount: 26, category: 'Backend' }),
  item({ id: 'tech-go', type: 'technologies', name: 'Go', status: 'active', usageCount: 14, category: 'Backend' }),
  item({ id: 'tech-dotnet', type: 'technologies', name: '.NET', status: 'active', usageCount: 15, category: 'Backend' }),
  item({ id: 'tech-node', type: 'technologies', name: 'Node.js', status: 'active', usageCount: 29, category: 'Backend' }),
  item({ id: 'tech-kafka', type: 'technologies', name: 'Kafka', status: 'active', usageCount: 17, category: 'Messaging' }),
  item({ id: 'tech-redis', type: 'technologies', name: 'Redis', status: 'active', usageCount: 22, category: 'Database' }),
  item({ id: 'tech-mongo', type: 'technologies', name: 'MongoDB', status: 'active', usageCount: 16, category: 'Database' }),
  item({ id: 'tech-clickhouse', type: 'technologies', name: 'ClickHouse', status: 'active', usageCount: 11, category: 'Database' }),
  item({ id: 'tech-k8s', type: 'technologies', name: 'Kubernetes', status: 'active', usageCount: 20, category: 'Infra' }),
  item({ id: 'tech-docker', type: 'technologies', name: 'Docker', status: 'active', usageCount: 35, category: 'Infra' }),
  item({ id: 'tech-terraform', type: 'technologies', name: 'Terraform', status: 'active', usageCount: 13, category: 'Infra' }),
  item({ id: 'tech-aws', type: 'technologies', name: 'AWS', status: 'active', usageCount: 24, category: 'Cloud' }),
  item({ id: 'tech-yc', type: 'technologies', name: 'Yandex Cloud', status: 'active', usageCount: 19, category: 'Cloud' }),
  item({ id: 'tech-azure', type: 'technologies', name: 'Azure', status: 'active', usageCount: 10, category: 'Cloud' }),
  item({ id: 'tech-1c', type: 'technologies', name: '1С', status: 'active', usageCount: 31, category: 'ERP' }),
  item({ id: 'tech-sap', type: 'technologies', name: 'SAP', status: 'active', usageCount: 8, category: 'ERP' }),
  item({ id: 'tech-graphql', type: 'technologies', name: 'GraphQL', status: 'active', usageCount: 14, category: 'API' }),
  item({ id: 'tech-rest', type: 'technologies', name: 'REST', status: 'active', usageCount: 45, category: 'API' }),
  item({ id: 'tech-grpc', type: 'technologies', name: 'gRPC', status: 'active', usageCount: 9, category: 'API' }),
  item({ id: 'tech-elasticsearch', type: 'technologies', name: 'Elasticsearch', status: 'active', usageCount: 12, category: 'Search' }),
  item({ id: 'tech-airflow', type: 'technologies', name: 'Airflow', status: 'active', usageCount: 7, category: 'Data' }),
  item({ id: 'tech-dbt', type: 'technologies', name: 'dbt', status: 'active', usageCount: 6, category: 'Data' }),
  item({ id: 'tech-powerbi', type: 'technologies', name: 'Power BI', status: 'active', usageCount: 10, category: 'BI' }),
  item({ id: 'tech-grafana', type: 'technologies', name: 'Grafana', status: 'active', usageCount: 15, category: 'Observability' }),

  // regions 10+
  item({ id: 'reg-msk', type: 'regions', name: 'Москва', status: 'active', usageCount: 60 }),
  item({ id: 'reg-spb', type: 'regions', name: 'Санкт-Петербург', status: 'active', usageCount: 35 }),
  item({ id: 'reg-nsk', type: 'regions', name: 'Новосибирск', status: 'active', usageCount: 12 }),
  item({ id: 'reg-ekb', type: 'regions', name: 'Екатеринбург', status: 'active', usageCount: 14 }),
  item({ id: 'reg-kzn', type: 'regions', name: 'Казань', status: 'active', usageCount: 11 }),
  item({ id: 'reg-nn', type: 'regions', name: 'Нижний Новгород', status: 'active', usageCount: 9 }),
  item({ id: 'reg-smr', type: 'regions', name: 'Самара', status: 'active', usageCount: 7 }),
  item({ id: 'reg-krd', type: 'regions', name: 'Краснодар', status: 'active', usageCount: 8 }),
  item({ id: 'reg-vlad', type: 'regions', name: 'Владивосток', status: 'active', usageCount: 5 }),
  item({ id: 'reg-remote', type: 'regions', name: 'Удалённо / РФ', status: 'active', usageCount: 40 }),
  item({ id: 'reg-rf', type: 'regions', name: 'Вся Россия', status: 'active', usageCount: 22 }),

  // documentTypes 6+
  item({ id: 'doc-charter', type: 'documentTypes', name: 'Устав', status: 'active', usageCount: 40 }),
  item({ id: 'doc-license', type: 'documentTypes', name: 'Лицензия', status: 'active', usageCount: 14 }),
  item({ id: 'doc-edo', type: 'documentTypes', name: 'Соглашение ЭДО', status: 'active', usageCount: 9 }),
  item({ id: 'doc-egrul', type: 'documentTypes', name: 'Выписка ЕГРЮЛ', status: 'active', usageCount: 35 }),
  item({ id: 'doc-inn', type: 'documentTypes', name: 'Свидетельство ИНН', status: 'active', usageCount: 28 }),
  item({ id: 'doc-contract', type: 'documentTypes', name: 'Типовой договор', status: 'active', usageCount: 18 }),
  item({ id: 'doc-cert', type: 'documentTypes', name: 'Сертификат соответствия', status: 'active', usageCount: 12 }),

  item({ id: 'opp-rfp', type: 'opportunityTypes', name: 'Запрос предложения', status: 'active', usageCount: 50 }),
  item({ id: 'opp-rfi', type: 'opportunityTypes', name: 'Запрос информации', status: 'active', usageCount: 22 }),
  item({ id: 'opp-tender', type: 'opportunityTypes', name: 'Тендер', status: 'active', usageCount: 15 }),

  item({ id: 'vr-incomplete', type: 'verificationReasons', name: 'Неполные данные', status: 'active', usageCount: 8 }),
  item({ id: 'vr-docs', type: 'verificationReasons', name: 'Проблемы с документами', status: 'active', usageCount: 6 }),
  item({ id: 'vr-mismatch', type: 'verificationReasons', name: 'Расхождение реквизитов', status: 'active', usageCount: 4 }),

  item({ id: 'rr-spam', type: 'reportReasons', name: 'Спам', status: 'active', usageCount: 20 }),
  item({ id: 'rr-fraud', type: 'reportReasons', name: 'Мошенничество', status: 'active', usageCount: 12 }),
  item({ id: 'rr-fake', type: 'reportReasons', name: 'Фиктивная компания', status: 'active', usageCount: 7 }),
]

export { slugify as dictionarySlugify }
