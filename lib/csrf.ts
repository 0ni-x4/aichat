import { createHash, randomBytes } from "crypto"
import { cookies } from "next/headers"

function getCsrfSecret(): string {
  const secret = process.env.CSRF_SECRET
  if (!secret) {
    console.warn("CSRF_SECRET not found, using default (not secure for production)")
    return "default-csrf-secret-please-set-environment-variable"
  }
  return secret
}

export function generateCsrfToken(): string {
  const raw = randomBytes(32).toString("hex")
  const token = createHash("sha256")
    .update(`${raw}${getCsrfSecret()}`)
    .digest("hex")
  return `${raw}:${token}`
}

export function validateCsrfToken(fullToken: string): boolean {
  const [raw, token] = fullToken.split(":")
  if (!raw || !token) return false
  const expected = createHash("sha256")
    .update(`${raw}${getCsrfSecret()}`)
    .digest("hex")
  return expected === token
}

export async function setCsrfCookie() {
  const cookieStore = await cookies()
  const token = generateCsrfToken()
  cookieStore.set("csrf_token", token, {
    httpOnly: false,
    secure: true,
    path: "/",
  })
}
