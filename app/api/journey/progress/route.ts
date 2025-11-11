export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId") || "default-user"
    const journeyType = searchParams.get("journeyType") || "scan"

    console.log("[v0] Fetching progress for:", { userId, journeyType })

    // TODO: Descomentar após executar script 009_create_journey_progress.sql
    console.log("[v0] Returning empty progress (table not created yet)")
    return Response.json({ completedSteps: [] })

    /* Descomentar após criar a tabela journey_progress:
    try {
      const result = await sql`
        SELECT step_id, completed_at
        FROM journey_progress
        WHERE user_id = ${userId} AND journey_type = ${journeyType}
        ORDER BY completed_at ASC
      `

      const completedSteps = Array.isArray(result) ? result.map((r) => r.step_id) : []

      console.log("[v0] Completed steps:", completedSteps)

      return Response.json({ completedSteps })
    } catch (error: any) {
      if (error.code === "42P01") {
        console.log("[v0] journey_progress table does not exist yet, returning empty progress")
        return Response.json({ completedSteps: [] })
      }
      throw error
    }
    */
  } catch (error) {
    console.error("[v0] Error fetching progress:", error)
    return Response.json({ error: "Failed to fetch progress" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId = "default-user", journeyType, stepId } = body

    console.log("[v0] Marking step complete:", { userId, journeyType, stepId })

    if (!journeyType || !stepId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // TODO: Descomentar após executar script 009_create_journey_progress.sql
    console.log("[v0] Simulating success (table not created yet)")
    return Response.json({ success: true })

    /* Descomentar após criar a tabela journey_progress:
    try {
      await sql`
        INSERT INTO journey_progress (user_id, journey_type, step_id, completed_at)
        VALUES (${userId}, ${journeyType}, ${stepId}, NOW())
        ON CONFLICT (user_id, journey_type, step_id) DO UPDATE
        SET completed_at = NOW()
      `

      console.log("[v0] Step marked as complete")

      return Response.json({ success: true })
    } catch (error: any) {
      if (error.code === "42P01") {
        console.error(
          "[v0] journey_progress table does not exist. Please run migration script 009_create_journey_progress.sql",
        )
        return Response.json(
          {
            error: "Progress tracking not available. Please contact administrator to run database migration.",
          },
          { status: 503 },
        )
      }
      throw error
    }
    */
  } catch (error) {
    console.error("[v0] Error saving progress:", error)
    return Response.json({ error: "Failed to save progress" }, { status: 500 })
  }
}
