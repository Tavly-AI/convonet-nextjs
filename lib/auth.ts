import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

type SessionToken = jwt.JwtPayload & { userId: number }

export async function getCurrentUserId() {
  const token = (await cookies()).get("token")?.value
  const secret = process.env.JWT_SECRET

  if (!token || !secret) return null

  try {
    const session = jwt.verify(token, secret) as SessionToken
    return typeof session.userId === "number" ? session.userId : null
  } catch {
    return null
  }
}
