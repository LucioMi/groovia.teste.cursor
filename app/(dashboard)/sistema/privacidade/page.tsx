import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"

export default function PrivacidadePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Política de Privacidade</h1>
        <p className="text-muted-foreground">Como tratamos seus dados e informações</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacidade e Proteção de Dados
          </CardTitle>
          <CardDescription>Última atualização: {new Date().toLocaleDateString("pt-BR")}</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h3>1. Coleta de Dados</h3>
          <p>
            O GroovIA coleta apenas os dados necessários para o funcionamento da plataforma, incluindo informações de
            cadastro, conversas com agentes e documentos enviados.
          </p>

          <h3>2. Uso dos Dados</h3>
          <p>
            Seus dados são utilizados exclusivamente para fornecer os serviços da plataforma, melhorar a experiência do
            usuário e treinar os agentes de IA.
          </p>

          <h3>3. Compartilhamento</h3>
          <p>
            Não compartilhamos seus dados pessoais com terceiros, exceto quando necessário para o funcionamento dos
            serviços (como provedores de IA) ou quando exigido por lei.
          </p>

          <h3>4. Segurança</h3>
          <p>
            Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não
            autorizado, perda ou alteração.
          </p>

          <h3>5. Seus Direitos</h3>
          <p>
            Você tem direito de acessar, corrigir, excluir ou exportar seus dados a qualquer momento através das
            configurações da plataforma.
          </p>

          <h3>6. Cookies</h3>
          <p>
            Utilizamos cookies essenciais para o funcionamento da plataforma e cookies de análise para melhorar nossos
            serviços.
          </p>

          <h3>7. Contato</h3>
          <p>Para questões sobre privacidade, entre em contato através do email: privacidade@groovia.com</p>
        </CardContent>
      </Card>
    </div>
  )
}
