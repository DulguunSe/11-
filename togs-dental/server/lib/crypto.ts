import { createCipheriv, createDecipheriv, createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { env } from './env.ts'

/** Нууц үгийг scrypt-ээр хэшлэнэ: scrypt$N$salt$hash */
export function hashPassword(password: string) {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 })
  return `scrypt$16384$${salt.toString('base64')}$${hash.toString('base64')}`
}

export function verifyPassword(password: string, stored: string) {
  const [alg, n, saltB64, hashB64] = stored.split('$')
  if (alg !== 'scrypt' || !saltB64 || !hashB64) return false
  const expected = Buffer.from(hashB64, 'base64')
  const actual = scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, { N: Number(n), r: 8, p: 1 })
  return timingSafeEqual(actual, expected)
}

export const randomToken = (bytes = 32) => randomBytes(bytes).toString('base64url')
export const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

/** Нууц тохиргоог (FB токен, SMS түлхүүр) шифрлэх түлхүүр: APP_SECRET эсвэл data/.secret */
function secretKey() {
  let secret = process.env.APP_SECRET
  if (!secret) {
    const file = resolve(env.dataDir, '.secret')
    if (!existsSync(file)) writeFileSync(file, randomToken(48), { mode: 0o600 })
    secret = readFileSync(file, 'utf8').trim()
  }
  return createHash('sha256').update(`togs:${secret}`).digest()
}
let cachedKey: Buffer | null = null
const key = () => (cachedKey ??= secretKey())

export function encrypt(plain: string) {
  if (!plain) return ''
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return `enc:${Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64')}`
}

export function decrypt(value: string) {
  if (!value?.startsWith('enc:')) return value ?? ''
  try {
    const raw = Buffer.from(value.slice(4), 'base64')
    const decipher = createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12))
    decipher.setAuthTag(raw.subarray(12, 28))
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8')
  } catch {
    return ''
  }
}
