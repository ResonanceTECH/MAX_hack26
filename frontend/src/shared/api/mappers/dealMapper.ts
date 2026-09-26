import type { Deal, DealFile, DealStatus } from '@/entities/deal'
import type { DealDto, FileDto } from '@/shared/api/dto/backend'

const STATUS_MAP: Record<string, DealStatus> = {
  negotiating: 'negotiation',
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
  return {
    id: String(dto.id),
    opportunityId: String(dto.opportunity_id),
    opportunityTitle: dto.opportunity_title,
    companyId: String(dto.executor_company_id),
    companyName: proposal?.company_name ?? `Компания #${dto.executor_company_id}`,
    proposalId: String(dto.proposal_id),
    price: proposal?.price ?? null,
    currency: 'RUB',
    durationDays: proposal?.term_days ?? null,
    status: STATUS_MAP[dto.status] ?? 'negotiation',
    contactName: '',
    nextAction: dto.next_action || 'Согласуйте условия',
    lastAction: 'Начаты переговоры',
    updatedAt: dto.updated_at,
    events: [
      {
        id: `ev-${dto.id}`,
        date: dto.created_at,
        title: 'Начаты переговоры',
        description: dto.next_action || 'Deal Room открыт',
        type: 'negotiation',
      },
    ],
    files: (dto.files ?? []).map(mapFileDtoToDealFile),
  }
}
