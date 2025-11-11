"use client"

// Generic CRUD operations using localStorage
export interface Entity {
  id: string
  createdAt: string
  updatedAt: string
}

export interface User extends Entity {
  name: string
  email: string
  role: "admin" | "owner" | "member" | "viewer"
  organizationId?: string
  status: "active" | "inactive"
}

export interface Organization extends Entity {
  name: string
  slug: string
  ownerId: string
  memberCount: number
  plan: "free" | "pro" | "enterprise"
}

export interface Agent extends Entity {
  name: string
  description: string
  status: "active" | "inactive" | "training"
  organizationId: string
  conversationCount: number
}

class CRUDService<T extends Entity> {
  constructor(private storageKey: string) {}

  getAll(): T[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(this.storageKey)
    return data ? JSON.parse(data) : []
  }

  getById(id: string): T | null {
    const items = this.getAll()
    return items.find((item) => item.id === id) || null
  }

  create(data: Omit<T, "id" | "createdAt" | "updatedAt">): T {
    const items = this.getAll()
    const newItem: T = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as T
    items.push(newItem)
    localStorage.setItem(this.storageKey, JSON.stringify(items))
    return newItem
  }

  update(id: string, data: Partial<Omit<T, "id" | "createdAt">>): T | null {
    const items = this.getAll()
    const index = items.findIndex((item) => item.id === id)
    if (index === -1) return null

    items[index] = {
      ...items[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(this.storageKey, JSON.stringify(items))
    return items[index]
  }

  delete(id: string): boolean {
    const items = this.getAll()
    const filtered = items.filter((item) => item.id !== id)
    if (filtered.length === items.length) return false
    localStorage.setItem(this.storageKey, JSON.stringify(filtered))
    return true
  }

  search(query: string, fields: (keyof T)[]): T[] {
    const items = this.getAll()
    const lowerQuery = query.toLowerCase()
    return items.filter((item) =>
      fields.some((field) => {
        const value = item[field]
        return typeof value === "string" && value.toLowerCase().includes(lowerQuery)
      }),
    )
  }
}

export const usersService = new CRUDService<User>("saas_users")
export const organizationsService = new CRUDService<Organization>("saas_organizations")
export const agentsService = new CRUDService<Agent>("saas_agents")

// Initialize with mock data if empty
export function initializeMockData() {
  if (typeof window === "undefined") return

  if (usersService.getAll().length === 0) {
    // Admin users
    usersService.create({
      name: "Carlos Silva",
      email: "carlos.silva@groov.ia",
      role: "admin",
      status: "active",
    })

    // Organization owners
    usersService.create({
      name: "Ricardo Nogueira",
      email: "ricardo@beagencia.com.br",
      role: "owner",
      organizationId: "org1",
      status: "active",
    })
    usersService.create({
      name: "Maria Santos",
      email: "maria@techcorp.com.br",
      role: "owner",
      organizationId: "org2",
      status: "active",
    })
    usersService.create({
      name: "João Oliveira",
      email: "joao@startupbr.com",
      role: "owner",
      organizationId: "org3",
      status: "active",
    })
    usersService.create({
      name: "Ana Paula Costa",
      email: "ana@consultoria.com.br",
      role: "owner",
      organizationId: "org4",
      status: "active",
    })

    // Team members for BE Agencia
    usersService.create({
      name: "Pedro Henrique",
      email: "pedro@beagencia.com.br",
      role: "member",
      organizationId: "org1",
      status: "active",
    })
    usersService.create({
      name: "Juliana Ferreira",
      email: "juliana@beagencia.com.br",
      role: "member",
      organizationId: "org1",
      status: "active",
    })
    usersService.create({
      name: "Lucas Martins",
      email: "lucas@beagencia.com.br",
      role: "member",
      organizationId: "org1",
      status: "active",
    })

    // Team members for other orgs
    usersService.create({
      name: "Fernanda Souza",
      email: "fernanda@techcorp.com.br",
      role: "member",
      organizationId: "org2",
      status: "active",
    })
    usersService.create({
      name: "Roberto Lima",
      email: "roberto@startupbr.com",
      role: "viewer",
      organizationId: "org3",
      status: "active",
    })
  }

  if (organizationsService.getAll().length === 0) {
    organizationsService.create({
      name: "BE Agencia",
      slug: "be-agencia",
      ownerId: "user2",
      memberCount: 15,
      plan: "enterprise",
    })
    organizationsService.create({
      name: "TechCorp Brasil",
      slug: "techcorp-brasil",
      ownerId: "user3",
      memberCount: 12,
      plan: "enterprise",
    })
    organizationsService.create({
      name: "Startup Inovadora",
      slug: "startup-inovadora",
      ownerId: "user4",
      memberCount: 5,
      plan: "pro",
    })
    organizationsService.create({
      name: "Consultoria Digital",
      slug: "consultoria-digital",
      ownerId: "user5",
      memberCount: 3,
      plan: "free",
    })
    organizationsService.create({
      name: "E-commerce Solutions",
      slug: "ecommerce-solutions",
      ownerId: "user3",
      memberCount: 8,
      plan: "pro",
    })
    organizationsService.create({
      name: "Marketing 360",
      slug: "marketing-360",
      ownerId: "user2",
      memberCount: 6,
      plan: "pro",
    })
  }

  if (agentsService.getAll().length === 0) {
    agentsService.create({
      name: "Assistente de Atendimento BE",
      description:
        "Agente especializado em atendimento ao cliente 24/7 para BE Agencia, capaz de responder perguntas sobre serviços, projetos e orçamentos.",
      status: "active",
      organizationId: "org1",
      conversationCount: 2847,
    })
    agentsService.create({
      name: "Consultor de Marketing Digital",
      description:
        "Agente focado em estratégias de marketing digital, análise de campanhas e recomendações para clientes da BE Agencia.",
      status: "active",
      organizationId: "org1",
      conversationCount: 1456,
    })
    agentsService.create({
      name: "Gerente de Projetos Virtual",
      description:
        "Assistente que ajuda no gerenciamento de projetos, acompanhamento de prazos e comunicação com clientes da BE Agencia.",
      status: "active",
      organizationId: "org1",
      conversationCount: 892,
    })
    agentsService.create({
      name: "Suporte Técnico TechCorp",
      description:
        "Especialista em resolver problemas técnicos, diagnosticar erros e fornecer soluções passo a passo para clientes da TechCorp.",
      status: "active",
      organizationId: "org2",
      conversationCount: 1234,
    })
    agentsService.create({
      name: "Assistente de Vendas",
      description:
        "Agente que auxilia no processo de vendas, qualificação de leads e agendamento de reuniões para a Startup Inovadora.",
      status: "training",
      organizationId: "org3",
      conversationCount: 567,
    })
    agentsService.create({
      name: "Consultor Financeiro",
      description:
        "Ajuda com questões financeiras, análise de relatórios e recomendações para clientes da Consultoria Digital.",
      status: "active",
      organizationId: "org4",
      conversationCount: 789,
    })
  }
}

export function resetAllData() {
  if (typeof window === "undefined") return

  localStorage.removeItem("saas_users")
  localStorage.removeItem("saas_organizations")
  localStorage.removeItem("saas_agents")

  initializeMockData()
}
