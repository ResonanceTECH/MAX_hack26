import type { Opportunity, OpportunityStatus, OpportunityType } from '@/entities/opportunity'
import type { RequestCreateDto, RequestDto } from '@/shared/api/dto/backend'
import { companySummaryFromIds } from './companyMapper'

export interface OpportunityCreateInput {
  title: string
  description: string
  type: string
  category: string
  subcategory: string
  industries: string[]
  skills: string[]
  technologies: string[]
  budgetMin: number | null
  budgetMax: number | null
  currency: string
  region: string
  remoteAllowed: boolean
  proposalDeadline: string
  executionDeadline: string | null
}

const STATUS_MAP: Record<string, OpportunityStatus> = {
  draft: 'draft',
  published: 'published',
  closed: 'closed',
  blocked: 'cancelled',
}

export function mapOpportunityStatus(status: string): OpportunityStatus {
  return STATUS_MAP[status] ?? 'published'
}

function daysFromNow(days: number | null | undefined): string | null {
  if (days == null) return null
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

export function mapRequestDtoToOpportunity(dto: RequestDto): Opportunity {
  const company = companySummaryFromIds(dto.company_id, dto.company_name)
  const requirements = dto.requirements ?? []
  return {
    id: String(dto.id),
    title: dto.title,
    description: dto.description_raw ?? '',
    type: 'service' as OpportunityType,
    company,
    category: dto.category,
    subcategory: dto.subcategory ?? '',
    industries: dto.category ? [dto.category] : [],
    skills: requirements,
    technologies: requirements,
    requiredRequirements: requirements,
    desiredRequirements: dto.required_certificates ?? [],
    budgetMin: dto.budget_min,
    budgetMax: dto.budget_max,
    currency: 'RUB',
    region: dto.regions?.[0] ?? '',
    remoteAllowed: (dto.regions ?? []).includes('Вся Россия'),
    proposalDeadline: dto.expires_at ?? daysFromNow(dto.proposals_deadline_days) ?? new Date().toISOString(),
    executionDeadline: daysFromNow(dto.deadline_days),
    status: mapOpportunityStatus(dto.status),
    createdAt: dto.created_at,
    proposalsCount: dto.proposals_count ?? 0,
    matchScore: dto.match_score ?? null,
    newProposalsCount: 0,
  }
}

export function mapCreatePayloadToRequestDto(
  payload: OpportunityCreateInput,
  publish: boolean,
): RequestCreateDto {
  const deadlineDays = payload.executionDeadline
    ? Math.max(
        1,
        Math.ceil((+new Date(payload.executionDeadline) - Date.now()) / (1000 * 60 * 60 * 24)),
      )
    : null
  const proposalDays = payload.proposalDeadline
    ? Math.max(
        1,
        Math.ceil((+new Date(payload.proposalDeadline) - Date.now()) / (1000 * 60 * 60 * 24)),
      )
    : 14

  return {
    description: payload.description || payload.title,
    title: payload.title,
    category: payload.category || undefined,
    subcategory: payload.subcategory || undefined,
    requirements: [...payload.skills, ...payload.technologies].filter(Boolean),
    budget_min: payload.budgetMin,
    budget_max: payload.budgetMax,
    deadline_days: deadlineDays,
    regions: payload.region ? [payload.region] : [],
    proposals_deadline_days: proposalDays,
    publish,
  }
}
