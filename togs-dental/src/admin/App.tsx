import { lazy, Suspense, useCallback, useEffect, useState, type FormEvent } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BarChart3, CalendarDays, ExternalLink, LayoutDashboard, LogOut, Megaphone, Menu, MessageSquare, Settings, Users, X, KeyRound } from 'lucide-react'
import { api } from '../shared/api.ts'
import { ROLE_LABEL, ToastProvider, UserContext, errMsg, useToast, useUser, type User } from './lib.tsx'
import { Button, Input, Spinner } from './ui.tsx'

const Dashboard = lazy(() => import('./pages/Dashboard.tsx'))
const Schedule = lazy(() => import('./pages/Schedule.tsx'))
const Patients = lazy(() => import('./pages/Patients.tsx'))
const PatientCard = lazy(() => import('./pages/PatientCard.tsx'))
const Reports = lazy(() => import('./pages/Reports.tsx'))
const Marketing = lazy(() => import('./pages/Marketing.tsx'))
const Sms = lazy(() => import('./pages/Sms.tsx'))
const SettingsPage = lazy(() => import('./pages/Settings.tsx'))

export function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  )
}

function Shell() {
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const refresh = useCallback(() => {
    api
      .get<{ user: User | null }>('/api/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
  }, [])
  useEffect(() => {
    refresh()
    const on = () => setUser(null)
    addEventListener('togs:unauthorized', on)
    return () => removeEventListener('togs:unauthorized', on)
  }, [refresh])

  if (user === undefined) return <Spinner />
  if (!user) return <Login onLogin={setUser} />
  if (user.must_change_password) return <ChangePassword forced onDone={refresh} />
  return (
    <UserContext.Provider value={user}>
      <Layout onLogout={() => setUser(null)} />
    </UserContext.Provider>
  )
}

const NAV = [
  { to: '/', label: 'Хянах самбар', icon: LayoutDashboard, roles: ['admin', 'doctor', 'reception'] },
  { to: '/schedule', label: 'Цагийн хуваарь', icon: CalendarDays, roles: ['admin', 'doctor', 'reception'] },
  { to: '/patients', label: 'Үйлчлүүлэгчид', icon: Users, roles: ['admin', 'doctor', 'reception'] },
  { to: '/reports', label: 'Тайлан', icon: BarChart3, roles: ['admin', 'doctor', 'reception'] },
  { to: '/marketing', label: 'AI маркетинг', icon: Megaphone, roles: ['admin', 'reception'] },
  { to: '/sms', label: 'SMS', icon: MessageSquare, roles: ['admin', 'reception'] },
  { to: '/settings', label: 'Тохиргоо', icon: Settings, roles: ['admin'] },
] as const

function Layout({ onLogout }: { onLogout: () => void }) {
  const user = useUser()
  const [open, setOpen] = useState(false)
  const [pwOpen, setPwOpen] = useState(false)
  const location = useLocation()
  useEffect(() => setOpen(false), [location.pathname])
  const items = NAV.filter((n) => (n.roles as readonly string[]).includes(user.role))

  const logout = async () => {
    await api.post('/api/auth/logout').catch(() => {})
    onLogout()
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition ${isActive ? 'bg-white/12 text-white' : 'text-white/65 hover:bg-white/6 hover:text-white'}`
          }
        >
          <Icon size={19} />
          {label}
        </NavLink>
      ))}
    </nav>
  )

  const sidebar = (
    <div className="flex h-full flex-col bg-ink px-3 py-4 text-white">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <img src="/img/mark.png" alt="" className="h-10 w-10 rounded-full bg-white p-1" />
        <div className="leading-none">
          <div className="font-[Forum] text-2xl tracking-[0.12em]">ТӨГС</div>
          <div className="mt-1 text-[10px] font-semibold tracking-[0.2em] text-white/55">ЭМНЭЛГИЙН СИСТЕМ</div>
        </div>
      </div>
      {nav}
      <div className="mt-auto space-y-1 border-t border-white/10 pt-3">
        <a href="/" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/6 hover:text-white">
          <ExternalLink size={17} />
          Вэбсайт харах
        </a>
        <button type="button" onClick={() => setPwOpen(true)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/60 hover:bg-white/6 hover:text-white">
          <KeyRound size={17} />
          Нууц үг солих
        </button>
        <div className="flex items-center justify-between gap-2 rounded-xl px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="text-xs text-white/50">{ROLE_LABEL[user.role]}</p>
          </div>
          <button type="button" onClick={() => void logout()} className="grid h-9 w-9 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white" aria-label="Гарах" title="Гарах">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur lg:hidden">
        <button type="button" onClick={() => setOpen(true)} className="grid h-10 w-10 place-items-center rounded-xl ring-1 ring-line" aria-label="Цэс нээх">
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/img/mark.png" alt="" className="h-8 w-8" />
          <span className="font-[Forum] text-xl tracking-[0.12em]">ТӨГС</span>
        </div>
        <span className="w-10" />
      </header>
      {open && (
        <div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="relative h-full w-72" onClick={(e) => e.stopPropagation()}>
            {sidebar}
            <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-4 grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:bg-white/10" aria-label="Цэс хаах">
              <X size={20} />
            </button>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
        <Suspense fallback={<Spinner />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:id" element={<PatientCard />} />
            <Route path="/reports" element={<Reports />} />
            {user.role !== 'doctor' && <Route path="/marketing" element={<Marketing />} />}
            {user.role !== 'doctor' && <Route path="/sms" element={<Sms />} />}
            {user.role === 'admin' && <Route path="/settings" element={<SettingsPage />} />}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      {pwOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-4" onMouseDown={(e) => e.target === e.currentTarget && setPwOpen(false)}>
          <ChangePassword onDone={() => setPwOpen(false)} onCancel={() => setPwOpen(false)} />
        </div>
      )}
    </div>
  )
}

function Login({ onLogin }: { onLogin: (u: User) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      const r = await api.post<{ user: User }>('/api/auth/login', { username: username.trim(), password })
      onLogin(r.user)
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="grid min-h-dvh place-items-center bg-[radial-gradient(60%_60%_at_85%_10%,#e6f6fd,transparent),radial-gradient(50%_50%_at_0%_100%,#eefae4,transparent)] p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-[0_30px_60px_-30px_rgba(12,26,44,0.35)] ring-1 ring-line">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/img/mark.png" alt="" className="h-16 w-16" />
          <div className="mt-3 font-[Forum] text-3xl tracking-[0.14em]">ТӨГС</div>
          <p className="mt-1 text-sm text-muted">Эмнэлгийн удирдлагын систем</p>
        </div>
        <div className="space-y-4">
          <Input id="username" label="Нэвтрэх нэр" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus />
          <Input id="password" label="Нууц үг" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{err}</p>}
          <Button type="submit" className="w-full" busy={busy}>
            Нэвтрэх
          </Button>
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          <a href="/" className="hover:text-blue">← Вэбсайт руу буцах</a>
        </p>
      </form>
    </div>
  )
}

function ChangePassword({ forced, onDone, onCancel }: { forced?: boolean; onDone: () => void; onCancel?: () => void }) {
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr('')
    if (next.length < 8) return setErr('Шинэ нууц үг хамгийн багадаа 8 тэмдэгт байна')
    if (next !== again) return setErr('Шинэ нууц үг таарахгүй байна')
    setBusy(true)
    try {
      await api.post('/api/auth/password', { current, next })
      toast('Нууц үг солигдлоо')
      onDone()
    } catch (e) {
      setErr(errMsg(e))
    } finally {
      setBusy(false)
    }
  }
  const form = (
    <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-xl ring-1 ring-line">
      <h1 className="text-xl font-bold">{forced ? 'Нууц үгээ солино уу' : 'Нууц үг солих'}</h1>
      {forced && <p className="mt-1 text-sm text-muted">Аюулгүй байдлын үүднээс анх нэвтрэхдээ өөрийн нууц үгийг тохируулна.</p>}
      <div className="mt-5 space-y-4">
        <Input id="cur" label="Одоогийн нууц үг" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        <Input id="new" label="Шинэ нууц үг" hint="8+ тэмдэгт" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />
        <Input id="again" label="Шинэ нууц үг (дахин)" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} required />
        {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{err}</p>}
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="secondary" className="flex-1" onClick={onCancel}>
              Болих
            </Button>
          )}
          <Button type="submit" className="flex-1" busy={busy}>
            Хадгалах
          </Button>
        </div>
      </div>
    </form>
  )
  return forced ? <div className="grid min-h-dvh place-items-center bg-soft p-4">{form}</div> : form
}
