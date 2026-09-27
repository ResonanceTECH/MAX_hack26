/**
 * Backend mounts all business routes under /api.
 * Default `/api` → same-origin (Caddy / Vite proxy).
 * Override: VITE_API_BASE_URL=http://localhost:8000/api
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

/** false unless VITE_USE_MOCK_API === 'true' (Wave A: real API by default) */
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'
