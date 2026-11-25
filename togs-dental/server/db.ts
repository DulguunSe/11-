import './lib/tz.ts'
import { DatabaseSync, type SQLInputValue } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { env } from './lib/env.ts'

mkdirSync(dirname(env.dbPath), { recursive: true })
export const db = new DatabaseSync(env.dbPath)
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
  PRAGMA synchronous = NORMAL;
`)

// SQLite-ийн lower() зөвхөн латин үсэг хувиргадаг тул кирилл хайлтад Unicode хувилбар
db.function('ulower', { deterministic: true }, (s: unknown) => (typeof s === 'string' ? s.toLowerCase() : s) as SQLInputValue)

type Param = SQLInputValue | undefined | boolean
const norm = (params: Param[]) =>
  params.map((p) => (p === undefined ? null : typeof p === 'boolean' ? (p ? 1 : 0) : p)) as SQLInputValue[]

/** Нэг мөр авах */
export function one<T>(sql: string, ...params: Param[]): T | undefined {
  return db.prepare(sql).get(...norm(params)) as T | undefined
}
/** Олон мөр авах */
export function all<T>(sql: string, ...params: Param[]): T[] {
  return db.prepare(sql).all(...norm(params)) as T[]
}
/** INSERT/UPDATE/DELETE */
export function run(sql: string, ...params: Param[]) {
  const r = db.prepare(sql).run(...norm(params))
  return { changes: Number(r.changes), id: Number(r.lastInsertRowid) }
}

let depth = 0
/** Гүйлгээ (transaction). Дотор нь await хийхгүй. */
export function tx<T>(fn: () => T): T {
  if (depth > 0) return fn()
  depth++
  db.exec('BEGIN IMMEDIATE')
  try {
    const out = fn()
    db.exec('COMMIT')
    return out
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  } finally {
    depth--
  }
}

/* ------------------------------------------------------------------ */
/* Схем ба migration. Шинэ өөрчлөлтийг массивын төгсгөлд нэмнэ.        */
/* ------------------------------------------------------------------ */
const migrations: string[] = [
  `
  CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin','doctor','reception')),
    is_doctor INTEGER NOT NULL DEFAULT 0,
    password_hash TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    specialty TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#1466d6',
    online_booking INTEGER NOT NULL DEFAULT 1,
    show_on_site INTEGER NOT NULL DEFAULT 1,
    active INTEGER NOT NULL DEFAULT 1,
    must_change_password INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    ip TEXT NOT NULL DEFAULT '',
    user_agent TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE services (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    icon TEXT NOT NULL DEFAULT 'tooth',
    price INTEGER NOT NULL DEFAULT 0,
    price_note TEXT NOT NULL DEFAULT '',
    duration INTEGER NOT NULL DEFAULT 30,
    tag TEXT NOT NULL DEFAULT '',
    show_on_site INTEGER NOT NULL DEFAULT 1,
    online_booking INTEGER NOT NULL DEFAULT 1,
    sort INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE patients (
    id INTEGER PRIMARY KEY,
    card_no TEXT UNIQUE,
    last_name TEXT NOT NULL DEFAULT '',
    first_name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    phone2 TEXT NOT NULL DEFAULT '',
    register_no TEXT NOT NULL DEFAULT '',
    birth_date TEXT,
    gender TEXT CHECK (gender IN ('m','f') OR gender IS NULL),
    address TEXT NOT NULL DEFAULT '',
    allergies TEXT NOT NULL DEFAULT '',
    medical_notes TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'walk_in',
    sms_opt_out INTEGER NOT NULL DEFAULT 0,
    recall_due TEXT,
    recall_sent_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX patients_phone ON patients(phone);
  CREATE INDEX patients_name ON patients(first_name, last_name);

  CREATE TABLE appointments (
    id INTEGER PRIMARY KEY,
    ref TEXT NOT NULL UNIQUE,
    patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
    doctor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    service_name TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    start_min INTEGER NOT NULL,
    end_min INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending','confirmed','arrived','completed','cancelled','no_show')),
    source TEXT NOT NULL DEFAULT 'staff' CHECK (source IN ('online','phone','walk_in','staff')),
    utm TEXT NOT NULL DEFAULT '',
    teeth TEXT NOT NULL DEFAULT '',
    contact_name TEXT NOT NULL DEFAULT '',
    contact_phone TEXT NOT NULL DEFAULT '',
    patient_note TEXT NOT NULL DEFAULT '',
    staff_note TEXT NOT NULL DEFAULT '',
    reminder_sent_at TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX appt_date ON appointments(date, start_min);
  CREATE INDEX appt_doctor ON appointments(doctor_id, date);
  CREATE INDEX appt_patient ON appointments(patient_id);

  CREATE TABLE visits (
    id INTEGER PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    doctor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    date TEXT NOT NULL,
    complaint TEXT NOT NULL DEFAULT '',
    diagnosis TEXT NOT NULL DEFAULT '',
    treatment TEXT NOT NULL DEFAULT '',
    teeth TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    next_visit TEXT NOT NULL DEFAULT '',
    total INTEGER NOT NULL DEFAULT 0,
    discount INTEGER NOT NULL DEFAULT 0,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX visits_patient ON visits(patient_id, date);
  CREATE INDEX visits_date ON visits(date);

  CREATE TABLE visit_items (
    id INTEGER PRIMARY KEY,
    visit_id INTEGER NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    tooth TEXT NOT NULL DEFAULT '',
    qty INTEGER NOT NULL DEFAULT 1,
    price INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE payments (
    id INTEGER PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id INTEGER REFERENCES visits(id) ON DELETE SET NULL,
    doctor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('cash','card','transfer','qpay','other')),
    paid_at TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    received_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX payments_date ON payments(paid_at);
  CREATE INDEX payments_patient ON payments(patient_id);

  CREATE TABLE tooth_chart (
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    tooth INTEGER NOT NULL,
    status TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (patient_id, tooth)
  );

  CREATE TABLE patient_files (
    id INTEGER PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    kind TEXT NOT NULL DEFAULT 'xray' CHECK (kind IN ('xray','photo','document')),
    path TEXT NOT NULL,
    original_name TEXT NOT NULL DEFAULT '',
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE media (
    id INTEGER PRIMARY KEY,
    path TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'photo' CHECK (kind IN ('photo','logo')),
    description TEXT NOT NULL DEFAULT '',
    width INTEGER NOT NULL DEFAULT 0,
    height INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'draft'
      CHECK (status IN ('draft','approved','publishing','published','failed','rejected')),
    source TEXT NOT NULL DEFAULT 'ai' CHECK (source IN ('ai','manual')),
    kind TEXT NOT NULL DEFAULT '',
    topic TEXT NOT NULL DEFAULT '',
    caption TEXT NOT NULL DEFAULT '',
    hashtags TEXT NOT NULL DEFAULT '',
    template TEXT NOT NULL DEFAULT 'photo',
    design TEXT NOT NULL DEFAULT '{}',
    image_path TEXT,
    platforms TEXT NOT NULL DEFAULT 'facebook,instagram',
    scheduled_at TEXT,
    published_at TEXT,
    fb_post_id TEXT,
    ig_media_id TEXT,
    error TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX posts_sched ON posts(status, scheduled_at);

  CREATE TABLE sms_log (
    id INTEGER PRIMARY KEY,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    kind TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('sent','failed','skipped')),
    error TEXT,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX sms_created ON sms_log(created_at);

  CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id INTEGER,
    detail TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
  CREATE INDEX audit_created ON audit_log(created_at);

  CREATE TABLE jobs (name TEXT PRIMARY KEY, last_run TEXT NOT NULL);
  `,
]

export function migrate() {
  const { user_version } = one<{ user_version: number }>('PRAGMA user_version')!
  for (let v = user_version; v < migrations.length; v++) {
    tx(() => {
      db.exec(migrations[v])
      db.exec(`PRAGMA user_version = ${v + 1}`)
    })
  }
}
