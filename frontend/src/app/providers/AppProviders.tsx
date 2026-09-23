import { useEffect, type ReactNode } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { queryClient } from '@/app/providers/queryClient'
import { router } from '@/app/router/router'
import { theme } from '@/app/theme/theme'
import { useSessionStore } from '@/features/auth/model/sessionStore'
import { useMaxStore } from '@/features/auth/model/maxStore'
import { useNotificationsStore } from '@/features/notifications/model/notificationsStore'
import { MockMaxBridgeAdapter, setMaxBridgeAdapter } from '@/shared/lib/max'

setMaxBridgeAdapter(new MockMaxBridgeAdapter())

function SessionBootstrap({ children }: { children: ReactNode }) {
  const initSession = useSessionStore((s) => s.initSession)
  const refreshMax = useMaxStore((s) => s.refresh)
  const fetchNotifications = useNotificationsStore((s) => s.fetchAll)

  useEffect(() => {
    refreshMax()
    void initSession()
    void fetchNotifications()
  }, [initSession, refreshMax, fetchNotifications])

  return children
}

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SessionBootstrap>
          <RouterProvider router={router} />
        </SessionBootstrap>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
