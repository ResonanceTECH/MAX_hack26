import Avatar from '@mui/material/Avatar'

export interface CompanyAvatarProps {
  name: string
  logoUrl?: string | null
  size?: number
}

export function CompanyAvatar({ name, logoUrl, size = 48 }: CompanyAvatarProps) {
  return (
    <Avatar
      src={logoUrl ?? undefined}
      alt=""
      sx={{
        width: size,
        height: size,
        bgcolor: 'primary.main',
        fontSize: size * 0.4,
        fontWeight: 600,
      }}
    >
      {name.slice(0, 1)}
    </Avatar>
  )
}
