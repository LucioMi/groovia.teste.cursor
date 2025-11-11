import { NextResponse } from "next/server"
import { getUsageLimits } from "@/lib/feature-gates"

export async function GET() {
  try {
    const usage = await getUsageLimits()
    return NextResponse.json(usage)
  } catch (error) {
    console.error("Error fetching usage:", error)
    return NextResponse.json({ error: "Failed to fetch usage" }, { status: 500 })
  }
}
