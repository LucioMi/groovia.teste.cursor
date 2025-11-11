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

O projeto usa Supabase PostgreSQL. Execute o script SQL completo:

\`\`\`bash
# No Supabase SQL Editor
# Execute o schema completo:
scripts/000_COMPLETE_SCHEMA_V2.sql

# Depois, crie os agentes da jornada scan:
scripts/014_CREATE_SCAN_JOURNEY_AGENTS.sql
\`\`\`

Veja a documentação completa em `docs/database/CRIAR_BANCO_DADOS_COMPLETO.md`

### 2. Configure Variáveis de Ambiente

Crie um arquivo `.env.local` com as variáveis do Supabase:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=https://[SEU-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[SUA-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[SUA-SERVICE-ROLE-KEY]
OPENAI_API_KEY=sk-[SUA-OPENAI-KEY]
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

Veja `DEPLOYMENT_GUIDE.md` ou `docs/deployment/` para lista completa de variáveis e guias de deploy.

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
├── scripts/              # Scripts SQL para banco de dados
│   ├── 000_COMPLETE_SCHEMA_V2.sql  # Schema completo do banco
│   ├── 014_CREATE_SCAN_JOURNEY_AGENTS.sql  # Agentes da jornada scan
│   └── archive/          # Scripts obsoletos (mantidos para histórico)
└── docs/                 # Documentação organizada
    ├── deployment/       # Guias de deploy
    ├── database/         # Documentação do banco de dados
    ├── guides/           # Guias gerais
    └── archive/          # Documentação obsoleta
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

Consulte os guias de deploy em `docs/deployment/`:
- [Guia Completo de Deployment](./DEPLOYMENT_GUIDE.md) - Instruções detalhadas
- [Deploy na Vercel](./docs/deployment/DEPLOY_VERCEL.md) - Guia passo a passo
- [Início Rápido](./docs/deployment/INICIO_RAPIDO_DEPLOY.md) - Resumo rápido

## Documentação

### Deploy
- [Guia Completo de Deployment](./DEPLOYMENT_GUIDE.md) - Instruções detalhadas de implantação
- [Deploy na Vercel](./docs/deployment/DEPLOY_VERCEL.md) - Passo a passo para deploy na Vercel
- [Início Rápido](./docs/deployment/INICIO_RAPIDO_DEPLOY.md) - Resumo rápido de deploy

### Banco de Dados
- [Criar Banco de Dados Completo](./docs/database/CRIAR_BANCO_DADOS_COMPLETO.md) - Guia completo de configuração
- [Criar Agentes da Jornada Scan](./docs/database/CRIAR_AGENTES_JORNADA_SCAN.md) - Como criar agentes
- [Resumo de Mudanças no Banco](./docs/database/RESUMO_MUDANCAS_BANCO.md) - Mudanças no schema

### Guias Gerais
- [Guia de Setup do Admin](./docs/guides/ADMIN_SETUP_GUIDE.md) - Configuração do painel admin
- [FAQ Modo Preview](./docs/guides/FAQ_MODO_PREVIEW.md) - Perguntas frequentes
- [Acesso Rápido](./docs/guides/README_ACESSO_RAPIDO.md) - Links rápidos

### OpenAI e Integrações
- [Setup OpenAI](./docs/OPENAI_SETUP.md) - Configuração da OpenAI
- [OpenAI Assistants](./docs/OPENAI_ASSISTANTS.md) - Uso de Assistants
- [Vercel AI Gateway](./docs/VERCEL_AI_GATEWAY_INTEGRATION.md) - Integração com AI Gateway

### Autenticação Admin
- [Autenticação Admin](./docs/ADMIN_AUTH.md) - Sistema de autenticação
- [Quickstart Admin Auth](./docs/ADMIN_AUTH_QUICKSTART.md) - Início rápido

## Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) no banco
- Tokens seguros e criptografia
- Security headers configurados
- Validação de permissões em todas as rotas

## Suporte

Para problemas ou dúvidas:
1. Consulte a documentação em `docs/`
2. Verifique logs na Vercel e Supabase
3. Consulte a documentação oficial das tecnologias

## Scripts SQL

### Scripts Principais
- `scripts/000_COMPLETE_SCHEMA_V2.sql` - Schema completo do banco de dados (execute este primeiro)
- `scripts/014_CREATE_SCAN_JOURNEY_AGENTS.sql` - Cria os agentes da jornada scan

### Scripts Arquivados
Scripts antigos foram movidos para `scripts/archive/` pois foram consolidados no schema completo. Eles são mantidos apenas para histórico.

---

**Versão**: 2.0.0
**Última atualização**: 2025-01-11
