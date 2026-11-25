import { useEffect, useState } from 'react'
import { api } from '../../shared/api.ts'
import { useAction } from '../lib.tsx'
import { Button, Input, Modal, Select, Textarea, Toggle } from '../ui.tsx'

export type PatientFields = {
  last_name: string
  first_name: string
  phone: string
  phone2: string
  register_no: string
  birth_date: string | null
  gender: 'm' | 'f' | null
  address: string
  allergies: string
  medical_notes: string
  notes: string
  source: string
  sms_opt_out: boolean
}

const empty: PatientFields = {
  last_name: '',
  first_name: '',
  phone: '',
  phone2: '',
  register_no: '',
  birth_date: null,
  gender: null,
  address: '',
  allergies: '',
  medical_notes: '',
  notes: '',
  source: 'walk_in',
  sms_opt_out: false,
}

/** Регистрийн дугаараас төрсөн огноо, хүйс гаргах (жш: УБ99031512) */
function fromRegister(reg: string): { birth_date: string; gender: 'm' | 'f' } | null {
  const m = reg.toUpperCase().match(/^[А-ЯӨҮЁ]{2}(\d{2})(\d{2})(\d{2})(\d{2})$/)
  if (!m) return null
  const yy = Number(m[1])
  let mm = Number(m[2])
  const dd = Number(m[3])
  let year = 1900 + yy
  if (mm > 20) {
    mm -= 20
    year = 2000 + yy
  }
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null
  // Сүүлээсээ 2 дахь орон: сондгой = эрэгтэй, тэгш = эмэгтэй
  return { birth_date: `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`, gender: Number(m[4].charAt(0)) % 2 ? 'm' : 'f' }
}

export function PatientForm({
  open,
  onClose,
  onSaved,
  patient,
}: {
  open: boolean
  onClose: () => void
  onSaved: (id: number) => void
  patient?: (PatientFields & { id: number }) | null
}) {
  const { busy, run } = useAction()
  const [f, setF] = useState<PatientFields>(empty)
  useEffect(() => {
    if (open) setF(patient ? { ...empty, ...patient, sms_opt_out: Boolean(patient.sms_opt_out) } : empty)
  }, [open, patient])
  const set = <K extends keyof PatientFields>(k: K, v: PatientFields[K]) => setF((cur) => ({ ...cur, [k]: v }))

  const save = () =>
    run(async () => {
      const body = { ...f, phone: f.phone.replace(/\D/g, ''), phone2: f.phone2.replace(/\D/g, ''), birth_date: f.birth_date || null }
      if (patient) {
        await api.patch(`/api/patients/${patient.id}`, body)
        onSaved(patient.id)
      } else {
        const r = await api.post<{ id: number }>('/api/patients', body)
        onSaved(r.id)
      }
      onClose()
    }, 'Хадгалагдлаа')

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={patient ? 'Үйлчлүүлэгчийн мэдээлэл засах' : 'Шинэ үйлчлүүлэгч'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Болих
          </Button>
          <Button busy={busy} disabled={!f.first_name.trim()} onClick={() => void save()}>
            Хадгалах
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Input id="pl" label="Овог" value={f.last_name} onChange={(e) => set('last_name', e.target.value)} />
        <Input id="pf" label="Нэр *" value={f.first_name} onChange={(e) => set('first_name', e.target.value)} />
        <Input id="pp" label="Утас" inputMode="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} />
        <Input id="pp2" label="Утас 2" hint="эцэг эх, гэр бүл" inputMode="tel" value={f.phone2} onChange={(e) => set('phone2', e.target.value)} />
        <Input
          id="preg"
          label="Регистрийн дугаар"
          value={f.register_no}
          onChange={(e) => {
            const v = e.target.value
            const parsed = fromRegister(v)
            setF((cur) => ({ ...cur, register_no: v, ...(parsed && !cur.birth_date ? parsed : {}) }))
          }}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input id="pb" type="date" label="Төрсөн огноо" value={f.birth_date ?? ''} onChange={(e) => set('birth_date', e.target.value || null)} />
          <Select id="pg" label="Хүйс" value={f.gender ?? ''} onChange={(e) => set('gender', (e.target.value || null) as PatientFields['gender'])}>
            <option value="">—</option>
            <option value="m">Эрэгтэй</option>
            <option value="f">Эмэгтэй</option>
          </Select>
        </div>
        <Input id="pa" className="sm:col-span-2" label="Хаяг" value={f.address} onChange={(e) => set('address', e.target.value)} />
        <Input id="pal" className="sm:col-span-2" label="Харшил" hint="эм, мэдээ алдуулалт г.м." value={f.allergies} onChange={(e) => set('allergies', e.target.value)} />
        <Textarea id="pm" className="sm:col-span-2" label="Эрүүл мэндийн тэмдэглэл" hint="даралт, чихрийн шижин, жирэмслэлт…" value={f.medical_notes} onChange={(e) => set('medical_notes', e.target.value)} />
        <Textarea id="pn" className="sm:col-span-2" label="Бусад тэмдэглэл" value={f.notes} onChange={(e) => set('notes', e.target.value)} />
        <Select id="ps" label="Хаанаас мэдсэн" value={f.source} onChange={(e) => set('source', e.target.value)}>
          <option value="walk_in">Биеэр ирсэн</option>
          <option value="phone">Утсаар</option>
          <option value="online">Онлайн захиалга</option>
          <option value="facebook">Facebook</option>
          <option value="referral">Танилаар</option>
          <option value="other">Бусад</option>
        </Select>
        <div className="flex items-end">
          <Toggle checked={f.sms_opt_out} onChange={(v) => set('sms_opt_out', v)} label="SMS илгээхгүй" hint="Сануулга, мэдээлэл явуулахгүй" />
        </div>
      </div>
    </Modal>
  )
}
