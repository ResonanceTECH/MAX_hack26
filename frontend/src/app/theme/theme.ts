import { createTheme } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Palette {
    match: Palette['primary']
  }
  interface PaletteOptions {
    match?: PaletteOptions['primary']
  }
}

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0B1F3A',
      light: '#1A3A5C',
      dark: '#061428',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#1F6F8B',
      light: '#3A9BB8',
      dark: '#155368',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#2E7D4F',
      light: '#4CAF71',
      dark: '#1B5E35',
    },
    warning: {
      main: '#C47F17',
      light: '#E0A03A',
      dark: '#8F5C10',
    },
    error: {
      main: '#C62828',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A2332',
      secondary: '#5A6A7A',
    },
    divider: '#E2E8F0',
    match: {
      main: '#1F6F8B',
      light: '#E8F4F8',
      dark: '#155368',
      contrastText: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h1: { fontSize: '1.75rem', fontWeight: 650, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.375rem', fontWeight: 650, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.125rem', fontWeight: 600 },
    h4: { fontSize: '1rem', fontWeight: 600 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.55 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 10,
  },
  shadows: [
    'none',
    '0 1px 2px rgba(11, 31, 58, 0.06)',
    '0 2px 8px rgba(11, 31, 58, 0.08)',
    '0 4px 16px rgba(11, 31, 58, 0.1)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
    '0 8px 24px rgba(11, 31, 58, 0.12)',
  ],
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 10,
          px: 2,
        },
        sizeSmall: {
          minHeight: 36,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: 44,
          minHeight: 44,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 2px rgba(11, 31, 58, 0.06)',
          borderRadius: 10,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 64,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 56,
          paddingTop: 8,
        },
        label: {
          fontSize: '0.7rem',
          '&.Mui-selected': {
            fontSize: '0.7rem',
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          WebkitTapHighlightColor: 'transparent',
        },
        body: {
          margin: 0,
          minHeight: '100dvh',
          overflowX: 'hidden',
        },
        '#root': {
          minHeight: '100dvh',
        },
        '*:focus-visible': {
          outline: '2px solid #1F6F8B',
          outlineOffset: 2,
        },
      },
    },
  },
})
