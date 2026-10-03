import { exampleTemplates, sanitize, type Template } from './template'

const KEY = 'obc.templates.v1'

/** Templates live in this browser's localStorage. Nothing is sent anywhere. */
export function loadTemplates(): Template[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return exampleTemplates()
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return exampleTemplates()
    return parsed.map(sanitize).filter((t): t is Template => t !== null)
  } catch {
    return exampleTemplates()
  }
}

export function saveTemplates(list: Template[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // Storage full or blocked (private mode). The app still works for this visit.
  }
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'template'
}
