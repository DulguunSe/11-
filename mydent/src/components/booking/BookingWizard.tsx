import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock, Home, MessageSquareText, Phone, RotateCcw, Stethoscope, User, Users } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { dentists, extraServices, homeServices, serviceIcons } from '../../config/content'
import { clinic } from '../../config/clinic'
import type { ServiceSlug } from '../../i18n/translations'
import { formatDate, getBookableDays, getSlots } from '../../lib/dates'
import { submitBooking, type Stored, type BookingRequest } from '../../lib/submissions'
import { isValidName, isValidPhone, normalizePhone } from '../../lib/validation'
import { Stepper } from './Stepper'
import { OptionCard } from './OptionCard'
import { Button, ButtonA, ButtonLink } from '../ui/Button'
import { TextAreaField, TextField } from '../ui/Field'
import { MessengerIcon } from '../icons/DentalIcons'

const CONSULT = 'consultation'
const ANY = 'any'
const allServices: ServiceSlug[] = [...homeServices, ...extraServices]

type State = { service: string; dentist: string; date: string; time: string; name: string; phone: string; note: string }

export function BookingWizard() {
  const { t, lang } = useLang()
  const b = t.booking
  const [params] = useSearchParams()

  const initial = useMemo<State>(() => {
    const s = params.get('service') ?? ''
    const d = params.get('dentist') ?? ''
    return {
      service: allServices.includes(s as ServiceSlug) || s === CONSULT ? s : '',
      dentist: dentists.some((x) => x.id === d) ? d : '',
      date: '',
      time: '',
      name: '',
      phone: '',
      note: '',
    }
  }, [])

  const [state, setState] = useState<State>(initial)
  const [step, setStep] = useState(() => (initial.service ? (initial.dentist ? 2 : 1) : 0))
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const [done, setDone] = useState<Stored<BookingRequest> | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const firstRender = useRef(true)

  const days = useMemo(() => getBookableDays(), [])
  const slots = useMemo(() => (state.date ? getSlots(state.date) : []), [state.date])

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus({ preventScroll: true })
    const top = topRef.current?.getBoundingClientRect().top ?? 0
    if (top < 0) topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [step, done])

  const update = (patch: Partial<State>) => {
    setState((s) => ({ ...s, ...patch }))
    // Засаж эхэлмэгц тухайн талбарын алдааг арилгана
    if ('name' in patch || 'phone' in patch) setErrors((e) => ({ ...e, ...('name' in patch ? { name: undefined } : {}), ...('phone' in patch ? { phone: undefined } : {}) }))
  }

  const serviceTitle = (slug: string) =>
    slug === CONSULT ? b.consultTitle : slug ? t.services.items[slug as ServiceSlug]?.title ?? '' : ''
  const dentistName = (id: string) => {
    if (id === ANY) return b.anyDentist
    const i = dentists.findIndex((d) => d.id === id)
    return i >= 0 ? `${t.dentists.items[i].name} (${t.dentists.items[i].role})` : ''
  }

  const canContinue = [!!state.service, !!state.dentist, !!state.date && !!state.time, true][step]

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!state.name.trim()) errs.name = t.validation.required
    else if (!isValidName(state.name)) errs.name = t.validation.name
    if (!state.phone.trim()) errs.phone = t.validation.required
    else if (!isValidPhone(state.phone)) errs.phone = t.validation.phone
    setErrors(errs)
    if (Object.keys(errs).length) {
      document.getElementById(errs.name ? 'book-name' : 'book-phone')?.focus()
      return
    }
    setSubmitting(true)
    setSubmitError(false)
    try {
      const saved = await submitBooking({
        serviceSlug: state.service,
        serviceTitle: serviceTitle(state.service),
        dentistId: state.dentist === ANY ? null : state.dentist,
        dentistName: dentistName(state.dentist),
        date: state.date,
        time: state.time,
        name: state.name.trim(),
        phone: normalizePhone(state.phone),
        note: state.note.trim(),
        lang,
      })
      setDone(saved)
    } catch {
      setSubmitError(true)
    } finally {
      setSubmitting(false)
    }
  }

  const reset = () => {
    setState({ service: '', dentist: '', date: '', time: '', name: '', phone: '', note: '' })
    setErrors({})
    setDone(null)
    setStep(0)
  }

  /* ---------------------------- Амжилттай ---------------------------- */
  if (done) {
    return (
      <div ref={topRef} className="mx-auto max-w-xl scroll-mt-28">
        <div className="rounded-[2rem] bg-white p-6 text-center shadow-[0_30px_60px_-40px_rgba(27,80,32,0.5)] ring-1 ring-ink/[0.06] sm:p-10" role="status">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand-50 text-brand-600 ring-8 ring-brand-50/50">
            <CheckCircle2 size={44} />
          </span>
          <h2 ref={headingRef} tabIndex={-1} className="mt-6 font-display text-2xl font-extrabold text-ink outline-none sm:text-3xl">
            {b.successTitle}
          </h2>
          <p className="mt-3 text-muted">{b.successText}</p>

          <div className="mt-6 inline-flex flex-col rounded-2xl bg-brand-50 px-6 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">{b.reference}</span>
            <span className="font-display text-2xl font-extrabold tracking-wider text-ink">{done.reference}</span>
          </div>

          <dl className="mt-6 divide-y divide-ink/5 rounded-2xl text-left ring-1 ring-ink/[0.06]">
            {[
              [b.service, done.serviceTitle],
              [b.dentist, done.dentistName],
              [b.date, formatDate(done.date, lang, t)],
              [b.time, done.time],
              [b.name, done.name],
              [b.phone, done.phone],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <ButtonA href={clinic.phones[0].href} variant="secondary">
              <Phone size={17} />
              {clinic.phones[0].display}
            </ButtonA>
            <ButtonA href={clinic.messenger} target="_blank" rel="noreferrer" variant="secondary">
              <MessengerIcon size={18} />
              {t.common.messenger}
            </ButtonA>
          </div>
          <div className="mt-6 flex flex-col justify-center gap-3 border-t border-ink/5 pt-6 sm:flex-row">
            <Button variant="ghost" onClick={reset}>
              <RotateCcw size={17} />
              {b.newBooking}
            </Button>
            <ButtonLink to="/">
              <Home size={17} />
              {b.backHome}
            </ButtonLink>
          </div>
        </div>
      </div>
    )
  }

  /* ---------------------------- Алхмууд ---------------------------- */
  const summary = [
    { icon: <Stethoscope size={17} />, label: b.service, value: serviceTitle(state.service) },
    { icon: <User size={17} />, label: b.dentist, value: state.dentist ? dentistName(state.dentist) : '' },
    { icon: <CalendarDays size={17} />, label: b.date, value: state.date ? formatDate(state.date, lang, t) : '' },
    { icon: <Clock size={17} />, label: b.time, value: state.time },
  ]

  const morning = slots.filter((s) => Number(s.slice(0, 2)) < 12)
  const afternoon = slots.filter((s) => Number(s.slice(0, 2)) >= 12)

  return (
    <div ref={topRef} className="grid scroll-mt-28 gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
      <div className="min-w-0 rounded-[2rem] bg-white p-5 shadow-[0_30px_60px_-40px_rgba(27,80,32,0.5)] ring-1 ring-ink/[0.06] sm:p-8">
        <Stepper steps={b.steps} current={step} onGo={setStep} stepOf={b.stepOf} />

        <div className="mt-8 border-t border-ink/5 pt-7">
          {step === 0 && (
            <fieldset>
              <legend>
                <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl font-bold text-ink outline-none sm:text-2xl">
                  {b.serviceTitle}
                </h2>
              </legend>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {allServices.map((slug) => {
                  const Icon = serviceIcons[slug]
                  return (
                    <OptionCard
                      key={slug}
                      name="service"
                      selected={state.service === slug}
                      onSelect={() => update({ service: slug })}
                      icon={<Icon size={22} />}
                      title={t.services.items[slug].title}
                      text={t.services.items[slug].short}
                    />
                  )
                })}
                <OptionCard
                  name="service"
                  selected={state.service === CONSULT}
                  onSelect={() => update({ service: CONSULT })}
                  icon={<MessageSquareText size={22} />}
                  title={b.consultTitle}
                  text={b.consultText}
                />
              </div>
            </fieldset>
          )}

          {step === 1 && (
            <fieldset>
              <legend>
                <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl font-bold text-ink outline-none sm:text-2xl">
                  {b.dentistTitle}
                </h2>
              </legend>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <OptionCard
                  name="dentist"
                  selected={state.dentist === ANY}
                  onSelect={() => update({ dentist: ANY })}
                  icon={<Users size={22} />}
                  title={b.anyDentist}
                  text={b.anyDentistText}
                />
                {dentists.map((d, i) => (
                  <OptionCard
                    key={d.id}
                    name="dentist"
                    selected={state.dentist === d.id}
                    onSelect={() => update({ dentist: d.id })}
                    icon={<img src={d.image} alt="" className="h-full w-full object-cover" />}
                    title={t.dentists.items[i].name}
                    text={t.dentists.items[i].role}
                  />
                ))}
              </div>
            </fieldset>
          )}

          {step === 2 && (
            <div>
              <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl font-bold text-ink outline-none sm:text-2xl">
                {b.dateTitle}
              </h2>
              <div className="-mx-5 mt-5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 [scrollbar-width:thin]">
                <div role="radiogroup" aria-label={b.date} className="flex gap-2.5">
                  {days.map((d, i) => {
                    const selected = state.date === d.iso
                    return (
                      <button
                        key={d.iso}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={!d.open}
                        onClick={() => update({ date: d.iso, time: '' })}
                        aria-label={`${formatDate(d.iso, lang, t)}${d.open ? '' : ` — ${b.closed}`}`}
                        className={`flex w-[68px] shrink-0 flex-col items-center rounded-2xl py-3 transition ${
                          selected
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-700/25'
                            : d.open
                              ? 'bg-white text-ink ring-1 ring-ink/10 hover:ring-brand-400'
                              : 'cursor-not-allowed bg-ink/[0.03] text-ink/30'
                        }`}
                      >
                        <span className={`text-[11px] font-semibold uppercase ${selected ? 'text-brand-100' : 'text-muted'}`}>
                          {i === 0 ? b.today : b.weekdaysShort[d.date.getDay()]}
                        </span>
                        <span className="mt-0.5 font-display text-xl font-bold">{d.date.getDate()}</span>
                        <span className={`text-[11px] ${selected ? 'text-brand-100' : 'text-muted'}`}>
                          {lang === 'mn' ? `${d.date.getMonth() + 1}-р сар` : formatDate(d.iso, lang, t, false).split(' ')[0]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-7">
                <h3 className="text-sm font-semibold text-ink">{b.timeTitle}</h3>
                {!state.date ? (
                  <p className="mt-3 rounded-2xl bg-brand-50/60 px-4 py-6 text-center text-sm text-muted">{b.pickDateFirst}</p>
                ) : slots.length === 0 ? (
                  <p className="mt-3 rounded-2xl bg-brand-50/60 px-4 py-6 text-center text-sm text-muted">{b.noSlots}</p>
                ) : (
                  <div className="mt-3 space-y-5">
                    {[
                      [b.morning, morning],
                      [b.afternoon, afternoon],
                    ].map(([label, list]) =>
                      (list as string[]).length ? (
                        <div key={label as string}>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{label as string}</p>
                          <div role="radiogroup" aria-label={label as string} className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                            {(list as string[]).map((slot) => {
                              const selected = state.time === slot
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  role="radio"
                                  aria-checked={selected}
                                  onClick={() => update({ time: slot })}
                                  className={`h-11 rounded-xl text-sm font-semibold tabular-nums transition ${
                                    selected ? 'bg-brand-600 text-white shadow-md shadow-brand-700/25' : 'bg-white text-ink ring-1 ring-ink/10 hover:ring-brand-400'
                                  }`}
                                >
                                  {slot}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ) : null,
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <form id="booking-details" onSubmit={onSubmit} noValidate>
              <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl font-bold text-ink outline-none sm:text-2xl">
                {b.detailsTitle}
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <TextField
                  id="book-name"
                  label={b.name}
                  value={state.name}
                  onChange={(e) => update({ name: e.target.value })}
                  error={errors.name}
                  autoComplete="name"
                />
                <TextField
                  id="book-phone"
                  label={b.phone}
                  value={state.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  error={errors.phone}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="9911 2233"
                />
              </div>
              <div className="mt-4">
                <TextAreaField
                  id="book-note"
                  label={b.note}
                  hint={t.common.optional}
                  value={state.note}
                  onChange={(e) => update({ note: e.target.value })}
                  placeholder={b.notePlaceholder}
                  rows={3}
                />
              </div>
              {submitError && (
                <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                  {t.validation.submitError}
                </p>
              )}
            </form>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3 border-t border-ink/5 pt-6">
          {step > 0 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft size={18} />
              {t.common.back}
            </Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canContinue}>
              {t.common.next}
              <ArrowRight size={18} />
            </Button>
          ) : (
            <Button type="submit" form="booking-details" disabled={submitting}>
              {submitting ? b.submitting : b.submit}
              {!submitting && <CheckCircle2 size={18} />}
            </Button>
          )}
        </div>
      </div>

      <aside className="rounded-[2rem] bg-brand-900 p-6 text-white lg:sticky lg:top-28 sm:p-7" aria-label={b.summaryTitle}>
        <h2 className="font-display text-lg font-bold">{b.summaryTitle}</h2>
        <dl className="mt-5 space-y-4">
          {summary.map((row) => (
            <div key={row.label} className="flex gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-300">{row.icon}</span>
              <div className="min-w-0">
                <dt className="text-xs text-brand-200/80">{row.label}</dt>
                <dd className={`text-sm font-semibold ${row.value ? 'text-white' : 'text-brand-200/50'}`}>{row.value || b.notSelected}</dd>
              </div>
            </div>
          ))}
        </dl>
        <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-relaxed text-brand-100/80">{b.summaryNote}</p>
        <a href={clinic.phones[0].href} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-200 hover:text-white">
          <Phone size={15} />
          {clinic.phones[0].display}
        </a>
      </aside>
    </div>
  )
}
