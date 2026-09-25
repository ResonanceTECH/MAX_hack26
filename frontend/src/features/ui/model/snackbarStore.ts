import { create } from 'zustand'
import type { AlertColor } from '@mui/material/Alert'

interface SnackbarState {
  open: boolean
  message: string
  severity: AlertColor
  actionLabel: string | null
  onAction: (() => void) | null
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showInfo: (message: string, options?: { actionLabel?: string; onAction?: () => void }) => void
  hide: () => void
}

export const useSnackbarStore = create<SnackbarState>((set) => ({
  open: false,
  message: '',
  severity: 'success',
  actionLabel: null,
  onAction: null,
  showSuccess: (message) =>
    set({ open: true, message, severity: 'success', actionLabel: null, onAction: null }),
  showError: (message) =>
    set({ open: true, message, severity: 'error', actionLabel: null, onAction: null }),
  showInfo: (message, options) =>
    set({
      open: true,
      message,
      severity: 'info',
      actionLabel: options?.actionLabel ?? null,
      onAction: options?.onAction ?? null,
    }),
  hide: () => set({ open: false, actionLabel: null, onAction: null }),
}))
