export interface ShareData {
  title: string
  text?: string
  url?: string
}

export interface OpenChatParams {
  dealId?: string
  title?: string
  url?: string
}

export type OpenChatResult = { mode: 'max' } | { mode: 'share' } | { mode: 'clipboard' } | { mode: 'noop' }

/**
 * Abstraction over MAX Mini App bridge.
 * Real adapter only when host SDK is present; otherwise browser fallback.
 */
export interface MaxBridgeAdapter {
  isAvailable(): boolean
  getPlatform(): string | null
  getInitData(): string | null
  shareContent(data: ShareData): Promise<void>
  openChat(params?: OpenChatParams): Promise<OpenChatResult>
  close(): void
}

type MaxHost = {
  initData?: string
  platform?: string
  close?: () => void
  openLink?: (url: string) => void
  shareURL?: (url: string, text?: string) => void
  openTelegramLink?: (url: string) => void
}

function getMaxHost(): MaxHost | null {
  if (typeof window === 'undefined') return null
  const w = window as Window & {
    WebApp?: MaxHost
    MaxWebApp?: MaxHost
    MAX?: MaxHost
    Telegram?: { WebApp?: MaxHost }
  }
  return w.MaxWebApp ?? w.WebApp ?? w.Telegram?.WebApp ?? w.MAX ?? null
}

async function browserShareOrCopy(data: ShareData): Promise<'share' | 'clipboard' | 'noop'> {
  const url = data.url ?? (typeof window !== 'undefined' ? window.location.href : undefined)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url,
      })
      return 'share'
    } catch {
      // user cancelled or unsupported — fall through
    }
  }
  if (url && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
    return 'clipboard'
  }
  return 'noop'
}

/** Browser / non-MAX fallback — never alerts. */
export class BrowserMaxBridgeAdapter implements MaxBridgeAdapter {
  isAvailable(): boolean {
    return false
  }

  getPlatform(): string | null {
    return null
  }

  getInitData(): string | null {
    return null
  }

  async shareContent(data: ShareData): Promise<void> {
    await browserShareOrCopy(data)
  }

  async openChat(params?: OpenChatParams): Promise<OpenChatResult> {
    const mode = await browserShareOrCopy({
      title: params?.title ?? 'Сделка',
      text: params?.title,
      url: params?.url ?? (typeof window !== 'undefined' ? window.location.href : undefined),
    })
    return { mode }
  }

  close(): void {
    // no-op outside MAX
  }
}

/** @deprecated alias — tests may still import MockMaxBridgeAdapter */
export class MockMaxBridgeAdapter extends BrowserMaxBridgeAdapter {}

/** Real host SDK when running inside MAX Mini App. */
export class RealMaxBridgeAdapter implements MaxBridgeAdapter {
  private host: MaxHost

  constructor(host: MaxHost) {
    this.host = host
  }

  isAvailable(): boolean {
    return true
  }

  getPlatform(): string | null {
    return this.host.platform ?? 'max'
  }

  getInitData(): string | null {
    return this.host.initData ?? null
  }

  async shareContent(data: ShareData): Promise<void> {
    const url = data.url ?? (typeof window !== 'undefined' ? window.location.href : '')
    if (typeof this.host.shareURL === 'function' && url) {
      this.host.shareURL(url, data.text ?? data.title)
      return
    }
    if (typeof this.host.openLink === 'function' && url) {
      this.host.openLink(url)
      return
    }
    await browserShareOrCopy(data)
  }

  async openChat(params?: OpenChatParams): Promise<OpenChatResult> {
    const url = params?.url ?? (typeof window !== 'undefined' ? window.location.href : '')
    if (typeof this.host.openLink === 'function' && url) {
      this.host.openLink(url)
      return { mode: 'max' }
    }
    if (typeof this.host.openTelegramLink === 'function' && url) {
      this.host.openTelegramLink(url)
      return { mode: 'max' }
    }
    if (typeof this.host.shareURL === 'function' && url) {
      this.host.shareURL(url, params?.title)
      return { mode: 'max' }
    }
    const mode = await browserShareOrCopy({
      title: params?.title ?? 'Сделка',
      text: params?.title,
      url,
    })
    return { mode }
  }

  close(): void {
    this.host.close?.()
  }
}

export function createMaxBridge(): MaxBridgeAdapter {
  const host = getMaxHost()
  // Only install real adapter when a host SDK object is actually present
  if (host) {
    return new RealMaxBridgeAdapter(host)
  }
  return new BrowserMaxBridgeAdapter()
}

/** Detect MAX/Telegram WebApp host and install the appropriate adapter. */
export function detectAndInstallMaxBridge(): MaxBridgeAdapter {
  const next = createMaxBridge()
  setMaxBridgeAdapter(next)
  return next
}

let adapter: MaxBridgeAdapter = new BrowserMaxBridgeAdapter()

export function setMaxBridgeAdapter(next: MaxBridgeAdapter): void {
  adapter = next
}

export function getMaxBridge(): MaxBridgeAdapter {
  return adapter
}
