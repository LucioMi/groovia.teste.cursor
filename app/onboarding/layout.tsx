import type React from "react"

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Onboarding flow now handled client-side with localStorage
  return children
}
