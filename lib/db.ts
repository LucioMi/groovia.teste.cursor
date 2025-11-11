import { createClient } from "@supabase/supabase-js"

const isBrowser = typeof window !== "undefined"

if (!isBrowser) {
  console.log("[v0] DB Init - Supabase Admin Client")
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

export async function executeQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
  try {
    // For Supabase, we use the from() builder instead of raw SQL
    // This function is kept for backward compatibility but should be replaced
    // with Supabase query builders in most cases
    console.warn("[v0] Direct SQL queries are discouraged. Use Supabase query builders instead.")
    console.log("[v0] Query:", query)

    throw new Error("Direct SQL execution not supported. Use Supabase query builders (.from(), .select(), etc.)")
  } catch (error) {
    console.error("[v0] Query execution failed:", error)
    throw error
  }
}

// NOTE: This should NOT be used for new code. Use Supabase query builders instead.
export function sql(strings: TemplateStringsArray, ...values: any[]): Promise<any[]> {
  let query = strings[0]
  for (let i = 0; i < values.length; i++) {
    const value = values[i]

    if (value === null || value === undefined) {
      query += "NULL"
    } else if (typeof value === "string") {
      query += `'${value.replace(/'/g, "''")}'`
    } else if (typeof value === "boolean") {
      query += value ? "TRUE" : "FALSE"
    } else if (value instanceof Date) {
      query += `'${value.toISOString()}'`
    } else if (typeof value === "object") {
      query += `'${JSON.stringify(value).replace(/'/g, "''")}'`
    } else {
      query += String(value)
    }

    query += strings[i + 1]
  }

  console.warn("[v0] sql template literal is deprecated. Use Supabase query builders (.from(), .select(), etc.)")
  console.log("[v0] SQL Query:", query)

  throw new Error(
    "sql() template function is not supported with Supabase. Please refactor to use Supabase query builders.",
  )
}

export function isPreviewMode(): boolean {
  return false
}

export async function setRLSContext(userId: string, orgId?: string) {
  console.log("[v0] RLS context (managed by Supabase Auth):", { userId, orgId })
}

export async function executeTransaction<T = any>(
  callback: () => Promise<T>,
  userId?: string,
  orgId?: string,
): Promise<T> {
  try {
    if (userId) {
      await setRLSContext(userId, orgId)
    }
    return await callback()
  } catch (error) {
    console.error("[v0] Transaction failed:", error, { userId, orgId })
    throw error
  }
}

export { supabaseAdmin as default }
