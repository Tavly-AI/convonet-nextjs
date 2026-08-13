import { prisma } from "@/lib/prisma"
import { OAuth2Client } from "google-auth-library"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const ONE_MONTH_SECONDS = 60 * 60 * 24 * 30
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const jwtSecret = process.env.JWT_SECRET
const AUTH_TOKEN_V1 = "token"

export async function POST(request: Request) {
    if (!googleClientId || !jwtSecret) {
        return NextResponse.json(
            { error: "Google authentication is not configured." },
            { status: 500 }
        )
    }

    try {
        const { credential } = (await request.json()) as { credential?: unknown }
        const googleUser = await verifyGoogleCredential(credential, googleClientId)

        const user = await prisma.user.upsert({
            where: { sub: googleUser.sub },
            update: { email: googleUser.email },
            create: {
                sub: googleUser.sub,
                email: googleUser.email,
            },
        })

        const token = jwt.sign({ userId: user.id }, jwtSecret, {
            expiresIn: "30d",
        })

        const cookieStore = await cookies()
        cookieStore.set({
            name: AUTH_TOKEN_V1,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: ONE_MONTH_SECONDS,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Google login failed:", error)
        return NextResponse.json(
            { error: "Google login failed." },
            { status: 401 }
        )
    }
}

async function verifyGoogleCredential(
    credential: unknown,
    clientId: string
) {
    if (typeof credential !== "string" || !credential) {
        throw new Error("Google credential is required.")
    }

    const client = new OAuth2Client(clientId)
    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: clientId,
    })
    const payload = ticket.getPayload()

    if (!payload?.sub || !payload.email || !payload.email_verified) {
        throw new Error("Google account email is not verified.")
    }

    return {
        sub: payload.sub,
        email: payload.email,
    }
}
