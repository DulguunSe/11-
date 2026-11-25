import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, Bot, Check, CheckCircle2, Clock, ImagePlus, Pencil, Plus, RefreshCw, Rocket, Send, Sparkles, Trash2, Undo2, Upload, XCircle } from 'lucide-react'
import { api } from '../../shared/api.ts'
import { WEEKDAYS } from '../../shared/format.ts'
import { useAction, useLoad, useUser } from '../lib.tsx'
import { Badge, Button, Card, Empty, ErrorBox, Input, Modal, PageHeader, Select, Spinner, Tabs, Textarea, Toggle } from '../ui.tsx'

type Design = { headline: string; subline: string; points: string[]; badge: string; media_id: number | null }
type Post = {
  id: number
  status: 'draft' | 'approved' | 'publishing' | 'published' | 'failed' | 'rejected'
  source: 'ai' | 'manual'
  kind: string
  topic: string
  caption: string
  hashtags: string
  template: 'photo' | 'tip' | 'promo' | 'quote'
  design: Design
  image_url: string | null
  platforms: string
  scheduled_at: string | null
  published_at: string | null
  fb_post_id: string | null
  ig_media_id: string | null
  error: string | null
  overdue: boolean
  preview_caption: string
  updated_at: string
}
type Media = { id: number; url: string; kind: 'photo' | 'logo'; description: string; width: number; height: number }
type Autopilot = {
  enabled: boolean
  frequency: 'daily' | 'every2' | 'weekdays'
  weekdays: number[]
  time: string
  platforms: ('facebook' | 'instagram')[]
  requireApproval: boolean
  keepAhead: number
  nextSlots?: string[]
}
type Overview = {
  aiConfigured: boolean
  model: string
  publicUrl: string
  httpsReady: boolean
  social: { connected: boolean; pageName: string; igUsername: string; hasInstagram: boolean }
  autopilot: Autopilot
  counts: Record<string, number>
  bookingsFromPosts: number
  nextSlots: string[]
}
type Brand = { about: string; audience: string; tone: string; emoji: 'none' | 'light' | 'moderate'; hashtags: string; rules: string; promos: string; samples: string; styleGuide: string }

const TEMPLATE_LABEL = { photo: 'Зурагтай', tip: 'Зөвлөгөө (жагсаалт)', promo: 'Онцлох / урамшуулал', quote: 'Мэндчилгээ, богино мессеж' }
const STATUS: Record<Post['status'], { label: string; tone: 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'violet' }> = {
  draft: { label: 'Батлах хүлээж буй', tone: 'amber' },
  approved: { label: 'Хуваарьт орсон', tone: 'blue' },
  publishing: { label: 'Нийтэлж байна', tone: 'violet' },
  published: { label: 'Нийтлэгдсэн', tone: 'green' },
  failed: { label: 'Амжилтгүй', tone: 'red' },
  rejected: { label: 'Татгалзсан', tone: 'gray' },
}
const fmtSlot = (s: string | null) => {
  if (!s) return '—'
  const [d, t] = s.split(' ')
  const [, m, day] = d.split('-').map(Number)
  const wd = WEEKDAYS[new Date(`${d}T00:00:00`).getDay()]
  return `${m}/${day} (${wd}) ${t}`
}

