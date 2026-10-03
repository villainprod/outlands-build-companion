import { supabase } from './supabase'
import { sanitize, type Template } from './template'

// Thin wrapper around the `templates` table (see supabase/schema.sql).

interface Row {
  id: string
  data: unknown
  updated_at: string
}

function client() {
  if (!supabase) throw new Error('Accounts are not configured for this site.')
  return supabase
}

export async function fetchCloudTemplates(): Promise<Template[]> {
  const { data, error } = await client()
    .from('templates')
    .select('id, data, updated_at')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return ((data ?? []) as Row[])
    .map((r) => {
      const t = sanitize({ ...(r.data as object), id: r.id })
      return t ? { ...t, updatedAt: Date.parse(r.updated_at) || t.updatedAt } : null
    })
    .filter((t): t is Template => t !== null)
}

export async function upsertCloudTemplates(userId: string, list: Template[]): Promise<void> {
  if (list.length === 0) return
  const rows = list.map((t) => ({
    id: t.id,
    user_id: userId,
    name: t.name.slice(0, 80),
    data: t,
    updated_at: new Date(t.updatedAt).toISOString(),
  }))
  const { error } = await client().from('templates').upsert(rows, { onConflict: 'user_id,id' })
  if (error) throw error
}

export async function deleteCloudTemplate(id: string): Promise<void> {
  const { error } = await client().from('templates').delete().eq('id', id)
  if (error) throw error
}
