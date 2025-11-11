import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { cookies } from "next/headers"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("user_session")?.value

    if (sessionToken) {
      await sql`
        DELETE FROM sessions WHERE session_token = ${sessionToken}
      `

      logger.info("User logged out", { sessionToken: sessionToken.substring(0, 8) + "..." })
    }

    // Clear cookie
    cookieStore.delete("user_session")

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error("Logout error", error as Error)
    return NextResponse.json({ error: "Erro ao fazer logout" }, { status: 500 })
  }
}
