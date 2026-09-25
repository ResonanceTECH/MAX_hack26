import type { ShortlistItem } from '@/entities/shortlist'
import { loadMockState } from '@/shared/lib/mockPersist'

export type { ShortlistItem }

const SEED: ShortlistItem[] = [
  {
    id: 'sl-1',
    opportunityId: 'opp-crm-clinics',
    companyId: 'company-digital-lab',
    proposalId: 'prop-1',
    price: 480000,
    currency: 'RUB',
    durationDays: 60,
    matchScore: 94,
    note: 'Сильный Healthcare-опыт, уложились в бюджет',
  },
  {
    id: 'sl-2',
    opportunityId: 'opp-crm-clinics',
    companyId: 'company-datacraft',
    proposalId: 'prop-3',
    price: 390000,
    currency: 'RUB',
    durationDays: 50,
    matchScore: 86,
    note: 'Дешевле, но меньше медицинских кейсов',
  },
  {
    id: 'sl-3',
    opportunityId: 'opp-packaging-supply',
    companyId: 'company-packpro',
    proposalId: null,
    price: 380000,
    currency: 'RUB',
    durationDays: 30,
    matchScore: 89,
    note: 'Ждём уточнение по срокам доставки в Москву',
  },
  {
    id: 'sl-4',
    opportunityId: 'opp-logistics-ural',
    companyId: 'company-logistics-one',
    proposalId: null,
    price: 750000,
    currency: 'RUB',
    durationDays: null,
    matchScore: 97,
    note: 'Основной кандидат по логистике',
  },
]

/** Mutated in-place by shortlistApi; hydrated from localStorage on boot. */
export const mockShortlist: ShortlistItem[] = loadMockState('shortlist', SEED)
