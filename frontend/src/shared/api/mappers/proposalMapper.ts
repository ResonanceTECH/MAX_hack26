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
  /** Titles / free notes — only for solution_text, never as case_ref. */
  cases: string[]
  /** Real CompanyCase id for API `case_ref`. Empty/omit → null. */
  caseId?: string | null
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

/** Backend `ProposalIn.price` / `term_days` are ints — JSON floats like 1e+20 → 422 "exceeded maximum size". */
export function toProposalApiInt(
  value: number,
  opts: { min: number; max: number },
): number {
  if (!Number.isFinite(value)) {
    throw new Error('Ожидалось конечное число')
  }
  const n = Math.trunc(value)
  if (n < opts.min || n > opts.max) {
    throw new Error(`Число вне диапазона ${opts.min}–${opts.max}`)
  }
  return n
}

export function buildProposalSolutionText(payload: ProposalCreateInput): string {
  const blocks = [payload.description.trim()]
  if (payload.included.length) {
    blocks.push(`Включено: ${payload.included.join(', ')}`)
  }
  if (payload.excluded.length) {
    blocks.push(`Не включено: ${payload.excluded.join(', ')}`)
  }
  if (payload.cases.length) {
    blocks.push(`Кейсы: ${payload.cases.join(', ')}`)
  }
  return blocks.filter(Boolean).join('\n\n')
}

/** Backend `_assert_case_belongs_to_company` — only numeric company case ids (or exact titles). We only send ids. */
export function resolveCaseRef(caseId: string | null | undefined): string | null {
  const ref = caseId?.trim()
  if (!ref) return null
  // Free-text like "222" / "нет" must never go as case_ref unless it's a selected profile case id.
  if (!/^\d+$/.test(ref)) return null
  return ref
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
  // Backend: case_ref must be a CompanyCase of the executor. Form free-text is NOT a ref —
  // only explicit caseId from the company cases picker. Otherwise 422:
  // «case_ref должен ссылаться на кейс вашей компании».
  return {
    price: toProposalApiInt(payload.price, { min: 1, max: 1_000_000_000_000 }),
    term_days: toProposalApiInt(payload.durationDays, { min: 1, max: 3_650 }),
    solution_text: buildProposalSolutionText(payload),
    case_ref: resolveCaseRef(payload.caseId),
    comment: payload.comment?.trim() || null,
  }
}
