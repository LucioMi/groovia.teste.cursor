"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface Organization {
  id: string
  name: string
  slug: string
  plan_type: string
  role: string
}

interface OrganizationContextType {
  currentOrganization: Organization | null
  organizations: Organization[]
  switchOrganization: (orgId: string) => Promise<void>
  refreshOrganizations: () => Promise<void>
  isLoading: boolean
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/user/organizations")
      if (response.ok) {
        const data = await response.json()
        setOrganizations(data.organizations || [])
        setCurrentOrganization(data.current || null)
      }
    } catch (error) {
      console.error("[v0] Error fetching organizations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const switchOrganization = async (orgId: string) => {
    try {
      const response = await fetch("/api/user/organizations/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId }),
      })

      if (response.ok) {
        await fetchOrganizations()
        window.location.reload() // Reload to refresh all data
      }
    } catch (error) {
      console.error("[v0] Error switching organization:", error)
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        switchOrganization,
        refreshOrganizations: fetchOrganizations,
        isLoading,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider")
  }
  return context
}
