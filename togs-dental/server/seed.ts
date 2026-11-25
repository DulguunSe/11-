import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { all, one, run, tx } from './db.ts'
import { hashPassword, randomToken } from './lib/crypto.ts'
import { env } from './lib/env.ts'
import { addDays, nowStamp, today } from './lib/time.ts'
import { createAppointment } from './services/booking.ts'

/** Анх ажиллуулахад: үйлчилгээ, эмнэлгийн зургууд, админ эрх */
export function seed() {
  if (!one('SELECT 1 FROM services')) {
    const services: [string, string, string, number, string, number, number][] = [
      ['Япон шүд цайруулалт', 'Японд патентлагдсан WHITE ESSENCE цайруулалт. Өвдөлтгүй, пааланг гэмтээхгүй, багадаа 4–6 түвшин цайрна.', 'spark', 60, 'Онцлох', 1, 1],
      ['Шүдний ломбо', 'Цоорсон, хагарсан шүдийг шүдний өнгөтэй материалаар нөхөж, хэлбэр, зажлах чадварыг нь сэргээнэ.', 'tooth', 45, '', 1, 2],
      ['Зай нөхөлт', 'Алдсан шүдний зайг нөхөж, инээмсэглэл, зажлах чадварыг тань буцаан сэргээнэ.', 'bridge', 60, '', 1, 3],
      ['Риббонд', 'Риббонд эслэг туузаар сул шүдийг бэхлэх, нэг шүдний зайг нөхөх орчин үеийн арга.', 'link', 45, '', 1, 4],
      ['Ёзоор сэргээлт', 'Титэм нь их хэмжээгээр эвдэрсэн шүдийг ёзоороос нь сэргээж, шүдээ авахгүйгээр хадгалах боломж олгоно.', 'root', 60, '', 1, 5],
      ['Хүүхдийн шүдний эмчилгээ', 'Хүүхдэд ээлтэй орчинд сүүн шүдний үзлэг, эмчилгээ, урьдчилан сэргийлэлт.', 'baby', 30, '', 1, 6],
      ['Шүд авах', 'Эмчилгээ боломжгүй болсон шүдийг мэдээ алдуулалттайгаар авах.', 'tooth', 30, '', 0, 7],
      ['Үзлэг, зөвлөгөө', 'Шүдний ерөнхий үзлэг, эмчилгээний төлөвлөгөө, зөвлөгөө.', 'steth', 30, '', 0, 8],
    ]
    for (const [name, description, icon, duration, tag, show, sort] of services) {
      run(
        'INSERT INTO services (name, description, icon, duration, tag, show_on_site, online_booking, sort, price_note) VALUES (?,?,?,?,?,?,1,?,?)',
        name,
        description,
        icon,
        duration,
        tag,
        show,
        sort,
        'Үзлэгийн дараа тодорхойлно',
      )
    }
  }

  if (!one('SELECT 1 FROM media')) {
    const publicDir = resolve(existsSync('dist/client/img') ? 'dist/client' : 'public')
    mkdirSync(resolve(env.uploadsDir, 'media/library'), { recursive: true })
    const add = (src: string, rel: string, kind: 'photo' | 'logo', description: string, w: number, h: number) => {
      const from = resolve(publicDir, src)
      if (!existsSync(from)) return
      copyFileSync(from, resolve(env.uploadsDir, rel))
      run('INSERT INTO media (path, kind, description, width, height, created_at) VALUES (?,?,?,?,?,?)', rel, kind, description, w, h, nowStamp())
    }
    add('img/mark.png', 'media/library/logo-mark.png', 'logo', 'Төгс шүдний эмнэлгийн лого (цэнхэр-ногоон шүд)', 200, 204)
    add('img/sign.jpg', 'media/library/clinic-sign.jpg', 'photo', 'Эмнэлгийн үүдний гантиг хана дээрх "ТӨГС Dental Clinic" алтан үсэгтэй хаяг, гэрэлтэй цэнхэр шүдний лого', 1180, 770)
    add('img/cover.jpg', 'media/library/clinic-reception.jpg', 'photo', 'Эмнэлгийн хүлээн авах ширээ, ард нь шүдний эмчилгээний сандалтай өрөө', 1121, 412)
  }

  if (!one('SELECT 1 FROM users')) {
    const password = process.env.INITIAL_ADMIN_PASSWORD || randomToken(9)
    run(
      `INSERT INTO users (username, name, role, is_doctor, password_hash, must_change_password, created_at) VALUES ('admin', 'Админ', 'admin', 0, ?, 1, ?)`,
      hashPassword(password),
      nowStamp(),
    )
    if (!process.env.INITIAL_ADMIN_PASSWORD) {
      const file = resolve(env.dataDir, 'INITIAL_ADMIN_PASSWORD.txt')
      writeFileSync(file, `Нэвтрэх нэр: admin\nНууц үг: ${password}\n(Анх нэвтрэхэд нууц үгээ солино.)\n`, { mode: 0o600 })
      console.log(`\n  Админ эрх үүслээ → нэвтрэх нэр: admin, нууц үг: ${password}\n  (${file} файлд хадгалсан. Анх нэвтрээд солино уу.)\n`)
    }
  }

  if (env.seedDemo && !one('SELECT 1 FROM patients')) seedDemo()
}

