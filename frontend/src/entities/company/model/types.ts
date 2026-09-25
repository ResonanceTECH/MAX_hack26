export type CompanyVerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired'
export type CompanyStatus = 'active' | 'blocked' | 'draft'

export interface Company {
  id: string
  name: string
  shortName: string
  inn: string
  ogrn: string
  logoUrl: string | null
  description: string
  website: string | null
  region: string
  industries: string[]
  services: string[]
  capabilities: string[]
  technologies: string[]
  priceFrom: number | null
  priceTo: number | null
  rating: number
  reviewsCount: number
  verified: boolean
  casesCount: number
  verificationStatus: CompanyVerificationStatus
  status: CompanyStatus
}
