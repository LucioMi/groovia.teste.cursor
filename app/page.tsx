import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CheckIcon,
  ZapIcon,
  ShieldIcon,
  UsersIcon,
  BarChartIcon,
  WebhookIcon,
  ArrowRightIcon,
} from "@/components/icons"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-bold">GrooveIA</h1>
          <nav className="hidden md:flex gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Recursos
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Preços
            </Link>
            <Link href="/docs" className="text-sm font-medium hover:text-primary transition-colors">
              Documentação
            </Link>
          </nav>
          <div className="flex gap-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/signin">Entrar</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="mx-auto max-w-4xl">
            <div className="inline-block mb-4 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
              Plataforma SaaS de Agentes IA
            </div>
            <h2 className="mb-6 text-5xl md:text-6xl font-bold tracking-tight">
              Gerencie seus Agentes de IA com Facilidade
            </h2>
            <p className="mb-8 max-w-2xl mx-auto text-xl text-muted-foreground">
              Plataforma completa para criar, configurar e gerenciar agentes de inteligência artificial. Multi-tenancy,
              webhooks, análises e muito mais.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/auth/signup">
                  Começar Grátis <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/docs">Ver Documentação</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Sem cartão de crédito • Plano gratuito disponível</p>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-4">Recursos Poderosos</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Tudo que você precisa para gerenciar agentes IA em escala
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <Card>
                <CardHeader>
                  <UsersIcon className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Multi-Tenancy</CardTitle>
                  <CardDescription>Organizações isoladas com controle de acesso baseado em roles</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <ZapIcon className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Agentes Personalizados</CardTitle>
                  <CardDescription>Crie agentes IA com instruções customizadas e modelos avançados</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <WebhookIcon className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Webhooks</CardTitle>
                  <CardDescription>Integre com qualquer sistema através de webhooks em tempo real</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <BarChartIcon className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>Dashboard completo com métricas de uso e performance</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <ShieldIcon className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Segurança</CardTitle>
                  <CardDescription>Autenticação robusta e isolamento de dados por organização</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CheckIcon className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>API Completa</CardTitle>
                  <CardDescription>RESTful API para integração com suas aplicações</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-4">Planos Flexíveis</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">Escolha o plano ideal para o seu negócio</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {/* Free Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Free</CardTitle>
                  <CardDescription>Para começar</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm">3 agentes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm">100 sessões/mês</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm">10 webhooks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm">Suporte por email</span>
                    </li>
                  </ul>
                  <Button className="w-full bg-transparent" variant="outline" asChild>
                    <Link href="/auth/signup">Começar Grátis</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Starter Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Starter</CardTitle>
                  <CardDescription>Para pequenas equipes</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$29</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm">10 agentes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm">1.000 sessões/mês</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm">50 webhooks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm">Suporte prioritário</span>
                    </li>
                  </ul>
                  <Button className="w-full" asChild>
                    <Link href="/auth/signup">Começar Agora</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className="border-primary shadow-lg">
                <CardHeader>
                  <div className="inline-block mb-2 px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-medium">
                    POPULAR
                  </div>
                  <CardTitle>Pro</CardTitle>
                  <CardDescription>Para empresas em crescimento</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$99</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm">50 agentes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm">10.000 sessões/mês</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm">200 webhooks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm">Suporte 24/7</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm">Análises avançadas</span>
                    </li>
                  </ul>
                  <Button className="w-full" asChild>
                    <Link href="/auth/signup">Começar Agora</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Enterprise Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <CardDescription>Para grandes empresas</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">Custom</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm">Agentes ilimitados</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm">Sessões ilimitadas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm">Webhooks ilimitados</span>
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
                  <Button className="w-full bg-transparent" variant="outline" asChild>
                    <Link href="/auth/signup">Falar com Vendas</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary text-primary-foreground py-20">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-3xl font-bold mb-4">Pronto para Começar?</h3>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Crie sua conta gratuitamente e comece a construir agentes IA inteligentes em minutos
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/auth/signup">Criar Conta Grátis</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                asChild
              >
                <Link href="/docs">Ver Documentação</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 GrooveIA. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
