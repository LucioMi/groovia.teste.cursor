import { createServiceClient } from "./service"

// Alias for admin client (service role that bypasses RLS)
export function createAdminClient() {
  return createServiceClient()
}
