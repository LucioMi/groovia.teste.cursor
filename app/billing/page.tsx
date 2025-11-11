import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckIcon } from "@/components/icons"

export default function BillingPage() {
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
        <h1 className="text-3xl font-bold mb-8">Assinatura e Faturamento</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Current Plan */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Plano Atual</CardTitle>
                <CardDescription>Você está no plano Free</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-2xl font-bold">$0/mês</p>
                    <p className="text-sm text-muted-foreground">Renovação automática em 30 dias</p>
                  </div>
                  <Button>Fazer Upgrade</Button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm">3 agentes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm">100 sessões/mês</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm">10 webhooks</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Uso Atual</CardTitle>
                <CardDescription>Seu consumo neste mês</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Agentes</span>
                    <span className="text-sm font-medium">2 / 3</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: "66%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Sessões</span>
                    <span className="text-sm font-medium">45 / 100</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: "45%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm">Webhooks</span>
                    <span className="text-sm font-medium">5 / 10</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: "50%" }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Método de Pagamento</CardTitle>
                <CardDescription>Gerencie seus métodos de pagamento</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Nenhum método de pagamento cadastrado</p>
                <Button variant="outline">Adicionar Cartão</Button>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Faturas</CardTitle>
                <CardDescription>Suas faturas anteriores</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Nenhuma fatura disponível</p>
              </CardContent>
            </Card>
          </div>

          {/* Available Plans */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <CardDescription>Para pequenas equipes</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-4">$29/mês</p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm">10 agentes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm">1.000 sessões</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm">50 webhooks</span>
                  </li>
                </ul>
                <Button className="w-full">Fazer Upgrade</Button>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <CardDescription>Mais popular</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-4">$99/mês</p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm">50 agentes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm">10.000 sessões</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm">200 webhooks</span>
                  </li>
                </ul>
                <Button className="w-full">Fazer Upgrade</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <CardDescription>Para grandes empresas</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-4">Custom</p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm">Ilimitado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm">Suporte dedicado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm">SLA garantido</span>
                  </li>
                </ul>
                <Button className="w-full bg-transparent" variant="outline">
                  Falar com Vendas
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
