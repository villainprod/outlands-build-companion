import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { deleteCloudTemplate, fetchCloudTemplates, upsertCloudTemplates } from '../lib/cloud'
import {
  isLocalDismissed,
  loadOwnLocalTemplates,
  loadTemplates,
  saveTemplates,
  setLocalDismissed,
} from '../lib/storage'
import type { Template } from '../lib/template'

export type LoadStatus = 'loading' | 'ready' | 'error'
export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const SAVE_DELAY_MS = 700

/**
 * One place that owns the template list.
 * Signed out: stored in this browser (localStorage).
 * Signed in:  stored in the person's account, saved shortly after each edit.
 */
export function useTemplates(userId: string | null) {
  const mode = userId ? 'cloud' : 'local'
  const [templates, setTemplates] = useState<Template[]>(() => (userId ? [] : loadTemplates()))
  // Whose list `templates` currently holds: 'local' or a user id. Guards against
  // writing an account's templates into this browser during sign-out.
  const [owner, setOwner] = useState<string>(userId ?? 'local')
  const [status, setStatus] = useState<LoadStatus>(userId ? 'loading' : 'ready')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [localToMove, setLocalToMove] = useState<Template[]>([])

  const pending = useRef(new Map<string, Template>())
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userRef = useRef(userId)
  useLayoutEffect(() => {
    userRef.current = userId
  }, [userId])

  // ----- saving (cloud) -----
  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    const uid = userRef.current
    if (!uid || pending.current.size === 0) return
    const batch = [...pending.current.values()]
    pending.current.clear()
    setSaveState('saving')
    try {
      await upsertCloudTemplates(uid, batch)
      if (pending.current.size === 0) setSaveState('saved')
    } catch {
      // Put them back unless a newer edit has already been queued.
      for (const t of batch) if (!pending.current.has(t.id)) pending.current.set(t.id, t)
      setSaveState('error')
    }
  }, [])

  const queue = useCallback(
    (t: Template, immediate = false) => {
      pending.current.set(t.id, t)
      setSaveState('saving')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(flush, immediate ? 0 : SAVE_DELAY_MS)
    },
    [flush],
  )

  // ----- loading when the signed-in person changes -----
  const load = useCallback(async () => {
    if (!userId) {
      setTemplates(loadTemplates())
      setOwner('local')
      setStatus('ready')
      setLocalToMove([])
      return
    }
    setStatus('loading')
    setTemplates([])
    setOwner(userId)
    try {
      const cloud = await fetchCloudTemplates()
      if (userRef.current !== userId) return
      setTemplates(cloud)
      setStatus('ready')
      const ids = new Set(cloud.map((t) => t.id))
      setLocalToMove(isLocalDismissed(userId) ? [] : loadOwnLocalTemplates().filter((t) => !ids.has(t.id)))
    } catch {
      if (userRef.current === userId) setStatus('error')
    }
  }, [userId])

  useEffect(() => {
    pending.current.clear()
    setSaveState('idle')
    void load()
  }, [load])

  // Signed out: mirror every change into localStorage.
  useEffect(() => {
    if (owner === 'local') saveTemplates(templates)
  }, [owner, templates])

  // Don't lose an edit made just before closing the tab.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') void flush()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', onHide)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', onHide)
    }
  }, [flush])

  // ----- actions -----
  const add = useCallback(
    (list: Template[]) => {
      setTemplates((cur) => [...list, ...cur])
      if (mode === 'cloud') list.forEach((t) => queue(t, true))
    },
    [mode, queue],
  )

  const update = useCallback(
    (t: Template) => {
      const next = { ...t, updatedAt: Date.now() }
      setTemplates((cur) => cur.map((x) => (x.id === t.id ? next : x)))
      if (mode === 'cloud') queue(next)
    },
    [mode, queue],
  )

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      const before = templates
      setTemplates((cur) => cur.filter((x) => x.id !== id))
      if (mode !== 'cloud') return true
      pending.current.delete(id)
      try {
        await deleteCloudTemplate(id)
        return true
      } catch {
        setTemplates(before)
        setSaveState('error')
        return false
      }
    },
    [mode, templates],
  )

  /** Copy templates made while signed out into the account, then clear them from this browser. */
  const moveLocal = useCallback(async (): Promise<boolean> => {
    if (!userId || localToMove.length === 0) return false
    setSaveState('saving')
    try {
      await upsertCloudTemplates(userId, localToMove)
      setTemplates((cur) => [...localToMove, ...cur])
      saveTemplates([])
      setLocalToMove([])
      setSaveState('saved')
      return true
    } catch {
      setSaveState('error')
      return false
    }
  }, [userId, localToMove])

  const dismissLocal = useCallback(() => {
    if (userId) setLocalDismissed(userId)
    setLocalToMove([])
  }, [userId])

  return {
    mode,
    templates,
    status,
    saveState,
    localToMove,
    add,
    update,
    remove,
    flush,
    retry: () => (status === 'error' ? load() : flush()),
    moveLocal,
    dismissLocal,
  }
}
