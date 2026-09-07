"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const AUTH_TOKEN = "token"

/** Clears the current session and returns the user to the login page. */
export async function logout() {
    const cookieStore = await cookies()

    cookieStore.delete(AUTH_TOKEN)
    redirect("/auth/login")
}
