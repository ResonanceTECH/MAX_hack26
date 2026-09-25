import type { ReactNode } from 'react'
import { Menu } from '@base-ui/react/menu'
import ButtonBase from '@mui/material/ButtonBase'
import { AppIcon } from '@/shared/ui'
import { MoreVerticalCircle01Icon } from '@/shared/ui/icons'

export interface BaseUiMenuItem {
  key: string
  label: string
  onClick?: () => void
  disabled?: boolean
  destructive?: boolean
  separatorBefore?: boolean
}

export interface BaseUiMenuProps {
  items: BaseUiMenuItem[]
  triggerLabel?: string
  trigger?: ReactNode
  'aria-label'?: string
}

export function BaseUiMenu({
  items,
  triggerLabel,
  trigger,
  'aria-label': ariaLabel = 'Действия',
}: BaseUiMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger
        nativeButton={!trigger}
        render={
          trigger ? (
            (props) => <span {...props}>{trigger}</span>
          ) : (
            <ButtonBase
              aria-label={ariaLabel}
              sx={{
                p: 0.75,
                borderRadius: 1,
                color: 'text.secondary',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            />
          )
        }
      >
        {trigger
          ? null
          : (triggerLabel ?? <AppIcon icon={MoreVerticalCircle01Icon} size={18} aria-hidden />)}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} align="end">
          <Menu.Popup
            style={{
              zIndex: 1400,
              minWidth: 180,
              padding: 6,
              borderRadius: 12,
              border: '1px solid var(--mui-palette-divider, #e0e0e0)',
              background: 'var(--mui-palette-background-paper, #fff)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }}
          >
            {items.map((item) => (
              <span key={item.key}>
                {item.separatorBefore ? (
                  <Menu.Separator
                    style={{
                      height: 1,
                      margin: '4px 0',
                      background: 'var(--mui-palette-divider, #e0e0e0)',
                      border: 'none',
                    }}
                  />
                ) : null}
                <Menu.Item
                  disabled={item.disabled}
                  onClick={item.onClick}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: item.disabled ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    color: item.destructive
                      ? 'var(--mui-palette-error-main, #d32f2f)'
                      : 'inherit',
                    opacity: item.disabled ? 0.5 : 1,
                  }}
                >
                  {item.label}
                </Menu.Item>
              </span>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
