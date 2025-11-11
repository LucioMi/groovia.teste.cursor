# GrooveIA - Plataforma SaaS de Agentes de IA

Sistema completo de gerenciamento de agentes de IA com autenticação, multi-tenancy e painel administrativo.

## Tecnologias Principais

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **Banco de Dados**: Supabase PostgreSQL
- **Autenticação**: Supabase Auth
- **Estilização**: Tailwind CSS v4
- **IA**: OpenAI API
- **Storage**: Vercel Blob
- **Pagamentos**: Stripe (opcional)
- **Deploy**: Vercel

## Início Rápido

### 1. Configure o Banco de Dados

O projeto usa Supabase PostgreSQL. Execute os scripts SQL em ordem:

\`\`\`bash
# No Supabase SQL Editor
# Execute na ordem numérica:
scripts/001_initial_schema.sql
scripts/002_functions_and_triggers.sql
scripts/003_rls_policies.sql
scripts/004_FIX_USER_ROLES_RLS_RECURSION.sql
scripts/005_make_agents_global.sql
# ... continue com todos os scripts
\`\`\`

### 2. Configure Variáveis de Ambiente

Crie um arquivo `.env.local` com as variáveis do Supabase:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://[SEU-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[SUA-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[SUA-SERVICE-ROLE-KEY]
OPENAI_API_KEY=sk-[SUA-OPENAI-KEY]
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

Veja `DEPLOYMENT_GUIDE.md` para lista completa de variáveis.

### 3. Instale as Dependências

\`\`\`bash
pnpm install
\`\`\`

### 4. Inicie o Servidor de Desenvolvimento

\`\`\`bash
pnpm dev
\`\`\`

Acesse: `http://localhost:3000`

### 5. Crie o Primeiro Admin

1. Acesse `http://localhost:3000`
2. Clique em "Criar Conta" e registre-se
3. No Supabase SQL Editor, execute:

\`\`\`sql
-- Busque seu user_id
SELECT id, email FROM auth.users;

-- Torne o usuário um super admin
INSERT INTO user_roles (user_id, role, organization_id)
VALUES ('[SEU-USER-ID]', 'super_admin', NULL);
\`\`\`

## Estrutura do Projeto

\`\`\`
groovia/
├── app/
│   ├── (auth)/           # Rotas de autenticação
│   ├── (dashboard)/      # Área de usuários autenticados
│   └── api/              # API Routes
├── components/           # Componentes React reutilizáveis
├── lib/                  # Bibliotecas e utilitários
└── scripts/              # Scripts SQL para banco de dados
\`\`\`

## Funcionalidades Principais

### Autenticação de Usuários
- Login/Registro via Supabase Auth
- Recuperação de senha
- Sessões seguras
- Sistema de roles (super_admin, admin, member)

### Agentes de IA
- Criação de agentes personalizados
- Chat em tempo real com streaming
- Histórico de conversas
- Exportação de conversas em PDF
- Configuração de prompts do sistema

### Organizações
- Multi-tenancy completo
- Gerenciamento de membros
- Permissões por organização
- Dashboard com estatísticas

### Documentos
- Upload de arquivos
- Armazenamento via Vercel Blob
- Associação com conversas
- Gerenciamento de documentos

### Webhooks
- Sistema de webhooks para eventos
- Configuração de endpoints
- Triggers personalizados

## Scripts Disponíveis

\`\`\`bash
pnpm dev          # Servidor de desenvolvimento
pnpm build        # Build de produção
pnpm start        # Servidor de produção
pnpm lint         # Verificar código
\`\`\`

## Deploy em Produção

### Via v0 (Recomendado)
1. Clique no botão "Publish" no v0
2. Conecte sua conta Vercel
3. Configure as variáveis de ambiente
4. Deploy automático!

### Via Vercel Dashboard
Consulte o guia completo em `DEPLOYMENT_GUIDE.md` para instruções detalhadas.

## Documentação

- [Guia de Deployment Completo](./DEPLOYMENT_GUIDE.md) - Instruções detalhadas de implantação

## Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) no banco
- Tokens seguros e criptografia
- Security headers configurados
- Validação de permissões em todas as rotas

## Suporte

Para problemas ou dúvidas:
1. Consulte `DEPLOYMENT_GUIDE.md`
2. Verifique logs na Vercel e Supabase
3. Consulte a documentação oficial das tecnologias

---

**Versão**: 2.0.0
**Última atualização**: 2025-01-10
