import "server-only"

// Mock user data for demo purposes
const mockUser = {
  id: "demo-user-123",
  primaryEmail: "demo@groovia.com",
  displayName: "Demo User",
  profileImageUrl: null,
  signedUpAt: new Date(),
}

// Mock Stack Server App
export const stackServerApp = {
  async getUser() {
    // Return mock user for demo mode
    return mockUser
  },
}
