import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-2xl font-bold">
            GrooveIA
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/">Voltar</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4">Termos de Serviço</h1>
        <p className="text-muted-foreground mb-8">Última atualização: Janeiro de 2025</p>

        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-3">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground">
              Ao acessar e usar o GrooveIA, você concorda em cumprir e estar vinculado a estes Termos de Serviço. Se
              você não concordar com qualquer parte destes termos, não poderá usar nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground">
              O GrooveIA é uma plataforma SaaS que permite criar, configurar e gerenciar agentes de inteligência
              artificial. Oferecemos recursos de multi-tenancy, webhooks, análises e APIs para integração.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">3. Conta de Usuário</h2>
            <p className="text-muted-foreground mb-2">Ao criar uma conta, você concorda em:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Fornecer informações precisas e completas</li>
              <li>Manter a segurança de sua senha</li>
              <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
              <li>Ser responsável por todas as atividades em sua conta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">4. Uso Aceitável</h2>
            <p className="text-muted-foreground mb-2">Você concorda em NÃO:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Usar o serviço para fins ilegais ou não autorizados</li>
              <li>Violar leis em sua jurisdição</li>
              <li>Transmitir vírus ou código malicioso</li>
              <li>Interferir ou interromper o serviço</li>
              <li>Fazer engenharia reversa do software</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">5. Pagamentos e Reembolsos</h2>
            <p className="text-muted-foreground">
              Os pagamentos são processados mensalmente ou anualmente, conforme o plano escolhido. Não oferecemos
              reembolsos para cancelamentos no meio do período de faturamento, mas você pode continuar usando o serviço
              até o final do período pago.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">6. Propriedade Intelectual</h2>
            <p className="text-muted-foreground">
              O GrooveIA e seu conteúdo original, recursos e funcionalidades são de propriedade exclusiva da empresa e
              são protegidos por leis de direitos autorais, marcas registradas e outras leis de propriedade intelectual.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">7. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground">
              Em nenhuma circunstância o GrooveIA será responsável por quaisquer danos indiretos, incidentais,
              especiais, consequenciais ou punitivos, incluindo perda de lucros, dados, uso ou outros prejuízos
              intangíveis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">8. Modificações dos Termos</h2>
            <p className="text-muted-foreground">
              Reservamo-nos o direito de modificar ou substituir estes Termos a qualquer momento. Se uma revisão for
              material, tentaremos fornecer um aviso com pelo menos 30 dias de antecedência.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">9. Rescisão</h2>
            <p className="text-muted-foreground">
              Podemos encerrar ou suspender sua conta imediatamente, sem aviso prévio ou responsabilidade, por qualquer
              motivo, incluindo, sem limitação, se você violar os Termos de Serviço.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">10. Contato</h2>
            <p className="text-muted-foreground">
              Se você tiver alguma dúvida sobre estes Termos, entre em contato conosco em: legal@grooveia.com
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 GrooveIA. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
