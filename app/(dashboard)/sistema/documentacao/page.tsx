import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileCode, BookOpen, Zap, Shield } from "lucide-react"

export default function DocumentacaoPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Documentação</h1>
        <p className="text-muted-foreground">Guia completo para usar o GroovIA</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Primeiros Passos
            </CardTitle>
            <CardDescription>Como começar a usar a plataforma</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm">
            <ol>
              <li>Crie sua conta e faça login</li>
              <li>Explore os agentes disponíveis</li>
              <li>Inicie uma conversa com um agente</li>
              <li>Envie documentos para análise</li>
              <li>Configure seus próprios agentes</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recursos Principais
            </CardTitle>
            <CardDescription>Funcionalidades da plataforma</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm">
            <ul>
              <li>Agentes de IA especializados</li>
              <li>Análise de documentos</li>
              <li>Conversas contextualizadas</li>
              <li>Base de conhecimento personalizada</li>
              <li>Webhooks e integrações</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              API e Integrações
            </CardTitle>
            <CardDescription>Integre o GroovIA em seus sistemas</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm">
            <p>A API REST do GroovIA permite integrar agentes de IA em suas aplicações.</p>
            <p>Endpoints principais:</p>
            <ul>
              <li>
                <code>/api/agents</code> - Gerenciar agentes
              </li>
              <li>
                <code>/api/agents/[id]/chat</code> - Conversar com agentes
              </li>
              <li>
                <code>/api/webhooks</code> - Configurar webhooks
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>Boas práticas de segurança</CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm">
            <ul>
              <li>Use senhas fortes e únicas</li>
              <li>Não compartilhe suas credenciais</li>
              <li>Revise as permissões dos agentes</li>
              <li>Mantenha seus dados atualizados</li>
              <li>Reporte problemas de segurança</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
