import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"

let serverClient: SupabaseClient | null = null
let lastCookieHash: string | null = null

// Helper to create a simple hash of cookies for comparison
function hashCookies(cookieList: Array<{ name: string; value: string }>): string {
  return cookieList.map((c) => `${c.name}=${c.value}`).join("|")
}

export async function createClient() {
  const cookieStore = await cookies()
  const cookieList = cookieStore.getAll()
  const currentHash = hashCookies(cookieList)

  // Reuse client if cookies haven't changed
  if (serverClient && lastCookieHash === currentHash) {
    return serverClient
  }

  lastCookieHash = currentHash
  serverClient = createSupabaseServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Ignorar se chamado de Server Component
        }
      },
    },
  })

  return serverClient
}

export { createClient as createServerClient }
