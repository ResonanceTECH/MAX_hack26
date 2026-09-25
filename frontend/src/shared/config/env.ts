/**
 * Backend mounts routes at root (no /api/v1).
 * Local: leave empty and use Vite proxy, or set http://localhost:8000
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

/** true unless VITE_USE_MOCK_API === 'false' */
export const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false'
