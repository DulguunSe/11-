/** Монгол утасны дугаар: 8 орон, +976 / 976 угтвартай байж болно. Зай, зураас зөвшөөрнө. */
export function normalizePhone(value: string) {
  let digits = value.replace(/[^\d]/g, '')
  if (digits.length === 11 && digits.startsWith('976')) digits = digits.slice(3)
  return digits
}

export function isValidPhone(value: string) {
  return /^\d{8}$/.test(normalizePhone(value))
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

export function isValidName(value: string) {
  return value.trim().length >= 2
}
