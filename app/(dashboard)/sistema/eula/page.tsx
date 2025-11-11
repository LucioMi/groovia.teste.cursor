import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Scale } from "lucide-react"

export default function EulaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Termos de Uso (EULA)</h1>
        <p className="text-muted-foreground">Acordo de licença de usuário final</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            End User License Agreement
          </CardTitle>
          <CardDescription>Última atualização: {new Date().toLocaleDateString("pt-BR")}</CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <h3>1. Aceitação dos Termos</h3>
          <p>
            Ao acessar e usar o GroovIA, você concorda com estes termos de uso. Se não concordar, não use a plataforma.
          </p>

          <h3>2. Licença de Uso</h3>
          <p>
            Concedemos a você uma licença limitada, não exclusiva e não transferível para usar o GroovIA de acordo com
            estes termos.
          </p>

          <h3>3. Restrições de Uso</h3>
          <p>Você não pode:</p>
          <ul>
            <li>Usar a plataforma para fins ilegais ou não autorizados</li>
            <li>Tentar acessar áreas restritas do sistema</li>
            <li>Interferir no funcionamento da plataforma</li>
            <li>Copiar, modificar ou distribuir o software</li>
            <li>Fazer engenharia reversa do sistema</li>
          </ul>

          <h3>4. Propriedade Intelectual</h3>
          <p>
            Todo o conteúdo, código e design do GroovIA são protegidos por direitos autorais e outras leis de
            propriedade intelectual.
          </p>

          <h3>5. Conteúdo do Usuário</h3>
          <p>
            Você mantém os direitos sobre o conteúdo que envia, mas nos concede uma licença para processar e armazenar
            esse conteúdo para fornecer os serviços.
          </p>

          <h3>6. Limitação de Responsabilidade</h3>
          <p>
            O GroovIA é fornecido "como está". Não garantimos que o serviço será ininterrupto ou livre de erros. Não nos
            responsabilizamos por danos indiretos ou consequenciais.
          </p>

          <h3>7. Modificações</h3>
          <p>
            Reservamos o direito de modificar estes termos a qualquer momento. Mudanças significativas serão comunicadas
            aos usuários.
          </p>

          <h3>8. Rescisão</h3>
          <p>
            Podemos suspender ou encerrar sua conta se você violar estes termos. Você pode encerrar sua conta a qualquer
            momento.
          </p>

          <h3>9. Lei Aplicável</h3>
          <p>Estes termos são regidos pelas leis brasileiras.</p>

          <h3>10. Contato</h3>
          <p>Para questões sobre estes termos, entre em contato: legal@groovia.com</p>
        </CardContent>
      </Card>
    </div>
  )
}
