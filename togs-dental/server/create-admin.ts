// Админ үүсгэх эсвэл нууц үгийг сэргээх: npm run create-admin -- <нэвтрэх_нэр> <нууц_үг> [нэр]
import './lib/tz.ts'
import { migrate, one, run } from './db.ts'
import { hashPassword } from './lib/crypto.ts'
import { nowStamp } from './lib/time.ts'

const [username, password, name = 'Админ'] = process.argv.slice(2)
if (!username || !password || password.length < 8) {
  console.error('Хэрэглээ: npm run create-admin -- <нэвтрэх_нэр> <нууц_үг (8+ тэмдэгт)> [нэр]')
  process.exit(1)
}
migrate()
const existing = one<{ id: number }>('SELECT id FROM users WHERE username = ?', username)
if (existing) {
  run(`UPDATE users SET password_hash = ?, role = 'admin', active = 1, must_change_password = 0 WHERE id = ?`, hashPassword(password), existing.id)
  run('DELETE FROM sessions WHERE user_id = ?', existing.id)
  console.log(`"${username}" хэрэглэгчийн нууц үг шинэчлэгдэж, админ эрх олгогдлоо.`)
} else {
  run(
    `INSERT INTO users (username, name, role, is_doctor, password_hash, created_at) VALUES (?, ?, 'admin', 0, ?, ?)`,
    username,
    name,
    hashPassword(password),
    nowStamp(),
  )
  console.log(`Админ "${username}" үүслээ.`)
}
