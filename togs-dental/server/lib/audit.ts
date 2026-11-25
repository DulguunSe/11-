import { run } from '../db.ts'
import { nowStamp } from './time.ts'

/** Үйлдлийн бүртгэл: хэн, хэзээ, юуг өөрчилсөн (эмнэлгийн мэдээллийн аюулгүй байдалд) */
export function audit(userId: number | null, action: string, entity: string, entityId?: number | null, detail = '') {
  run(
    'INSERT INTO audit_log (user_id, action, entity, entity_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    userId,
    action,
    entity,
    entityId ?? null,
    detail.slice(0, 500),
    nowStamp(),
  )
}
