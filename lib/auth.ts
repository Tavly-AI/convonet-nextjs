import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

type SessionToken = jwt.JwtPayload & { userId: number }

const AUTH_TOKEN = "token"

export async function getCurrentUserId() {
  const token = (await cookies()).get(AUTH_TOKEN)?.value
  const secret = process.env.JWT_SECRET

  if (!token || !secret) return null

  try {
    const session = jwt.verify(token, secret) as SessionToken
    return typeof session.userId === "number" ? session.userId : null
  } catch {
    return null
  }
}

export async function logout() {
  "use server"

  const cookieStore = await cookies()

  cookieStore.delete(AUTH_TOKEN)
  redirect("/auth/login")
}
