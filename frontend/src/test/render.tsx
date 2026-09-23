import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@mui/material/styles'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { ReactElement, ReactNode } from 'react'
import { theme } from '@/app/theme/theme'
import { getCompanyById } from '@/shared/mocks'
import { mockCurrentUser } from '@/shared/mocks/user'
import { useSessionStore } from '@/features/auth/model/sessionStore'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

export function loginAsBusinessUser() {
  const company = getCompanyById('company-digital-lab')
  useSessionStore.setState({
    user: mockCurrentUser,
    company: company ?? null,
    isInitialized: true,
    isLoading: false,
    error: null,
  })
}

export function renderWithProviders(ui: ReactElement, route = '/', options?: RenderOptions) {
  const client = createTestQueryClient()
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>
        <ThemeProvider theme={theme}>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </ThemeProvider>
      </QueryClientProvider>
    )
  }
  return { client, ...render(ui, { wrapper: Wrapper, ...options }) }
}

export function renderRouted(ui: ReactElement, path: string, pattern: string) {
  return renderWithProviders(
    <Routes>
      <Route path={pattern} element={ui} />
    </Routes>,
    path,
  )
}
