import type { Proposal, ProposalStatus } from '@/entities/proposal'
import type { ProposalDto, ProposalInDto } from '@/shared/api/dto/backend'
import { companySummaryFromIds } from './companyMapper'

export interface ProposalCreateInput {
  opportunityId: string
  price: number
  currency: string
  durationDays: number
  description: string
  included: string[]
  excluded: string[]
  cases: string[]
  comment?: string
}

const STATUS_MAP: Record<string, ProposalStatus> = {
  sent: 'submitted',
  viewed: 'viewed',
  shortlisted: 'shortlisted',
  negotiating: 'negotiation',
  chosen: 'accepted',
  rejected: 'rejected',
}

export function mapProposalStatus(status: string): ProposalStatus {
  return STATUS_MAP[status] ?? 'submitted'
}

export function mapProposalDtoToModel(dto: ProposalDto): Proposal {
  return {
    id: String(dto.id),
    opportunityId: String(dto.request_id),
    company: companySummaryFromIds(dto.company_id, dto.company_name),
    price: dto.price,
    currency: 'RUB',
    durationDays: dto.term_days,
    description: dto.solution_text,
    included: [],
    excluded: [],
    cases: dto.case_ref ? [dto.case_ref] : [],
    status: mapProposalStatus(dto.status),
    createdAt: dto.created_at,
  }
}

export function mapCreateProposalToDto(payload: ProposalCreateInput): ProposalInDto {
  return {
    price: payload.price,
    term_days: payload.durationDays,
    solution_text: payload.description,
    case_ref: payload.cases[0] ?? null,
    comment: payload.comment ?? null,
  }
}