export default function Marketing() {
  const user = useUser()
  const [tab, setTab] = useState<'posts' | 'history' | 'brand' | 'media' | 'autopilot' | 'connection'>('posts')
  const ov = useLoad(() => api.get<Overview>('/api/marketing/overview'), [])
  const o = ov.data

  return (
    <div>
      <PageHeader
        title="AI маркетинг"
        subtitle="AI пост бичиж, брэндийн зураг бүтээнэ. Та хянаж зөвшөөрсний дараа Facebook, Instagram-д хуваарийн дагуу автоматаар нийтэлнэ."
      />
      {ov.error && <ErrorBox message={ov.error} onRetry={ov.reload} />}
      {o && (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatusCard ok={o.aiConfigured} icon={<Bot size={18} />} title="AI (Claude)" text={o.aiConfigured ? `Бэлэн · ${o.model}` : 'Түлхүүр тохируулаагүй'} />
          <StatusCard
            ok={o.social.connected}
            icon={<Send size={18} />}
            title="Facebook / Instagram"
            text={o.social.connected ? `${o.social.pageName || 'Хуудас'}${o.social.hasInstagram ? ` · @${o.social.igUsername || 'Instagram'}` : ' · Instagram холбоогүй'}` : 'Холбогдоогүй'}
          />
          <StatusCard
            ok={o.autopilot.enabled}
            icon={<Clock size={18} />}
            title="Автомат хуваарь"
            text={o.autopilot.enabled ? `${{ daily: 'Өдөр бүр', every2: '2 хоног тутам', weekdays: 'Сонгосон гарагт' }[o.autopilot.frequency]} ${o.autopilot.time}` : 'Унтраастай'}
          />
          <StatusCard ok icon={<CheckCircle2 size={18} />} title="Постоос ирсэн захиалга" text={`${o.bookingsFromPosts} онлайн захиалга`} />
        </div>
      )}
      {o && !o.aiConfigured && (
        <div className="mb-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={17} /> AI-г идэвхжүүлэх
          </p>
          <p className="mt-1">
            Сервер дээр <code className="rounded bg-white px-1">ANTHROPIC_API_KEY</code> орчны хувьсагч тохируулахад AI пост бичиж эхэлнэ (console.anthropic.com-оос түлхүүр авна). Түлхүүргүйгээр гараар пост бэлтгэж, зураг бүтээж, хуваарьт оруулж болно.
          </p>
        </div>
      )}
      {o?.social.connected && o.social.hasInstagram && !o.httpsReady && (
        <div className="mb-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          Instagram-д нийтлэхийн тулд сайт HTTPS домэйн дээр ажиллах ёстой (одоогийн хаяг: {o.publicUrl}). Серверийн PUBLIC_URL-ийг тохируулна уу.
        </div>
      )}

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'posts', label: 'Постууд', count: (o?.counts.draft ?? 0) + (o?.counts.approved ?? 0) },
          { value: 'history', label: 'Түүх', count: o?.counts.failed },
          { value: 'brand', label: 'Брэнд, хэв маяг' },
          { value: 'media', label: 'Зургийн сан' },
          { value: 'autopilot', label: 'Хуваарь' },
          ...(user.role === 'admin' ? [{ value: 'connection' as const, label: 'Холболт' }] : []),
        ]}
      />
      {tab === 'posts' && o && <PostsTab overview={o} onChanged={ov.reload} />}
      {tab === 'history' && <HistoryTab onChanged={ov.reload} />}
      {tab === 'brand' && o && <BrandTab socialConnected={o.social.connected} aiConfigured={o.aiConfigured} />}
      {tab === 'media' && <MediaTab />}
      {tab === 'autopilot' && <AutopilotTab onChanged={ov.reload} canEdit={user.role === 'admin'} />}
      {tab === 'connection' && <ConnectionTab onChanged={ov.reload} />}
    </div>
  )
}

function StatusCard({ ok, icon, title, text }: { ok: boolean; icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${ok ? 'bg-leaf text-lime-dark' : 'bg-amber-50 text-amber-700'}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-muted">{text}</p>
      </div>
    </div>
  )
}