/** Танилцуулгад зориулсан ЖИШЭЭ өгөгдөл (SEED_DEMO=1). Бодит ажиллагаанд ашиглахгүй. */
function seedDemo() {
  tx(() => {
    const pw = hashPassword('demo12345')
    const stamp = nowStamp()
    const mk = (username: string, name: string, role: string, specialty: string, color: string) =>
      run(
        `INSERT INTO users (username, name, role, is_doctor, password_hash, specialty, color, created_at) VALUES (?,?,?,?,?,?,?,?)`,
        username,
        name,
        role,
        role === 'doctor' ? 1 : 0,
        pw,
        specialty,
        color,
        stamp,
      ).id
    const d1 = mk('emch1', 'Жишээ эмч Б. Болор', 'doctor', 'Ерөнхий шүдний эмч', '#1466d6')
    const d2 = mk('emch2', 'Жишээ эмч Д. Тэмүүлэн', 'doctor', 'Хүүхдийн шүдний эмч', '#3fae12')
    mk('reception', 'Жишээ ресепшн', 'reception', '', '#a8833a')

    const svc = (name: string) => one<{ id: number; duration: number }>('SELECT id, duration FROM services WHERE name = ?', name)!
    const people: [string, string, string, string][] = [
      ['Бат', 'Жишээ-Оюун', '99110001', '1990-04-12'],
      ['Дорж', 'Жишээ-Сарнай', '99110002', '1985-09-03'],
      ['Ганаа', 'Жишээ-Тэмүүжин', '99110003', '2016-02-20'],
      ['Нараа', 'Жишээ-Мөнх', '99110004', '1978-12-01'],
      ['Сүх', 'Жишээ-Ану', '99110005', '2001-06-18'],
      ['Очир', 'Жишээ-Билгүүн', '99110006', '2012-11-30'],
    ]
    const ids = people.map(([last, first, phone, birth]) => {
      const { id } = run(
        `INSERT INTO patients (last_name, first_name, phone, birth_date, source, created_at, updated_at) VALUES (?,?,?,?, 'walk_in', ?, ?)`,
        last,
        first,
        phone,
        birth,
        stamp,
        stamp,
      )
      run('UPDATE patients SET card_no = ? WHERE id = ?', String(id).padStart(5, '0'), id)
      return id
    })
    run(`UPDATE patients SET allergies = 'Пенициллин' WHERE id = ?`, ids[3])

    const t = today()
    const appt = (pid: number | null, doctor: number, service: string, date: string, time: string, status: string, source: 'online' | 'phone' | 'walk_in' | 'staff', contact?: [string, string]) => {
      const s = svc(service)
      const p = pid ? one<{ first_name: string; phone: string }>('SELECT first_name, phone FROM patients WHERE id = ?', pid) : null
      return createAppointment({
        patient_id: pid,
        doctor_id: doctor,
        service_id: s.id,
        service_name: service,
        date,
        start_time: time,
        duration: s.duration,
        status,
        source,
        contact_name: contact?.[0] ?? p?.first_name ?? '',
        contact_phone: contact?.[1] ?? p?.phone ?? '',
      }).id
    }
    appt(ids[0], d1, 'Шүдний ломбо', t, '10:00', 'confirmed', 'phone')
    appt(ids[2], d2, 'Хүүхдийн шүдний эмчилгээ', t, '11:00', 'arrived', 'walk_in')
    appt(ids[1], d1, 'Япон шүд цайруулалт', t, '15:00', 'confirmed', 'online')
    appt(null, d2, 'Үзлэг, зөвлөгөө', addDays(t, 1), '09:30', 'pending', 'online', ['Жишээ-Хулан', '99110009'])
    appt(ids[4], d1, 'Ёзоор сэргээлт', addDays(t, 1), '14:00', 'confirmed', 'phone')

    const visit = (pid: number, doctor: number, date: string, diagnosis: string, treatment: string, teeth: string, items: [string, number][], paid: number, method: string) => {
      const total = items.reduce((s, [, p]) => s + p, 0)
      const { id } = run(
        `INSERT INTO visits (patient_id, doctor_id, date, diagnosis, treatment, teeth, total, created_by, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        pid,
        doctor,
        date,
        diagnosis,
        treatment,
        teeth,
        total,
        doctor,
        stamp,
        stamp,
      )
      for (const [name, price] of items) run('INSERT INTO visit_items (visit_id, name, tooth, qty, price) VALUES (?,?,?,1,?)', id, name, teeth, price)
      if (paid) run('INSERT INTO payments (patient_id, visit_id, doctor_id, amount, method, paid_at, received_by, created_at) VALUES (?,?,?,?,?,?,?,?)', pid, id, doctor, paid, method, date, doctor, stamp)
    }
    visit(ids[0], d1, addDays(t, -40), 'Цоорол (K02.1)', 'Цоорол цэвэрлэж, гэрлийн ломбо тавьсан', '36', [['Шүдний ломбо', 80000]], 80000, 'card')
    visit(ids[3], d1, addDays(t, -12), 'Шүдний чулуу', 'Чулуу авч, өнгөлгөө хийсэн', '', [['Үзлэг, зөвлөгөө', 20000], ['Шүдний чулуу авах', 60000]], 50000, 'cash')
    visit(ids[5], d2, addDays(t, -3), 'Сүүн шүдний цоорол', 'Ломбо тавьсан, эцэг эхэд зөвлөгөө өгсөн', '75', [['Хүүхдийн шүдний эмчилгээ', 45000]], 45000, 'transfer')
    run(`INSERT INTO tooth_chart (patient_id, tooth, status, updated_at) VALUES (?, 36, 'filled', ?), (?, 46, 'caries', ?)`, ids[0], stamp, ids[0], stamp)
  })
  console.log('  ЖИШЭЭ өгөгдөл нэмэгдлээ (эмч: emch1 / emch2, ресепшн: reception, нууц үг: demo12345)')
}

export function counts() {
  return all<{ name: string; n: number }>(
    `SELECT 'patients' name, COUNT(*) n FROM patients UNION ALL SELECT 'appointments', COUNT(*) FROM appointments UNION ALL SELECT 'users', COUNT(*) FROM users`,
  )
}
