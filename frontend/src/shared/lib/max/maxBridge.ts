export interface ShareData {
  title: string
  text?: string
  url?: string
}

/**
 * Abstraction over MAX Mini App bridge.
 * Replace MockMaxBridgeAdapter with a real SDK adapter later.
 */
export interface MaxBridgeAdapter {
  isAvailable(): boolean
  getPlatform(): string | null
  shareContent(data: ShareData): Promise<void>
  close(): void
}

export class MockMaxBridgeAdapter implements MaxBridgeAdapter {
  isAvailable(): boolean {
    return false
  }

  getPlatform(): string | null {
    return null
  }

  async shareContent(data: ShareData): Promise<void> {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      })
      return
    }
    if (data.url && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(data.url)
    }
  }

  close(): void {
    // no-op outside MAX
  }
}

let adapter: MaxBridgeAdapter = new MockMaxBridgeAdapter()

export function setMaxBridgeAdapter(next: MaxBridgeAdapter): void {
  adapter = next
}

export function getMaxBridge(): MaxBridgeAdapter {
  return adapter
}
