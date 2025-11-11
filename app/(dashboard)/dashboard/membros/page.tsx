"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOrganization } from "@/lib/organization-context"

const UsersIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
)

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14"></path>
    <path d="M12 5v14"></path>
  </svg>
)

interface Member {
  id: string
  user_id: string
  role: string
  joined_at: string
}

export default function MembrosPage() {
  const { currentOrganization } = useOrganization()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")

  useEffect(() => {
    if (currentOrganization) {
      fetchMembers()
    }
  }, [currentOrganization])

  const fetchMembers = async () => {
    try {
      console.log("[v0] Fetching members for organization:", currentOrganization?.id)
      const response = await fetch("/api/organization/members")
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error("[v0] Error fetching members:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    try {
      const response = await fetch("/api/organization/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })

      if (response.ok) {
        await fetchMembers()
        setShowInviteForm(false)
        setInviteEmail("")
        setInviteRole("member")
      }
    } catch (error) {
      console.error("[v0] Error inviting member:", error)
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      owner: "bg-purple-100 text-purple-700",
      admin: "bg-blue-100 text-blue-700",
      member: "bg-gray-100 text-gray-700",
    }
    return colors[role as keyof typeof colors] || colors.member
  }

  const getRoleLabel = (role: string) => {
    const labels = {
      owner: "Proprietário",
      admin: "Administrador",
      member: "Membro",
    }
    return labels[role as keyof typeof labels] || role
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#7C3AED] mx-auto mb-4" />
          <p className="text-gray-600">Carregando membros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[#7C3AED] mb-2">Membros da Equipe</h1>
        <p className="text-gray-600">Gerencie os membros da sua organização</p>
      </div>

      <div className="mb-6">
        <Button onClick={() => setShowInviteForm(!showInviteForm)}>
          <PlusIcon />
          <span className="ml-2">{showInviteForm ? "Cancelar" : "Convidar Membro"}</span>
        </Button>
      </div>

      {showInviteForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Convidar Novo Membro</CardTitle>
            <CardDescription>Envie um convite por email para adicionar um novo membro</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <select
                id="role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="member">Membro</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <Button onClick={handleInvite} disabled={!inviteEmail}>
              Enviar Convite
            </Button>
          </CardContent>
        </Card>
      )}

      {members.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-4 text-gray-400">
            <UsersIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum membro na equipe</h3>
          <p className="text-gray-600 mb-4">Convide membros para colaborar na sua organização</p>
          <Button onClick={() => setShowInviteForm(true)}>
            <PlusIcon />
            <span className="ml-2">Convidar Membro</span>
          </Button>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Membros ({members.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-purple-700">
                        {member.user_id.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{member.user_id}</p>
                      <p className="text-sm text-muted-foreground">
                        Entrou em {new Date(member.joined_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadge(member.role)}`}>
                      {getRoleLabel(member.role)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
