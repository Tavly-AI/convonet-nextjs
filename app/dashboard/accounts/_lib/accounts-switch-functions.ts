"use server"

import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { getCurrentUserId } from "@/lib/auth"
import { AUTH_TOKEN } from "@/lib/constants"
import { prisma } from "@/lib/prisma"

const SUPERADMIN_USER_IDS = [1, 4] // Apoorv, Satyam

async function requireSuperAdmin() {
    const id = await getCurrentUserId()
    if (!id || !await prisma.user.findUnique({ where: { id }, select: { id: true } })) {
        throw new Error("Please log in first.")
    }
    if (!SUPERADMIN_USER_IDS.includes(id)) { throw new Error("Only superadmins can access account switching.") }
}

export async function accounts_getAccounts() {
    await requireSuperAdmin()
    const users = await prisma.user.findMany({
        select: { id: true, email: true, phone: true, role: true, workspace: { select: { name: true } } },
        orderBy: { id: "asc" },
    })
    return users.map((user) => ({
        id: user.id, name: user.email || user.phone || `User ${user.id}`,
        email: user.email, role: user.role || "No role", workspace: user.workspace?.name || "No workspace",
    }))
}

export async function accounts_switchAccount(userId: number) {
    await requireSuperAdmin()
    if (!Number.isSafeInteger(userId) || userId <= 0) throw new Error("Invalid account.")

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) throw new Error("Account no longer exists.")

    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error("Login is not configured.")

    const cookieStore = await cookies()
    cookieStore.set(AUTH_TOKEN, jwt.sign({ userId: user.id }, secret, { expiresIn: "30d" }), {
        httpOnly: true, secure: process.env.NODE_ENV === "production",
        sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
    })
}