function PostsTab({ overview, onChanged }: { overview: Overview; onChanged: () => void }) {
  const posts = useLoad(() => api.get<{ items: Post[] }>('/api/marketing/posts?status=upcoming'), [])
  const media = useLoad(() => api.get<{ items: Media[] }>('/api/marketing/media'), [])
  const [count, setCount] = useState('3')
  const [focus, setFocus] = useState('')
  const [editing, setEditing] = useState<Post | 'new' | null>(null)
  const gen = useAction()
  const act = useAction()
  const refresh = () => {
    void posts.reload()
    onChanged()
  }

  const generate = () =>
    gen.run(async () => {
      await api.post('/api/marketing/posts/generate', { count: Number(count), focus })
      setFocus('')
      refresh()
    }, 'AI пост бэлтгэлээ. Хянаад батлаарай.')

  const action = (p: Post, path: string, ok: string, body?: object) =>
    act.run(async () => {
      await api.post(`/api/marketing/posts/${p.id}/${path}`, body ?? {})
      refresh()
    }, ok)

  return (
    <div className="space-y-5">
      <Card>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Sparkles size={19} className="text-blue" /> AI-аар пост бэлтгэх
            </h2>
            <p className="mt-1 text-sm text-muted">
              AI таны брэнд, үйлчилгээ, хуваарийг харгалзан текст бичиж, зураг бүтээнэ. Дараагийн нийтлэх цагууд: {overview.nextSlots.map(fmtSlot).join(', ') || '—'}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[auto_1fr]">
              <Select value={count} onChange={(e) => setCount(e.target.value)} aria-label="Постын тоо">
                {[1, 2, 3, 5, 7].map((n) => (
                  <option key={n} value={n}>
                    {n} пост
                  </option>
                ))}
              </Select>
              <Input value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Онцлох сэдэв (заавал биш): жишээ нь хүүхдийн шүдний эрүүл мэнд, Шинэ жилийн мэндчилгээ" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setEditing('new')}>
              <Plus size={17} /> Гараар нэмэх
            </Button>
            <Button busy={gen.busy} disabled={!overview.aiConfigured} onClick={() => void generate()}>
              <Sparkles size={17} /> {gen.busy ? 'AI бичиж байна…' : 'Пост бэлтгэх'}
            </Button>
          </div>
        </div>
        {gen.busy && <p className="mt-3 rounded-xl bg-sky px-3 py-2 text-sm text-blue">AI текст бичиж, зураг бүтээж байна. Энэ нь ойролцоогоор 30–90 секунд үргэлжилнэ…</p>}
      </Card>

      {posts.error && <ErrorBox message={posts.error} onRetry={posts.reload} />}
      {posts.loading && !posts.data ? (
        <Spinner />
      ) : !posts.data?.items.length ? (
        <Empty icon={<Sparkles size={22} />} title="Хуваарьт пост алга" text="AI-аар пост бэлтгэх эсвэл гараар нэмээрэй." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {posts.data.items.map((p) => (
            <article key={p.id} className="flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-line">
              <button type="button" onClick={() => setEditing(p)} className="relative block aspect-[4/5] bg-soft">
                {p.image_url ? <img src={`${p.image_url}?v=${encodeURIComponent(p.updated_at)}`} alt={p.design.headline} className="h-full w-full object-cover" loading="lazy" /> : null}
                <span className="absolute left-2 top-2">
                  <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
                </span>
                {p.source === 'ai' && (
                  <span className="absolute right-2 top-2">
                    <Badge tone="violet">
                      <Sparkles size={12} /> AI
                    </Badge>
                  </span>
                )}
              </button>
              <div className="flex flex-1 flex-col p-4">
                <p className={`flex items-center gap-1.5 text-xs font-semibold ${p.overdue ? 'text-red-600' : 'text-muted'}`}>
                  <Clock size={13} /> {fmtSlot(p.scheduled_at)} {p.overdue && '· хугацаа өнгөрсөн'}
                </p>
                <p className="mt-1 font-semibold">{p.topic || p.design.headline}</p>
                <p className="mt-1 line-clamp-3 text-sm text-muted">{p.caption}</p>
                <p className="mt-2 text-xs text-muted">{p.platforms.split(',').map((x) => (x === 'facebook' ? 'Facebook' : 'Instagram')).join(' + ')}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                  {p.status === 'draft' && (
                    <Button size="sm" variant="success" busy={act.busy} onClick={() => void action(p, 'approve', 'Батлагдаж, хуваарьт орлоо')}>
                      <Check size={15} /> Батлах
                    </Button>
                  )}
                  {p.status === 'approved' && (
                    <Button size="sm" variant="secondary" busy={act.busy} onClick={() => void action(p, 'unapprove', 'Батлалтыг цуцаллаа')}>
                      <Undo2 size={15} /> Буцаах
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => setEditing(p)}>
                    <Pencil size={15} /> Засах
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    busy={act.busy}
                    disabled={!overview.social.connected}
                    title={overview.social.connected ? 'Одоо нийтлэх' : 'Facebook холбогдоогүй'}
                    onClick={() => {
                      if (confirm('Энэ постыг одоо нийтлэх үү?')) void action(p, 'publish', 'Нийтлэгдлээ')
                    }}
                  >
                    <Rocket size={15} /> Одоо
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    busy={act.busy}
                    onClick={() => {
                      if (confirm('Энэ постоос татгалзах уу?')) void action(p, 'reject', 'Татгалзлаа')
                    }}
                    aria-label="Татгалзах"
                  >
                    <XCircle size={15} />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing && (
        <PostEditor
          post={editing === 'new' ? null : editing}
          media={media.data?.items ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}

function PostEditor({ post, media, onClose, onSaved }: { post: Post | null; media: Media[]; onClose: () => void; onSaved: () => void }) {
  const { busy, run } = useAction()
  const [template, setTemplate] = useState<Post['template']>(post?.template ?? 'photo')
  const [d, setD] = useState<Design>(post?.design ?? { headline: '', subline: '', points: ['', '', ''], badge: '', media_id: media.find((m) => m.kind === 'photo')?.id ?? null })
  const [caption, setCaption] = useState(post?.caption ?? '')
  const [hashtags, setHashtags] = useState(post?.hashtags ?? '#ТөгсШүднийЭмнэлэг #Арвайхээр')
  const [platforms, setPlatforms] = useState<string[]>(post ? post.platforms.split(',') : ['facebook', 'instagram'])
  const [date, setDate] = useState(post?.scheduled_at?.slice(0, 10) ?? '')
  const [time, setTime] = useState(post?.scheduled_at?.slice(11) ?? '19:00')
  const [preview, setPreview] = useState(post?.image_url ? `${post.image_url}?v=${encodeURIComponent(post.updated_at)}` : null)
  const locked = post?.status === 'published'
  const photos = media.filter((m) => m.kind === 'photo')

  const save = (keepOpen = false) =>
    run(async () => {
      const body = {
        caption,
        hashtags,
        template,
        design: { ...d, points: template === 'tip' ? d.points.filter((x) => x.trim()) : [] },
        platforms,
        scheduled_at: date ? `${date} ${time || '19:00'}` : null,
      }
      const r = post
        ? await api.patch<{ item: Post }>(`/api/marketing/posts/${post.id}`, body)
        : await api.post<{ item: Post }>('/api/marketing/posts', body)
      if (keepOpen) setPreview(`${r.item.image_url}?v=${Date.now()}`)
      else onSaved()
      return r
    }, keepOpen ? 'Зураг шинэчлэгдлээ' : 'Хадгалагдлаа')

  const valid = d.headline.trim() && caption.trim().length >= 10 && platforms.length > 0
  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={post ? 'Пост засах' : 'Шинэ пост'}
      footer={
        !locked && (
          <>
            <Button variant="secondary" onClick={onClose}>
              Болих
            </Button>
            {post && (
              <Button variant="secondary" busy={busy} disabled={!valid} onClick={() => void save(true)}>
                <RefreshCw size={15} /> Зургийг шинэчлэх
              </Button>
            )}
            <Button busy={busy} disabled={!valid} onClick={() => void save()}>
              Хадгалах
            </Button>
          </>
        )
      }
    >
      <div className="grid gap-5 md:grid-cols-[260px_1fr]">
        <div>
          <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-soft ring-1 ring-line">
            {preview ? <img src={preview} alt="Урьдчилан харах" className="h-full w-full object-cover" /> : <p className="grid h-full place-items-center p-4 text-center text-sm text-muted">Хадгалахад зураг бүтээгдэнэ</p>}
          </div>
          {post?.error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{post.error}</p>}
          {locked && (
            <p className="mt-2 text-xs text-muted">
              Нийтлэгдсэн: {post?.published_at} {post?.fb_post_id && '· Facebook'} {post?.ig_media_id && '· Instagram'}
            </p>
          )}
        </div>
        <fieldset disabled={locked} className="space-y-4">
          <div>
            <p className="mb-1.5 text-sm font-semibold">Загвар</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(TEMPLATE_LABEL) as Post['template'][]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTemplate(t)}
                  className={`rounded-xl px-3 py-2 text-left text-sm font-semibold ring-1 ${template === t ? 'bg-ink text-white ring-ink' : 'bg-white ring-line hover:ring-blue'}`}
                >
                  {TEMPLATE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>
          <Input label="Зураг дээрх гарчиг" hint={`${d.headline.length}/45`} value={d.headline} onChange={(e) => setD({ ...d, headline: e.target.value })} />
          <Input label="Дэд текст" hint="заавал биш" value={d.subline} onChange={(e) => setD({ ...d, subline: e.target.value })} />
          <Input label="Шошго" hint="жш: Зөвлөгөө, Онцлох" value={d.badge} onChange={(e) => setD({ ...d, badge: e.target.value })} />
          {template === 'tip' && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Зөвлөгөөний жагсаалт</p>
              {[0, 1, 2, 3].map((i) => (
                <Input
                  key={i}
                  placeholder={`${i + 1}.`}
                  value={d.points[i] ?? ''}
                  onChange={(e) => {
                    const pts = [...d.points]
                    pts[i] = e.target.value
                    setD({ ...d, points: pts })
                  }}
                />
              ))}
            </div>
          )}
          {(template === 'photo' || template === 'promo') && (
            <div>
              <p className="mb-1.5 text-sm font-semibold">Зураг</p>
              {photos.length === 0 ? (
                <p className="text-sm text-muted">Зургийн санд зураг нэмнэ үү.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((m) => (
                    <button key={m.id} type="button" onClick={() => setD({ ...d, media_id: m.id })} className={`aspect-square overflow-hidden rounded-xl ring-2 ${d.media_id === m.id ? 'ring-blue' : 'ring-transparent'}`} title={m.description}>
                      <img src={m.url} alt={m.description} className="h-full w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <Textarea label="Постын текст" hint={`${caption.length} тэмдэгт`} value={caption} onChange={(e) => setCaption(e.target.value)} className="[&_textarea]:min-h-40" />
          <p className="-mt-2 text-xs text-muted">Цаг захиалах холбоос, утас, хаяг автоматаар нэмэгдэнэ.</p>
          <Input label="Hashtag" value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
          <div className="flex flex-wrap gap-4">
            {(['facebook', 'instagram'] as const).map((pl) => (
              <label key={pl} className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-blue-600"
                  checked={platforms.includes(pl)}
                  onChange={(e) => setPlatforms(e.target.checked ? [...platforms, pl] : platforms.filter((x) => x !== pl))}
                />
                {pl === 'facebook' ? 'Facebook' : 'Instagram'}
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" label="Нийтлэх өдөр" hint="хоосон бол дараагийн сул цаг" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input type="time" label="Цаг" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </fieldset>
      </div>
    </Modal>
  )
}

function HistoryTab({ onChanged }: { onChanged: () => void }) {
  const posts = useLoad(() => api.get<{ items: Post[] }>('/api/marketing/posts?status=history'), [])
  const { busy, run } = useAction()
  if (posts.error) return <ErrorBox message={posts.error} onRetry={posts.reload} />
  if (posts.loading && !posts.data) return <Spinner />
  if (!posts.data?.items.length) return <Empty title="Түүх хоосон" text="Нийтлэгдсэн, татгалзсан постууд энд харагдана." />
  return (
    <ul className="space-y-3">
      {posts.data.items.map((p) => (
        <li key={p.id} className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-line">
          {p.image_url && <img src={p.image_url} alt="" className="h-24 w-20 shrink-0 rounded-xl object-cover" loading="lazy" />}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Badge>
              <span className="text-xs text-muted">{p.published_at ?? p.updated_at}</span>
              {p.fb_post_id && <Badge tone="blue">Facebook ✓</Badge>}
              {p.ig_media_id && <Badge tone="violet">Instagram ✓</Badge>}
            </div>
            <p className="mt-1 truncate font-semibold">{p.topic || p.design.headline}</p>
            {p.error && <p className="mt-1 text-xs text-red-600">{p.error}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              {p.status === 'failed' && (
                <Button
                  size="sm"
                  variant="secondary"
                  busy={busy}
                  onClick={() =>
                    void run(async () => {
                      await api.post(`/api/marketing/posts/${p.id}/publish`)
                      void posts.reload()
                      onChanged()
                    }, 'Нийтлэгдлээ')
                  }
                >
                  <RefreshCw size={15} /> Дахин оролдох
                </Button>
              )}
              {p.status !== 'published' && (
                <Button
                  size="sm"
                  variant="ghost"
                  busy={busy}
                  onClick={() =>
                    void run(async () => {
                      await api.del(`/api/marketing/posts/${p.id}`)
                      void posts.reload()
                      onChanged()
                    }, 'Устгагдлаа')
                  }
                >
                  <Trash2 size={15} /> Устгах
                </Button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

function BrandTab({ socialConnected, aiConfigured }: { socialConnected: boolean; aiConfigured: boolean }) {
  const brand = useLoad(() => api.get<Brand>('/api/marketing/brand'), [])
  const [b, setB] = useState<Brand | null>(null)
  const { busy, run } = useAction()
  useEffect(() => {
    if (brand.data) setB(brand.data)
  }, [brand.data])
  if (brand.error) return <ErrorBox message={brand.error} onRetry={brand.reload} />
  if (!b) return <Spinner />
  const save = () => run(async () => setB(await api.put<Brand>('/api/marketing/brand', b)), 'Хадгалагдлаа')
  const learn = (fromFacebook: boolean) =>
    run(async () => setB(await api.post<Brand>('/api/marketing/brand/learn', { samples: fromFacebook ? undefined : b.samples, fromFacebook })), 'AI таны хэв маягийг сурлаа')
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="Эмнэлгийн тухай (AI-д)">
        <div className="space-y-4">
          <Textarea label="Эмнэлгийн танилцуулга" value={b.about} onChange={(e) => setB({ ...b, about: e.target.value })} className="[&_textarea]:min-h-32" />
          <Textarea label="Зорилтот үйлчлүүлэгчид" value={b.audience} onChange={(e) => setB({ ...b, audience: e.target.value })} />
          <Input label="Өнгө аяс" value={b.tone} onChange={(e) => setB({ ...b, tone: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Эможи" value={b.emoji} onChange={(e) => setB({ ...b, emoji: e.target.value as Brand['emoji'] })}>
              <option value="none">Хэрэглэхгүй</option>
              <option value="light">Цөөн (1–2)</option>
              <option value="moderate">Дунд зэрэг</option>
            </Select>
            <Input label="Үндсэн hashtag" value={b.hashtags} onChange={(e) => setB({ ...b, hashtags: e.target.value })} />
          </div>
          <Textarea label="Одоогийн урамшуулал" hint="хоосон бол AI урамшуулал зохиохгүй" value={b.promos} onChange={(e) => setB({ ...b, promos: e.target.value })} placeholder="Жишээ: 12-р сарын 31 хүртэл Япон цайруулалт 20% хямдралтай" />
          <Textarea label="Заавал мөрдөх дүрэм" value={b.rules} onChange={(e) => setB({ ...b, rules: e.target.value })} />
          <Button busy={busy} onClick={() => void save()}>
            Хадгалах
          </Button>
        </div>
      </Card>
      <Card title="Хэв маяг сургах">
        <div className="space-y-4">
          <p className="text-sm text-muted">Өмнө нь Facebook-т тавьж байсан 3–10 постынхоо текстийг доор хуулж оруулбал AI таны бичих хэв маягийг сурч, түүгээр бичнэ.</p>
          <Textarea label="Өмнөх постууд" value={b.samples} onChange={(e) => setB({ ...b, samples: e.target.value })} className="[&_textarea]:min-h-40" placeholder="Пост бүрийн хооронд хоосон мөр үлдээнэ үү" />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" busy={busy} disabled={!aiConfigured || b.samples.trim().length < 80} onClick={() => void learn(false)}>
              <Sparkles size={16} /> Текстээс сургах
            </Button>
            <Button variant="secondary" busy={busy} disabled={!aiConfigured || !socialConnected} onClick={() => void learn(true)} title={socialConnected ? '' : 'Facebook холбогдоогүй'}>
              <Sparkles size={16} /> Facebook хуудаснаас сургах
            </Button>
          </div>
          <Textarea label="Сурсан хэв маяг" hint="засаж болно" value={b.styleGuide} onChange={(e) => setB({ ...b, styleGuide: e.target.value })} className="[&_textarea]:min-h-40" placeholder="AI сурсны дараа энд гарна" />
          <Button busy={busy} onClick={() => void save()}>
            Хадгалах
          </Button>
        </div>
      </Card>
    </div>
  )
}

function MediaTab() {
  const media = useLoad(() => api.get<{ items: Media[] }>('/api/marketing/media'), [])
  const { busy, run } = useAction()
  const [kind, setKind] = useState<'photo' | 'logo'>('photo')
  const upload = (file: File) =>
    run(async () => {
      const f = new FormData()
      f.set('file', file)
      f.set('kind', kind)
      await api.post('/api/marketing/media', f)
      void media.reload()
    }, 'Зураг нэмэгдлээ')
  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <Select label="Төрөл" value={kind} onChange={(e) => setKind(e.target.value as 'photo' | 'logo')}>
            <option value="photo">Эмнэлгийн зураг</option>
            <option value="logo">Лого</option>
          </Select>
          <label className={`inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl brand-grad px-4 font-semibold text-white ${busy ? 'opacity-50' : ''}`}>
            <Upload size={17} /> {busy ? 'Хуулж байна…' : 'Зураг нэмэх'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void upload(file)
                e.target.value = ''
              }}
            />
          </label>
          <p className="text-sm text-muted">Эмнэлэг, эмч нар, тоног төхөөрөмж, үйлчлүүлэгчийн (зөвшөөрөлтэй) зургууд. AI зураг бүрийг тайлбарлаж, тохирох постонд ашиглана.</p>
        </div>
      </Card>
      {media.loading && !media.data ? (
        <Spinner />
      ) : !media.data?.items.length ? (
        <Empty icon={<ImagePlus size={22} />} title="Зураг алга" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {media.data.items.map((m) => (
            <MediaCard key={m.id} m={m} onChanged={media.reload} />
          ))}
        </div>
      )}
    </div>
  )
}

function MediaCard({ m, onChanged }: { m: Media; onChanged: () => void }) {
  const { busy, run } = useAction()
  const [desc, setDesc] = useState(m.description)
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
      <div className={`aspect-square ${m.kind === 'logo' ? 'grid place-items-center bg-white p-6' : 'bg-soft'}`}>
        <img src={m.url} alt={m.description} className={m.kind === 'logo' ? 'max-h-full max-w-full object-contain' : 'h-full w-full object-cover'} loading="lazy" />
      </div>
      <div className="space-y-2 p-2.5">
        <div className="flex items-center justify-between gap-2">
          <Badge tone={m.kind === 'logo' ? 'violet' : 'gray'}>{m.kind === 'logo' ? 'Лого' : 'Зураг'}</Badge>
          <button
            type="button"
            aria-label="Устгах"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
            onClick={() => {
              if (confirm('Зургийг устгах уу?')) void run(async () => (await api.del(`/api/marketing/media/${m.id}`), onChanged()), 'Устгагдлаа')
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
        <textarea
          className="block w-full rounded-lg border-0 bg-soft px-2 py-1.5 text-xs ring-1 ring-line focus:ring-2 focus:ring-cyan focus:outline-none"
          rows={2}
          placeholder="Зургийн тайлбар"
          value={desc}
          disabled={busy}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={() => desc !== m.description && void run(() => api.patch(`/api/marketing/media/${m.id}`, { description: desc }), 'Тайлбар хадгалагдлаа')}
        />
      </div>
    </div>
  )
}

function AutopilotTab({ onChanged, canEdit }: { onChanged: () => void; canEdit: boolean }) {
  const data = useLoad(() => api.get<Autopilot>('/api/marketing/autopilot'), [])
  const [a, setA] = useState<Autopilot | null>(null)
  const { busy, run } = useAction()
  useEffect(() => {
    if (data.data) setA(data.data)
  }, [data.data])
  if (!a) return <Spinner />
  const save = () =>
    run(async () => {
      const { nextSlots: _n, ...body } = a
      setA(await api.put<Autopilot>('/api/marketing/autopilot', body))
      onChanged()
    }, 'Хуваарь хадгалагдлаа')
  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <Card title="Автомат нийтлэх хуваарь">
        <fieldset disabled={!canEdit} className="space-y-4">
          <Toggle checked={a.enabled} onChange={(v) => setA({ ...a, enabled: v })} label="Автомат горим (autopilot)" hint="AI дараагийн постуудыг өөрөө бэлтгэж байна" />
          <div>
            <p className="mb-1.5 text-sm font-semibold">Давтамж</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {(
                [
                  ['daily', 'Өдөр бүр'],
                  ['every2', '2 хоног тутам'],
                  ['weekdays', 'Сонгосон гарагт'],
                ] as const
              ).map(([v, l]) => (
                <button key={v} type="button" onClick={() => setA({ ...a, frequency: v })} className={`h-11 rounded-xl text-sm font-semibold ring-1 ${a.frequency === v ? 'bg-ink text-white ring-ink' : 'bg-white ring-line'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {a.frequency === 'weekdays' && (
            <div className="flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setA({ ...a, weekdays: a.weekdays.includes(d) ? a.weekdays.filter((x) => x !== d) : [...a.weekdays, d] })}
                  className={`h-10 rounded-xl px-3 text-sm font-semibold ring-1 ${a.weekdays.includes(d) ? 'bg-blue text-white ring-blue' : 'bg-white ring-line'}`}
                >
                  {WEEKDAYS[d]}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input type="time" label="Нийтлэх цаг" value={a.time} onChange={(e) => setA({ ...a, time: e.target.value })} />
            <Input type="number" min={1} max={14} label="Урьдчилан бэлтгэх пост" value={a.keepAhead} onChange={(e) => setA({ ...a, keepAhead: Number(e.target.value) || 1 })} />
          </div>
          <div className="flex flex-wrap gap-4">
            {(['facebook', 'instagram'] as const).map((pl) => (
              <label key={pl} className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={a.platforms.includes(pl)}
                  onChange={(e) => setA({ ...a, platforms: e.target.checked ? [...a.platforms, pl] : a.platforms.filter((x) => x !== pl) })}
                />
                {pl === 'facebook' ? 'Facebook' : 'Instagram'}
              </label>
            ))}
          </div>
          <Toggle checked={a.requireApproval} onChange={(v) => setA({ ...a, requireApproval: v })} label="Нийтлэхээс өмнө батлах шаардлагатай" hint="Санал болгож байна: AI-ийн бичсэнийг хүн хянаж байж нийтэлнэ" />
          {canEdit && (
            <Button busy={busy} disabled={a.platforms.length === 0} onClick={() => void save()}>
              Хадгалах
            </Button>
          )}
          {!canEdit && <p className="text-xs text-muted">Хуваарийг зөвхөн админ өөрчилнө.</p>}
        </fieldset>
      </Card>
      <Card title="Дараагийн нийтлэх цагууд">
        <ul className="space-y-2">
          {(a.nextSlots ?? []).map((s) => (
            <li key={s} className="flex items-center gap-2 rounded-xl bg-soft px-3 py-2 text-sm font-semibold">
              <Clock size={15} className="text-blue" /> {fmtSlot(s)}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">Хуваарьт цаг болоход зөвхөн батлагдсан пост нийтлэгдэнэ. Батлагдаагүй пост хүлээгдэж үлдэнэ.</p>
      </Card>
    </div>
  )
}

function ConnectionTab({ onChanged }: { onChanged: () => void }) {
  const data = useLoad(() => api.get<{ pageId: string; pageToken: string; hasToken: boolean; igUserId: string; graphVersion: string; pageName: string; igUsername: string }>('/api/marketing/social'), [])
  const [f, setF] = useState({ pageId: '', pageToken: '', igUserId: '', graphVersion: 'v26.0' })
  const { busy, run } = useAction()
  useEffect(() => {
    if (data.data) setF({ pageId: data.data.pageId, pageToken: '', igUserId: data.data.igUserId, graphVersion: data.data.graphVersion })
  }, [data.data])
  if (!data.data) return <Spinner />
  const s = data.data
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="Facebook хуудас, Instagram">
        <div className="space-y-4">
          {s.pageName && (
            <p className="rounded-xl bg-leaf px-3 py-2 text-sm font-semibold text-lime-dark">
              Холбогдсон: {s.pageName}
              {s.igUsername && ` · Instagram @${s.igUsername}`}
            </p>
          )}
          <Input label="Facebook хуудасны ID" value={f.pageId} onChange={(e) => setF({ ...f, pageId: e.target.value.trim() })} placeholder="61574180873843" />
          <Input
            label="Page access token"
            type="password"
            hint={s.hasToken ? `хадгалсан: ${s.pageToken}` : ''}
            value={f.pageToken}
            onChange={(e) => setF({ ...f, pageToken: e.target.value.trim() })}
            placeholder={s.hasToken ? 'Солих бол шинэ токен оруулна' : 'EAAG…'}
            autoComplete="off"
          />
          <Input label="Instagram business ID" hint="хоосон бол автоматаар олно" value={f.igUserId} onChange={(e) => setF({ ...f, igUserId: e.target.value.trim() })} />
          <Input label="Graph API хувилбар" value={f.graphVersion} onChange={(e) => setF({ ...f, graphVersion: e.target.value.trim() })} />
          <div className="flex flex-wrap gap-2">
            <Button
              busy={busy}
              onClick={() =>
                void run(async () => {
                  await api.put('/api/marketing/social', { ...f, pageToken: f.pageToken || undefined })
                  await data.reload()
                  onChanged()
                }, 'Холболт амжилттай')
              }
            >
              Хадгалж шалгах
            </Button>
            {s.hasToken && (
              <Button variant="secondary" busy={busy} onClick={() => void run(() => api.post('/api/marketing/social/test'), 'Холболт хэвийн')}>
                Дахин шалгах
              </Button>
            )}
          </div>
        </div>
      </Card>
      <Card title="Токен хэрхэн авах вэ?">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-ink/90">
          <li>
            <b>developers.facebook.com</b> → My Apps → <b>Create App</b> (төрөл: Business). Эмнэлгийн Facebook хуудасны админ эрхтэй дансаар нэвтэрнэ.
          </li>
          <li>Instagram дансаа <b>Business/Creator</b> болгож, Facebook хуудастайгаа холбоно (Instagram → Settings → Account type).</li>
          <li>
            <b>Graph API Explorer</b> дээр апп-аа сонгоод дараах эрхүүдтэй User token үүсгэнэ: <code>pages_show_list</code>, <code>pages_read_engagement</code>, <code>pages_manage_posts</code>, <code>instagram_basic</code>, <code>instagram_content_publish</code>, <code>business_management</code>.
          </li>
          <li>Access Token Debugger дээр токеноо <b>Extend</b> хийж урт хугацааны болгоно.</li>
          <li>
            Explorer дээр <code>me/accounts</code> хүсэлт илгээж, эмнэлгийн хуудасны <b>id</b> болон <b>access_token</b>-ийг хуулж энд оруулна. (Урт хугацааны хэрэглэгчийн токеноос авсан хуудасны токен хугацаа дуусахгүй.)
          </li>
          <li>Instagram-д нийтлэхийн тулд сайт HTTPS домэйн дээр байх ёстой.</li>
        </ol>
        <p className="mt-3 text-xs text-muted">Токен шифрлэгдэж хадгалагдана, хэнд ч харагдахгүй.</p>
      </Card>
    </div>
  )
}
