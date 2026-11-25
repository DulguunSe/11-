import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { ApiError } from '../shared/api.ts'

/* ---------------- Нэвтэрсэн хэрэглэгч ---------------- */
export type User = { id: number; username: string; name: string; role: 'admin' | 'doctor' | 'reception'; is_doctor: number; must_change_password: number }
export const UserContext = createContext<User | null>(null)
export const useUser = () => useContext(UserContext)!
export const ROLE_LABEL: Record<User['role'], string> = { admin: 'Админ', doctor: 'Эмч', reception: 'Ресепшн' }

/* ---------------- Өгөгдөл ачаалах ---------------- */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const seq = useRef(0)
  const load = useCallback(async () => {
    const my = ++seq.current
    setLoading(true)
    try {
      const d = await fn()
      if (my === seq.current) {
        setData(d)
        setError('')
      }
    } catch (e) {
      if (my === seq.current) setError(e instanceof ApiError ? e.message : 'Ачаалж чадсангүй')
    } finally {
      if (my === seq.current) setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => {
    void load()
  }, [load])
  return { data, error, loading, reload: load, setData }
}

export const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Алдаа гарлаа')

/* ---------------- Мэдэгдэл (toast) ---------------- */
type Toast = { id: number; msg: string; kind: 'ok' | 'err' }
const ToastContext = createContext<(msg: string, kind?: 'ok' | 'err') => void>(() => {})
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([])
  const push = useCallback((msg: string, kind: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random()
    setList((l) => [...l, { id, msg, kind }])
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), kind === 'err' ? 5000 : 2600)
  }, [])
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {list.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-md rounded-2xl px-5 py-3 text-sm font-semibold shadow-xl ${t.kind === 'err' ? 'bg-red-600 text-white' : 'bg-ink text-white'}`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/** Хүсэлт илгээх үеийн busy төлөв + алдааг toast-оор харуулах */
export function useAction() {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const run = useCallback(
    async <T,>(fn: () => Promise<T>, ok?: string): Promise<T | undefined> => {
      setBusy(true)
      try {
        const r = await fn()
        if (ok) toast(ok)
        return r
      } catch (e) {
        toast(errMsg(e), 'err')
        return undefined
      } finally {
        setBusy(false)
      }
    },
    [toast],
  )
  return { busy, run }
}

export function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export function useMedia(query: string) {
  const [match, setMatch] = useState(() => matchMedia(query).matches)
  useEffect(() => {
    const m = matchMedia(query)
    const on = () => setMatch(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [query])
  return match
}
