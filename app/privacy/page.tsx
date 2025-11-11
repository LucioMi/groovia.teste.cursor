import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
        <p className="text-muted-foreground mb-8">Última atualização: Janeiro de 2025</p>

        <div className="prose prose-slate max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-3">1. Informações que Coletamos</h2>
            <p className="text-muted-foreground mb-2">Coletamos diferentes tipos de informações:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Informações de Conta:</strong> Nome, email, senha (criptografada) e informações de pagamento
              </li>
              <li>
                <strong>Dados de Uso:</strong> Como você interage com nossos serviços, incluindo logs de acesso e
                preferências
              </li>
              <li>
                <strong>Dados Técnicos:</strong> Endereço IP, tipo de navegador, sistema operacional e identificadores
                de dispositivo
              </li>
              <li>
                <strong>Conteúdo do Usuário:</strong> Agentes criados, conversas e configurações
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">2. Como Usamos Suas Informações</h2>
            <p className="text-muted-foreground mb-2">Usamos suas informações para:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Fornecer, operar e manter nossos serviços</li>
              <li>Melhorar, personalizar e expandir nossos serviços</li>
              <li>Entender e analisar como você usa nossos serviços</li>
              <li>Desenvolver novos produtos, serviços e recursos</li>
              <li>Comunicar com você para suporte ao cliente e atualizações</li>
              <li>Processar transações e enviar informações relacionadas</li>
              <li>Detectar e prevenir fraudes e abusos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">3. Compartilhamento de Informações</h2>
            <p className="text-muted-foreground">
              Não vendemos suas informações pessoais. Podemos compartilhar suas informações apenas nas seguintes
              circunstâncias:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
              <li>Com seu consentimento explícito</li>
              <li>Com provedores de serviços que nos ajudam a operar nosso negócio</li>
              <li>Para cumprir obrigações legais</li>
              <li>Para proteger nossos direitos e propriedade</li>
              <li>Em caso de fusão, aquisição ou venda de ativos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">4. Segurança dos Dados</h2>
            <p className="text-muted-foreground">
              Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger suas informações
              pessoais contra acesso não autorizado, alteração, divulgação ou destruição. Isso inclui:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
              <li>Criptografia de dados em trânsito e em repouso</li>
              <li>Controles de acesso rigorosos</li>
              <li>Auditorias de segurança regulares</li>
              <li>Treinamento de funcionários em práticas de segurança</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">5. Seus Direitos</h2>
            <p className="text-muted-foreground mb-2">Você tem o direito de:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Acessar suas informações pessoais</li>
              <li>Corrigir informações imprecisas</li>
              <li>Solicitar a exclusão de suas informações</li>
              <li>Opor-se ao processamento de suas informações</li>
              <li>Solicitar a portabilidade de seus dados</li>
              <li>Retirar o consentimento a qualquer momento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">6. Cookies e Tecnologias Similares</h2>
            <p className="text-muted-foreground">
              Usamos cookies e tecnologias similares para melhorar sua experiência, analisar tendências, administrar o
              site e coletar informações demográficas. Você pode controlar o uso de cookies nas configurações do seu
              navegador.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">7. Retenção de Dados</h2>
            <p className="text-muted-foreground">
              Retemos suas informações pessoais apenas pelo tempo necessário para cumprir os propósitos descritos nesta
              política, a menos que um período de retenção mais longo seja exigido ou permitido por lei.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">8. Transferências Internacionais</h2>
            <p className="text-muted-foreground">
              Suas informações podem ser transferidas e mantidas em computadores localizados fora do seu estado,
              província, país ou outra jurisdição governamental onde as leis de proteção de dados podem diferir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">9. Privacidade de Crianças</h2>
            <p className="text-muted-foreground">
              Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente informações
              pessoais de crianças. Se você é pai ou responsável e está ciente de que seu filho nos forneceu informações
              pessoais, entre em contato conosco.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">10. Alterações nesta Política</h2>
            <p className="text-muted-foreground">
              Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos você sobre quaisquer
              alterações publicando a nova Política de Privacidade nesta página e atualizando a data de "última
              atualização".
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">11. Contato</h2>
            <p className="text-muted-foreground">
              Se você tiver dúvidas sobre esta Política de Privacidade, entre em contato conosco:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
              <li>Email: privacy@grooveia.com</li>
              <li>Endereço: São Paulo, SP, Brasil</li>
            </ul>
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
