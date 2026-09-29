import type { Deal, DealFile, DealStatus } from '@/entities/deal'
import type { DealDto, FileDto } from '@/shared/api/dto/backend'

const STATUS_MAP: Record<string, DealStatus> = {
  negotiating: 'negotiation',
  agreed: 'agreement',
  closed: 'closed',
  cancelled: 'cancelled',
}

export function mapFileDtoToDealFile(dto: FileDto): DealFile {
  return {
    id: String(dto.id),
    name: dto.name,
    contentType: dto.content_type,
    size: dto.size,
    createdAt: dto.created_at,
  }
}

export function mapDealDtoToModel(dto: DealDto): Deal {
  const proposal = dto.proposal
  const termsSummary = dto.terms_summary?.trim() || null
  const agreedPrice = dto.agreed_price ?? proposal?.price ?? null
  const agreedTermDays = dto.agreed_term_days ?? proposal?.term_days ?? null
  const events = [
    {
      id: `ev-${dto.id}-start`,
      date: dto.created_at,
      title: 'Начаты переговоры',
      description:
        'Откройте вкладку «Обзор», чтобы согласовать и зафиксировать условия сделки.',
      type: 'negotiation' as const,
    },
  ]
  if (termsSummary) {
    events.push({
      id: `ev-${dto.id}-terms`,
      date: dto.updated_at,
      title: 'Условия зафиксированы',
      description: termsSummary,
      type: 'status' as const,
    })
  }
  return {
    id: String(dto.id),
    opportunityId: String(dto.opportunity_id),
    opportunityTitle: dto.opportunity_title,
    companyId: String(dto.executor_company_id),
    companyName: proposal?.company_name ?? `Компания #${dto.executor_company_id}`,
    proposalId: String(dto.proposal_id),
    price: agreedPrice,
    currency: 'RUB',
    durationDays: agreedTermDays,
    status: STATUS_MAP[dto.status] ?? 'negotiation',
    contactName: '',
    nextAction: dto.next_action || 'Согласуйте условия на вкладке «Обзор»',
    lastAction: termsSummary ? 'Условия зафиксированы' : 'Начаты переговоры',
    updatedAt: dto.updated_at,
    events,
    files: (dto.files ?? []).map(mapFileDtoToDealFile),
    termsSummary,
    agreedPrice: dto.agreed_price ?? null,
    agreedTermDays: dto.agreed_term_days ?? null,
  }
}
