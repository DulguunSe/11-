import { useState, type FormEvent } from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import { useLang } from '../../i18n/LanguageContext'
import { submitContactMessage } from '../../lib/submissions'
import { isValidEmail, isValidName, isValidPhone, normalizePhone } from '../../lib/validation'
import { TextAreaField, TextField } from '../ui/Field'
import { Button } from '../ui/Button'

type Values = { name: string; phone: string; email: string; message: string }
const empty: Values = { name: '', phone: '', email: '', message: '' }

export function ContactForm() {
  const { t, lang } = useLang()
  const f = t.contact.form
  const v = t.validation
  const [values, setValues] = useState<Values>(empty)
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const validate = (vals: Values) => {
    const e: Partial<Record<keyof Values, string>> = {}
    if (!vals.name.trim()) e.name = v.required
    else if (!isValidName(vals.name)) e.name = v.name
    if (!vals.phone.trim()) e.phone = v.required
    else if (!isValidPhone(vals.phone)) e.phone = v.phone
    if (vals.email.trim() && !isValidEmail(vals.email)) e.email = v.email
    if (!vals.message.trim()) e.message = v.required
    else if (vals.message.trim().length < 10) e.message = v.messageShort
    return e
  }

  const set = (key: keyof Values) => (ev: { target: { value: string } }) => {
    const next = { ...values, [key]: ev.target.value }
    setValues(next)
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: validate(next)[key] }))
  }

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault()
    const e = validate(values)
    setErrors(e)
    if (Object.keys(e).length) {
      document.getElementById(`contact-${Object.keys(e)[0]}`)?.focus()
      return
    }
    setStatus('sending')
    try {
      await submitContactMessage({
        name: values.name.trim(),
        phone: normalizePhone(values.phone),
        email: values.email.trim(),
        message: values.message.trim(),
        lang,
      })
      setStatus('sent')
      setValues(empty)
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="flex flex-col items-center py-10 text-center" role="status">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600">
          <CheckCircle2 size={34} />
        </span>
        <h3 className="mt-5 font-display text-2xl font-bold text-ink">{f.successTitle}</h3>
        <p className="mt-2 max-w-sm text-muted">{f.successText}</p>
        <Button variant="secondary" className="mt-6" onClick={() => setStatus('idle')}>
          {f.sendAnother}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="contact-name" label={f.name} value={values.name} onChange={set('name')} error={errors.name} autoComplete="name" />
        <TextField
          id="contact-phone"
          label={f.phone}
          value={values.phone}
          onChange={set('phone')}
          error={errors.phone}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="9911 2233"
        />
      </div>
      <TextField
        id="contact-email"
        label={f.email}
        hint={t.common.optional}
        value={values.email}
        onChange={set('email')}
        error={errors.email}
        type="email"
        autoComplete="email"
      />
      <TextAreaField
        id="contact-message"
        label={f.message}
        value={values.message}
        onChange={set('message')}
        error={errors.message}
        placeholder={f.messagePlaceholder}
        rows={5}
      />
      {status === 'error' && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {v.submitError}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={status === 'sending'}>
        <Send size={18} />
        {status === 'sending' ? f.sending : f.submit}
      </Button>
    </form>
  )
}
