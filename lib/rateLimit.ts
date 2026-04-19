// Simple in-memory rate limiter
const requests = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = requests.get(identifier)

  if (!record || now > record.resetTime) {
    requests.set(identifier, { count: 1, resetTime: now + windowMs })
    return true // allowed
  }

  if (record.count >= maxRequests) {
    return false // blocked
  }

  record.count++
  return true // allowed
}
