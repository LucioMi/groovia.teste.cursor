import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function APIKeysPage() {
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

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">API Keys</h1>
          <Button>Criar Nova Key</Button>
        </div>

        <div className="space-y-6">
          {/* API Documentation */}
          <Card>
            <CardHeader>
              <CardTitle>Documentação da API</CardTitle>
              <CardDescription>Aprenda a integrar com a API do GrooveIA</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Use as API keys para autenticar suas requisições à API do GrooveIA. Mantenha suas keys seguras e nunca
                as compartilhe publicamente.
              </p>
              <Button variant="outline" asChild>
                <Link href="/docs">Ver Documentação Completa</Link>
              </Button>
            </CardContent>
          </Card>

          {/* API Keys List */}
          <Card>
            <CardHeader>
              <CardTitle>Suas API Keys</CardTitle>
              <CardDescription>Gerencie suas chaves de API</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Example API Key */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Production Key</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Copiar
                      </Button>
                      <Button size="sm" variant="destructive">
                        Revogar
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Input value="sk_live_••••••••••••••••••••••••••••1234" readOnly className="font-mono text-sm" />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Criada em 15/01/2025</span>
                    <span>Último uso: há 2 dias</span>
                  </div>
                </div>

                {/* Create New Key Prompt */}
                <div className="p-4 border rounded-lg border-dashed text-center">
                  <p className="text-sm text-muted-foreground mb-2">Crie uma nova API key para começar</p>
                  <Button variant="outline">Criar API Key</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Uso</CardTitle>
              <CardDescription>Requisições da API nos últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-2xl font-bold">1,234</p>
                  <p className="text-sm text-muted-foreground">Total de Requisições</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">98.5%</p>
                  <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">45ms</p>
                  <p className="text-sm text-muted-foreground">Latência Média</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rate Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Limites de Taxa</CardTitle>
              <CardDescription>Seus limites de requisições por minuto</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Requisições por Minuto</span>
                    <span className="text-sm font-medium">45 / 100</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: "45%" }} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Faça upgrade do seu plano para aumentar os limites de taxa
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
