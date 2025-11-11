import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-2xl font-bold">
            GrooveIA
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/dashboard">Voltar ao Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Equipe</h1>
          <Button>Convidar Membro</Button>
        </div>

        <div className="space-y-6">
          {/* Organization Info */}
          <Card>
            <CardHeader>
              <CardTitle>Organização</CardTitle>
              <CardDescription>Informações da sua organização</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-1">Nome da Organização</p>
                <Input defaultValue="Minha Empresa" />
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Membros</p>
                <p className="text-2xl font-bold">1 / 5</p>
                <p className="text-sm text-muted-foreground">membros ativos</p>
              </div>
              <Button>Salvar Alterações</Button>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle>Membros da Equipe</CardTitle>
              <CardDescription>Gerencie os membros da sua organização</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current User */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                      U
                    </div>
                    <div>
                      <p className="font-medium">Usuário Demo</p>
                      <p className="text-sm text-muted-foreground">demo@grooveia.com</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm px-2 py-1 bg-primary/10 text-primary rounded">Admin</span>
                    <span className="text-sm text-muted-foreground">Você</span>
                  </div>
                </div>

                {/* Invite Form */}
                <div className="p-4 border rounded-lg border-dashed">
                  <p className="text-sm font-medium mb-2">Convidar novo membro</p>
                  <div className="flex gap-2">
                    <Input placeholder="email@exemplo.com" className="flex-1" />
                    <select className="px-3 py-2 border rounded-md">
                      <option>Membro</option>
                      <option>Admin</option>
                    </select>
                    <Button>Enviar Convite</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Invites */}
          <Card>
            <CardHeader>
              <CardTitle>Convites Pendentes</CardTitle>
              <CardDescription>Convites enviados aguardando aceitação</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Nenhum convite pendente</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
