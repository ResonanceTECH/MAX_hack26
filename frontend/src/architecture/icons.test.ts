import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

describe('Hugeicons', () => {
  it('[ICON-01] icon pack is Hugeicons and competing packs are not dependencies', () => {
    const icons = readFileSync(path.join(root, 'src/shared/ui/icons.ts'), 'utf8')
    const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>
      devDependencies: Record<string, string>
    }
    const names = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.devDependencies)]
    expect(icons).toMatch(/@hugeicons\/core-free-icons/)
    for (const banned of [
      'lucide-react',
      '@mui/icons-material',
      '@fortawesome/fontawesome-svg-core',
      '@fortawesome/react-fontawesome',
      '@heroicons/react',
    ]) {
      expect(names, `forbidden icon package ${banned}`).not.toContain(banned)
    }
  })
})
