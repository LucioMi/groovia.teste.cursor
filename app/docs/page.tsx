import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpenIcon, ZapIcon, UsersIcon, CreditCardIcon, BarChartIcon, WebhookIcon } from "@/components/icons"
import Link from "next/link"

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Como Usar o GrooveIA SaaS</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Guia completo para começar a usar a plataforma de agentes IA
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BookOpenIcon className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>1. Cadastro e Onboarding</CardTitle>
              <CardDescription>Crie sua conta e configure sua primeira organização</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Cadastre-se com email e senha</li>
                <li>• Crie sua organização/workspace</li>
                <li>• Convide membros da equipe</li>
                <li>• Complete o setup inicial</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CreditCardIcon className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>2. Escolha seu Plano</CardTitle>
              <CardDescription>Selecione o plano ideal para suas necessidades</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Free: 3 agentes, 100 sessões</li>
                <li>• Starter: 10 agentes, 1K sessões</li>
                <li>• Pro: 50 agentes, 10K sessões</li>
                <li>• Enterprise: Ilimitado</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <ZapIcon className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>3. Crie Agentes IA</CardTitle>
              <CardDescription>Configure agentes inteligentes personalizados</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Defina nome e descrição</li>
                <li>• Configure instruções do sistema</li>
                <li>• Escolha o modelo de IA</li>
                <li>• Ajuste parâmetros avançados</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <UsersIcon className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>4. Gerencie Equipe</CardTitle>
              <CardDescription>Adicione membros e controle permissões</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Convide membros por email</li>
                <li>• Defina roles (Owner/Admin/Member)</li>
                <li>• Gerencie múltiplas organizações</li>
                <li>• Controle de acesso granular</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <WebhookIcon className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>5. Configure Webhooks</CardTitle>
              <CardDescription>Integre com seus sistemas externos</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Defina URLs de destino</li>
                <li>• Escolha eventos para escutar</li>
                <li>• Configure autenticação</li>
                <li>• Teste e monitore entregas</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChartIcon className="h-8 w-8 mb-2 text-primary" />
              <CardTitle>6. Monitore Uso</CardTitle>
              <CardDescription>Acompanhe métricas e otimize performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Dashboard com métricas em tempo real</li>
                <li>• Alertas de limite de uso</li>
                <li>• Análise de performance</li>
                <li>• Relatórios exportáveis</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-12 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Exemplo de Integração via API</CardTitle>
            <CardDescription>Use seus agentes em qualquer aplicação</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{`// Criar uma sessão com um agente
const response = await fetch('/api/agents/{agentId}/sessions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    message: 'Olá, como você pode me ajudar?',
    context: { userId: '123' }
  })
});

const data = await response.json();
console.log(data.response);`}</code>
            </pre>
          </CardContent>
        </Card>

        <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Pronto para Começar?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Crie sua conta gratuitamente e comece a construir agentes IA inteligentes em minutos
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/auth/signup">Criar Conta Grátis</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">Ver Planos</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
