/** Backend DTO shapes from FastAPI OpenAPI / schemas.py (snake_case). */

export interface UserDto {
  id: number
  max_user_id: number
  first_name: string | null
  last_name: string | null
  username: string | null
  email?: string | null
  role?: string
  member_role?: string | null
  is_admin: boolean
  status?: string
  created_at: string
  company_id: number | null
  last_active_at?: string | null
}

export interface AuthResponseDto {
  access_token: string
  token_type: string
  user: UserDto
}

export interface AuthInitDto {
  init_data?: string | null
  dev_max_user_id?: number | null
  dev_first_name?: string | null
  dev_last_name?: string | null
  dev_username?: string | null
}

export interface CompanyDto {
  id: number
  name: string
  inn: string | null
  description: string | null
  industries: string[]
  services: string[]
  competencies: string[]
  technologies: string[]
  regions: string[]
  budget_min: number | null
  budget_max: number | null
  max_term_days: number | null
  cases: Array<{ title?: string; description?: string } | Record<string, unknown>>
  certificates: string[]
  website: string | null
  phone: string | null
  email: string | null
  registration_date: string | null
  company_status: string | null
  verification_source: string | null
  rating: number
  is_verified: boolean
  created_at: string
  updated_at: string
  active_requests?: number
  proposals_count?: number
}

export interface CriterionDto {
  key: string
  label: string
  passed: boolean
  detail: string
}

export interface MatchDto {
  id: number
  company_id: number
  company_name: string
  score: number
  criteria: CriterionDto[]
  feedback: boolean | null
}

export interface ProposalDto {
  id: number
  request_id: number
  request_title: string
  company_id: number
  company_name: string
  price: number
  term_days: number
  solution_text: string
  case_ref: string | null
  comment: string | null
  status: string
  created_at: string
  viewed_at: string | null
}

export interface RequestDto {
  id: number
  company_id: number
  company_name: string
  title: string
  description_raw: string | null
  category: string
  subcategory: string | null
  requirements: string[]
  required_certificates: string[]
  budget_min: number | null
  budget_max: number | null
  deadline_days: number | null
  regions: string[]
  proposals_deadline_days: number
  status: string
  created_at: string
  published_at: string | null
  expires_at: string | null
  proposals_count: number
  match_id: number | null
  match_score: number | null
  match_count: number
  days_left: number | null
  matches?: MatchDto[]
  proposals?: ProposalDto[]
}

export interface DealDto {
  id: number
  opportunity_id: number
  proposal_id: number
  customer_company_id: number
  executor_company_id: number
  status: string
  created_at: string
  updated_at: string
  opportunity_title: string
  proposal: ProposalDto | null
  files: FileDto[]
  next_action: string
}

export interface FileDto {
  id: number
  name: string
  content_type: string | null
  size: number
  opportunity_id: number | null
  deal_id: number | null
  created_at: string
}

export interface NotificationDto {
  id: number
  text: string
  ok: boolean
  is_read: boolean
  created_at: string
  /** Present when backend sends typed admin/system notifications */
  type?: string
  payload?: {
    type?: string
    title?: string
    href?: string
    entityType?: string
    entityId?: string
  }
}

export interface FeedItemDto {
  match_id: number
  request: RequestDto
  score: number
  criteria: CriterionDto[]
  feedback: boolean | null
}

export interface ProposalInDto {
  price: number
  term_days: number
  solution_text: string
  case_ref?: string | null
  comment?: string | null
}

export interface RequestCreateDto {
  description?: string | null
  title?: string | null
  category?: string | null
  subcategory?: string | null
  requirements?: string[]
  required_certificates?: string[]
  budget_min?: number | null
  budget_max?: number | null
  deadline_days?: number | null
  regions?: string[]
  proposals_deadline_days?: number | null
  publish?: boolean
}

export interface DealCreateDto {
  opportunity_id: number
  proposal_id: number
}

export interface CompanyInDto {
  name: string
  inn?: string | null
  description?: string | null
  industries?: string[]
  services?: string[]
  competencies?: string[]
  regions?: string[]
  budget_min?: number | null
  budget_max?: number | null
  max_term_days?: number | null
  cases?: Array<{ title: string; description?: string }>
  certificates?: string[]
  website?: string | null
  phone?: string | null
  email?: string | null
}
