# 📚 Contexto do Projeto Groovia

Este documento serve como referência completa de tudo que foi desenvolvido, problemas encontrados e resolvidos, e informações úteis para continuidade do projeto.

---

## 🎯 Visão Geral do Projeto

**Groovia** (anteriormente GrooveIA) é uma plataforma SaaS completa de gerenciamento de agentes de IA com autenticação, multi-tenancy e painel administrativo.

### Tecnologias Principais

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **Banco de Dados**: Supabase PostgreSQL
- **Autenticação**: Supabase Auth
- **Estilização**: Tailwind CSS v4
- **IA**: OpenAI API (com suporte a Vercel AI Gateway)
- **Storage**: Vercel Blob
- **Pagamentos**: Stripe (opcional)
- **Deploy**: Vercel
- **Package Manager**: pnpm

### Repositório GitHub

- URL: `https://github.com/LucioMi/groovia.teste.cursor.git`
- Branch principal: `main`

---

## 🏗️ Arquitetura do Sistema

### Estrutura de Autenticação

#### Usuários (Supabase Auth)
- Usuários são gerenciados automaticamente pelo Supabase Auth (`auth.users`)
- Não há tabela de users manual - tudo é gerenciado pelo Supabase

#### Multi-Tenancy
```
USUÁRIO (auth.users)
    ↓
organization_memberships (pode ter várias)
    ↓
ORGANIZAÇÕES (organizations)
```

**Características:**
- Um usuário pode ter múltiplas organizações
- Cada organização tem roles: `owner`, `admin`, `member`, `viewer`
- Organização selecionada é armazenada em `user_preferences.selected_organization_id`
- Sistema de preferências permite trocar entre organizações

#### Super Admins (Separado)
- Tabela `admin_users` para super admins da PLATAFORMA
- Tabela `admin_sessions` para sessões dos admins
- Não tem relação com `auth.users` do Supabase
- Gerenciam a plataforma inteira, não organizações específicas
- Painel admin em `/admin/*`

### Fluxo de Jornada Scan

A "Jornada Scan" é a funcionalidade principal do sistema. Consiste em uma jornada de 6 etapas:

1. **Etapa 1: SCAN** (Agente Conversacional)
   - Conduz entrevista guiada para revelar o DNA da empresa
   - Faz perguntas sobre missão, visão, valores, público-alvo

2. **Etapa 2: SCAN Clarity** (Documento Manual)
   - Template para preenchimento pela equipe de liderança
   - Upload manual de documento preenchido
   - Tipo: `document`

3. **Etapa 3: Mercado ICP** (Agente Autônomo)
   - Analisa mercado e ICP (Ideal Customer Profile)
   - Tipo: `autonomous` (execução automática)
   - Depende da Etapa 1

4. **Etapa 4: Persona** (Agente Conversacional/Autônomo)
   - Cria personas detalhadas
   - Depende das Etapas 1, 2, 3

5. **Etapa 5: Sintetizador** (Agente Autônomo/Sintético)
   - Sintetiza informações de etapas anteriores
   - Tipo: `synthetic`
   - Depende da Etapa 2

6. **Etapa 6: GROOVIA INTELLIGENCE** (Agente Final)
   - Agente final que consolida todas as informações
   - Depende de todas as etapas anteriores (1, 2, 3, 4, 5)

### Dependências entre Etapas

```
Etapa 1 (SCAN)
    ↓
    ├──→ Etapa 2 (SCAN Clarity) - depende de 1
    ├──→ Etapa 3 (Mercado ICP) - depende de 1
    │
    ↓
Etapa 4 (Persona) - depende de 1, 2, 3
    ↑
Etapa 2 (SCAN Clarity)
    ↓
Etapa 5 (Sintetizador) - depende de 2
    │
    ↓
Etapa 6 (GROOVIA INTELLIGENCE) - depende de 1, 2, 3, 4, 5
```

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### Organizações e Usuários
- `organizations` - Organizações/empresas
- `organization_memberships` - Relação usuário-organização (multi-tenancy)
- `user_preferences` - Preferências do usuário (organização selecionada, etc.)
- `user_roles` - Roles dos usuários (super_admin, admin, member, viewer)

#### Agentes e Conversas
- `agents` - Agentes de IA configurados
  - Campos importantes: `category`, `is_passive`, `next_agent_id`, `openai_assistant_id`
  - Agentes globais têm `organization_id = NULL`
  - Categoria "Jornada Scan" para agentes da jornada
  
- `conversations` - Conversas com agentes
- `messages` - Mensagens das conversas
- `knowledge_bases` - Bases de conhecimento

#### Jornada Scan
- `scans` - Jornadas scan iniciadas
  - Status: `in_progress`, `completed`, `cancelled`
  - Vinculado a uma organização
  
- `scan_steps` - Etapas da jornada scan
  - Campos importantes:
    - `step_type`: `agent`, `document`, `autonomous`, `synthetic`
    - `depends_on_step_ids`: Array de IDs das etapas dependentes
    - `input_document_ids`: Array de IDs dos documentos de entrada
    - `output_document_id`: ID do documento gerado
    - `manual_document_uploaded`: Boolean indicando se documento manual foi enviado
    - `auto_execute`: Boolean indicando execução automática
    - `agent_id`: ID do agente (opcional, null para etapas de documento)
    - `status`: `pending`, `in_progress`, `completed`, `approved`
  
- `scan_step_documents` - Vincula documentos a etapas
  - Tipos: `input`, `output`, `template`, `manual_upload`

#### Documentos
- `documents` - Documentos gerados/uploadados
  - Campos: `file_url`, `file_type`, `file_size`, `organization_id`
  - Vinculados a conversas, agentes e scan_steps

#### Assinaturas e Pagamentos
- `subscription_plans` - Planos de assinatura (Free, Starter, Pro, Enterprise)
- `organization_subscriptions` - Assinaturas das organizações
- `payments` - Registro de pagamentos

#### Webhooks e Logs
- `webhooks` - Configuração de webhooks
- `webhook_logs` - Logs de webhooks
- `ai_gateway_logs` - Logs do Vercel AI Gateway
- `audit_logs` - Log de auditoria de ações

#### Admin
- `admin_users` - Super admins da plataforma
- `admin_sessions` - Sessões dos admins

### Scripts SQL Principais

1. **`scripts/000_COMPLETE_SCHEMA_V2.sql`**
   - Schema completo do banco de dados
   - Cria todas as tabelas, índices, triggers, funções e RLS policies
   - Execute este script primeiro ao configurar o banco

2. **`scripts/014_CREATE_SCAN_JOURNEY_AGENTS.sql`**
   - Cria os 5 agentes da jornada scan
   - Configura `next_agent_id` para vincular agentes em sequência
   - Define `is_passive` corretamente para cada agente
   - Define `category = "Jornada Scan"`

### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado com políticas específicas:
- Usuários só podem acessar dados de suas organizações
- Super admins têm acesso total
- Service role (backend) tem acesso completo
- Políticas configuradas para evitar recursão infinita

---

## 🚀 Deploy e Configuração

### Variáveis de Ambiente

#### Supabase (Obrigatórias)
```env
NEXT_PUBLIC_SUPABASE_URL=https://[SEU-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[SUA-ANON-KEY]
SUPABASE_ANON_KEY=[SUA-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[SUA-SERVICE-ROLE-KEY]
```

#### OpenAI (Obrigatória)
```env
OPENAI_API_KEY=sk-[SUA-OPENAI-KEY]
```

#### Vercel AI Gateway (Opcional, Recomendado)
```env
OPENAI_GATEWAY_URL=https://ai-gateway.vercel.sh/v1
GATEWAY_API_KEY=vck_[SUA-GATEWAY-KEY]
```

#### Aplicação
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000  # ou https://seu-dominio.vercel.app
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

#### Stripe (Opcional)
```env
STRIPE_SECRET_KEY=sk_test_[SUA-STRIPE-KEY]
STRIPE_WEBHOOK_SECRET=whsec_[SUA-WEBHOOK-SECRET]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_[SUA-STRIPE-PUBLIC-KEY]
```

#### Admin (Opcional)
```env
DISABLE_ADMIN_AUTH=false  # true para desabilitar auth admin em desenvolvimento
```

### Deploy na Vercel

1. **Conectar Repositório**
   - Conecte o repositório GitHub na Vercel
   - Repositório: `groovia.teste.cursor`

2. **Configurar Variáveis de Ambiente**
   - Adicione todas as variáveis obrigatórias
   - Configure para Production, Preview e Development

3. **Build Settings**
   - Framework: Next.js
   - Build Command: `pnpm build` (automático)
   - Output Directory: `.next` (automático)
   - Install Command: `pnpm install` (automático)

4. **Redeploy**
   - Após adicionar variáveis, faça redeploy
   - Verifique logs de build e runtime

### Configuração do Banco de Dados

1. **Criar Projeto no Supabase**
   - Acesse https://supabase.com
   - Crie novo projeto
   - Aguarde criação (2-3 minutos)

2. **Executar Scripts SQL**
   - Execute `scripts/000_COMPLETE_SCHEMA_V2.sql` no SQL Editor
   - Execute `scripts/014_CREATE_SCAN_JOURNEY_AGENTS.sql` para criar agentes
   - Verifique se todas as tabelas foram criadas

3. **Configurar SMTP (Opcional)**
   - Configure SMTP no Supabase para envio de emails
   - Settings → Auth → SMTP Settings
   - Configure servidor SMTP (Gmail, SendGrid, etc.)

### Configuração do Vercel AI Gateway

1. **Criar Gateway**
   - Acesse Vercel Dashboard → AI Gateway
   - Clique em "Create Gateway"
   - Copie Gateway ID e API Key

2. **Configurar Variáveis**
   - Adicione `OPENAI_GATEWAY_URL` e `GATEWAY_API_KEY`
   - Gateway funciona como proxy para OpenAI API
   - Fornece cache, rate limiting e observabilidade

---

## 🐛 Problemas Encontrados e Resolvidos

### 1. Erro de Build no Vercel - Stripe

**Problema**: Build falhava com erro "Neither apiKey nor config.authenticator provided" no Stripe.

**Causa**: Stripe estava sendo inicializado durante o build sem variáveis de ambiente.

**Solução**:
- Modificado `lib/stripe.ts` e `lib/stripe-server.ts` para inicialização condicional
- Se `STRIPE_SECRET_KEY` não estiver definido, usa chave dummy apenas para build
- Adicionada verificação em `app/api/webhooks/stripe/route.ts` para retornar 503 se Stripe não estiver configurado

**Arquivos Modificados**:
- `lib/stripe.ts`
- `lib/stripe-server.ts`
- `app/api/webhooks/stripe/route.ts`

### 2. Jornada Scan Mostrando "Jornada Concluída" Incorretamente

**Problema**: Página da jornada scan mostrava "Jornada Concluída!" mesmo quando não havia etapas carregadas ou completas.

**Causa**: 
- Condição `steps.every((s) => s.completed)` retornava `true` para array vazio
- API de progresso tentava usar tabela `journey_progress` que não existia

**Solução**:
- Modificada condição para `steps.length > 0 && steps.every((s) => s.completed)`
- Refatorada API `/api/journey/progress` para buscar de `scans` e `scan_steps`
- API agora retorna `scanSteps` (todas as etapas) e `completedSteps` (etapas completas)

**Arquivos Modificados**:
- `app/(dashboard)/dashboard/jornada-scan/page.tsx`
- `app/api/journey/progress/route.ts`

### 3. Etapas da Jornada Scan Não Aparecendo

**Problema**: Após criar agentes, as etapas não apareciam na página da jornada scan.

**Causas Identificadas**:
1. Etapa "SCAN Clarity" (documento manual) não estava sendo criada
2. Agentes não estavam sendo filtrados por categoria "Jornada Scan"
3. Scan não estava sendo criado automaticamente quando necessário

**Solução**:
- Modificado `app/api/scans/route.ts` para:
  - Filtrar agentes por `category = "Jornada Scan"`
  - Criar explicitamente a etapa "SCAN Clarity" como `step_order: 2` com `step_type: "document"`
  - Configurar corretamente `depends_on_step_ids` para todas as etapas
- Modificado `app/(dashboard)/dashboard/jornada-scan/page.tsx` para:
  - Filtrar agentes por categoria "Jornada Scan"
  - Criar scan automaticamente se não houver scan ativo mas houver agentes
  - Construir etapas a partir de `scanSteps` retornados pela API
  - Tratar diferentes tipos de etapa (agent, document, autonomous, synthetic)

**Arquivos Modificados**:
- `app/api/scans/route.ts`
- `app/(dashboard)/dashboard/jornada-scan/page.tsx`
- `app/api/journey/progress/route.ts`

### 4. Documentos Não Aparecendo na Área "Empresa"

**Problema**: Documentos gerados/uploadados não apareciam na área "Empresa".

**Causa**: 
- API `/api/documents/list` estava buscando de `knowledge_bases` em vez de `documents`
- Documentos gerados não estavam sendo vinculados a `scan_steps`

**Solução**:
- Corrigido `app/api/documents/list/route.ts` para buscar de `documents` table
- Adicionado filtro por `organization_id`
- Modificado `app/api/agents/[id]/generate-document/route.tsx` para:
  - Vincular documento a `scan_step.output_document_id`
  - Criar entrada em `scan_step_documents` com tipo "output"

**Arquivos Modificados**:
- `app/api/documents/list/route.ts`
- `app/api/agents/[id]/generate-document/route.tsx`

### 5. Email de Confirmação Não Sendo Enviado

**Problema**: Usuários não recebiam email de confirmação após signup.

**Causa**: `supabaseAdmin.auth.admin.generateLink()` apenas gera link, não envia email automaticamente.

**Soluções Propostas**:
1. **Configurar SMTP no Supabase** (Recomendado)
   - Settings → Auth → SMTP Settings
   - Configurar servidor SMTP (Gmail, SendGrid, etc.)
   - Supabase enviará emails automaticamente

2. **Usar `inviteUserByEmail()`**
   - Envia email de convite automaticamente
   - Requer SMTP configurado

**Arquivos Relacionados**:
- `app/api/auth/signup/route.ts`
- Documentação: `docs/database/SUPABASE_AUTH_PRONTO.md`

### 6. Rotas Duplicadas de Agentes

**Problema**: Havia duas pastas com rotas de agentes:
- `app/(dashboard)/agentes/` → `/agentes`
- `app/(dashboard)/dashboard/agentes/` → `/dashboard/agentes`

**Causa**: Código usava `/dashboard/agentes` mas havia pasta duplicada.

**Solução**:
- Removida pasta `app/(dashboard)/agentes/`
- Mantida apenas `app/(dashboard)/dashboard/agentes/`
- Corrigidas referências em:
  - `components/agent-card.tsx` → `/dashboard/agentes`
  - `middleware.ts` → `/dashboard/agentes`

**Arquivos Modificados**:
- `components/agent-card.tsx`
- `middleware.ts`
- Removidos: `app/(dashboard)/agentes/*`

### 7. Organização do Projeto

**Problema**: Muitos arquivos de documentação na raiz, scripts SQL obsoletos, estrutura desorganizada.

**Solução**:
- Criada estrutura organizada:
  - `docs/deployment/` - Guias de deploy
  - `docs/database/` - Documentação do banco
  - `docs/guides/` - Guias gerais
  - `docs/archive/` - Documentação obsoleta
  - `scripts/archive/` - Scripts SQL obsoletos
- Movidos arquivos para pastas apropriadas
- Atualizado `README.md` com nova estrutura
- Criado `ORGANIZACAO_PROJETO.md` com resumo das mudanças

---

## 📁 Estrutura de Pastas do Projeto

```
groovia/
├── app/
│   ├── (auth)/              # Rotas de autenticação
│   │   ├── signin/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── (dashboard)/         # Área de usuários autenticados
│   │   ├── dashboard/
│   │   │   ├── agentes/     # Lista e chat de agentes
│   │   │   ├── jornada-scan/ # Jornada scan (principal)
│   │   │   ├── documentos/  # Documentos
│   │   │   ├── empresa/     # Área da empresa
│   │   │   └── ...
│   │   └── perfil/
│   ├── admin/               # Painel administrativo
│   │   ├── agents/
│   │   ├── users/
│   │   ├── organizations/
│   │   └── ...
│   └── api/                 # API Routes
│       ├── auth/            # Autenticação
│       ├── agents/          # Agentes
│       ├── journey/         # Jornada scan
│       ├── scans/           # Scans
│       ├── documents/       # Documentos
│       └── ...
├── components/              # Componentes React
│   ├── ui/                  # Componentes UI (shadcn/ui)
│   ├── agent-card.tsx
│   ├── agent-chat.tsx
│   ├── sidebar.tsx
│   └── ...
├── lib/                     # Bibliotecas e utilitários
│   ├── supabase/           # Clientes Supabase
│   ├── openai-client.ts    # Cliente OpenAI
│   ├── openai-gateway.ts   # Cliente Vercel AI Gateway
│   ├── stripe.ts           # Cliente Stripe
│   └── ...
├── scripts/                 # Scripts SQL
│   ├── 000_COMPLETE_SCHEMA_V2.sql
│   ├── 014_CREATE_SCAN_JOURNEY_AGENTS.sql
│   └── archive/            # Scripts obsoletos
├── docs/                    # Documentação
│   ├── deployment/         # Guias de deploy
│   ├── database/           # Documentação do banco
│   ├── guides/             # Guias gerais
│   └── archive/            # Documentação obsoleta
├── public/                  # Arquivos estáticos
├── README.md               # Documentação principal
├── DEPLOYMENT_GUIDE.md     # Guia de deploy
├── ORGANIZACAO_PROJETO.md  # Resumo da organização
├── contexto.md             # Este arquivo
└── package.json
```

---

## 🔧 Comandos Úteis

### Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Iniciar servidor de desenvolvimento
pnpm dev

# Build de produção
pnpm build

# Iniciar servidor de produção
pnpm start

# Verificar código
pnpm lint
```

### Git

```bash
# Ver status
git status

# Adicionar arquivos
git add .

# Commit
git commit -m "mensagem"

# Push
git push origin main
```

### Supabase

```bash
# Verificar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

# Verificar agentes da jornada scan
SELECT id, name, category, is_passive, next_agent_id
FROM agents
WHERE category = 'Jornada Scan'
ORDER BY created_at;

# Verificar scans ativos
SELECT id, organization_id, status, created_at
FROM scans
WHERE status = 'in_progress';

# Verificar etapas de um scan
SELECT id, scan_id, step_order, step_type, status, agent_id
FROM scan_steps
WHERE scan_id = '[SCAN_ID]'
ORDER BY step_order;
```

---

## 📝 Notas Importantes

### Jornada Scan

1. **Agentes devem ter `category = "Jornada Scan"`**
   - Apenas agentes com esta categoria são usados na jornada
   - Agentes globais têm `organization_id = NULL`

2. **Etapas são criadas automaticamente quando scan é iniciado**
   - Scan é criado automaticamente se não houver scan ativo
   - Etapas seguem a ordem definida pelos agentes e dependências

3. **Tipos de Etapa**:
   - `agent`: Etapa conversacional com agente
   - `document`: Etapa de documento manual (upload)
   - `autonomous`: Etapa autônoma (execução automática)
   - `synthetic`: Etapa sintética (processamento automático)

4. **Dependências entre Etapas**:
   - Etapas têm `depends_on_step_ids` que definem dependências
   - Etapas dependentes só podem ser iniciadas quando dependências estiverem completas
   - Status `locked` é calculado baseado em dependências

### Autenticação

1. **Usuários normais** usam Supabase Auth
   - Signup em `/auth/signup`
   - Signin em `/auth/signin`
   - Sessões gerenciadas pelo Supabase

2. **Super admins** usam sistema separado
   - Tabela `admin_users` (não relacionada ao Supabase Auth)
   - Login em `/admin/login`
   - Setup em `/admin/setup`

3. **Multi-tenancy**:
   - Usuários podem ter múltiplas organizações
   - Organização selecionada em `user_preferences.selected_organization_id`
   - Roles por organização: `owner`, `admin`, `member`, `viewer`

### Documentos

1. **Documentos são armazenados no Vercel Blob**
   - URL em `documents.file_url`
   - Tipo em `documents.file_type`
   - Tamanho em `documents.file_size`

2. **Documentos podem ser vinculados a**:
   - Conversas (`conversation_id`)
   - Agentes (`agent_id`)
   - Scan Steps (`scan_step.output_document_id`)
   - Organizações (`organization_id`)

3. **Tipos de documento em scan_steps**:
   - `input`: Documento de entrada
   - `output`: Documento gerado
   - `template`: Template de documento
   - `manual_upload`: Documento enviado manualmente

### Vercel AI Gateway

1. **Gateway funciona como proxy para OpenAI**
   - Fornece cache, rate limiting e observabilidade
   - Configurado via `OPENAI_GATEWAY_URL` e `GATEWAY_API_KEY`
   - Fallback para OpenAI direto se gateway não configurado

2. **Logs são armazenados no Supabase**
   - Tabela `ai_gateway_logs`
   - Registra todas as chamadas ao gateway

### Stripe

1. **Stripe é opcional**
   - Inicialização condicional para evitar erros de build
   - Se não configurado, retorna 503 em webhooks
   - Configurar apenas se necessário

---

## 🔗 Links Úteis

### Documentação

- **README.md** - Documentação principal do projeto
- **DEPLOYMENT_GUIDE.md** - Guia completo de deploy
- **docs/deployment/** - Guias de deploy detalhados
- **docs/database/** - Documentação do banco de dados
- **docs/guides/** - Guias gerais
- **ORGANIZACAO_PROJETO.md** - Resumo da organização do projeto

### APIs e Serviços

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **OpenAI Platform**: https://platform.openai.com
- **Stripe Dashboard**: https://dashboard.stripe.com

### Rotas Importantes

- `/dashboard` - Dashboard principal
- `/dashboard/jornada-scan` - Jornada scan (funcionalidade principal)
- `/dashboard/agentes` - Lista de agentes
- `/dashboard/agentes/[id]` - Chat com agente
- `/dashboard/documentos` - Documentos
- `/dashboard/empresa` - Área da empresa
- `/admin` - Painel administrativo
- `/admin/agents` - Gerenciar agentes
- `/admin/users` - Gerenciar usuários
- `/admin/organizations` - Gerenciar organizações

---

## 🚨 Troubleshooting

### Problema: Jornada Scan não mostra etapas

**Soluções**:
1. Verificar se agentes foram criados com `category = "Jornada Scan"`
2. Verificar se scan foi criado (tabela `scans` com `status = "in_progress"`)
3. Verificar se `scan_steps` foram criados para o scan
4. Verificar console do navegador para erros
5. Verificar logs da API `/api/journey/progress`

### Problema: Documentos não aparecem

**Soluções**:
1. Verificar se documentos foram salvos em `documents` table
2. Verificar se `organization_id` está correto
3. Verificar API `/api/documents/list` retorna documentos
4. Verificar se documentos têm `file_url` configurado

### Problema: Agentes não aparecem

**Soluções**:
1. Verificar se agentes foram criados no banco
2. Verificar se agentes têm `category` correto
3. Verificar API `/api/agents` retorna agentes
4. Verificar se usuário tem organização selecionada

### Problema: Erro de autenticação

**Soluções**:
1. Verificar variáveis de ambiente do Supabase
2. Verificar se usuário existe em `auth.users`
3. Verificar se organização foi criada
4. Verificar se `user_preferences.selected_organization_id` está configurado
5. Verificar logs do Supabase Auth

---

## 📊 Status Atual do Projeto

### ✅ Funcionalidades Implementadas

- [x] Autenticação com Supabase Auth
- [x] Multi-tenancy completo
- [x] Sistema de agentes de IA
- [x] Jornada Scan com 6 etapas
- [x] Chat em tempo real com agentes
- [x] Gerenciamento de documentos
- [x] Integração com OpenAI
- [x] Integração com Vercel AI Gateway
- [x] Painel administrativo
- [x] Sistema de roles e permissões
- [x] Deploy na Vercel
- [x] Organização completa do projeto

### 🔄 Funcionalidades em Desenvolvimento

- [ ] Upload de documento manual na etapa "SCAN Clarity"
- [ ] Execução automática de agentes autônomos
- [ ] Geração de documentos em etapas autônomas
- [ ] Configuração completa de SMTP
- [ ] Integração completa com Stripe

### 📋 Próximos Passos

1. Implementar upload de documento manual na etapa "SCAN Clarity"
2. Implementar execução automática de agentes autônomos
3. Testar fluxo completo da jornada scan
4. Configurar SMTP para envio de emails
5. Adicionar mais testes e validações
6. Melhorar tratamento de erros
7. Adicionar mais documentação

---

## 📞 Contato e Suporte

### Repositório
- GitHub: `https://github.com/LucioMi/groovia.teste.cursor.git`

### Documentação
- Consulte `docs/` para documentação detalhada
- Consulte `README.md` para visão geral
- Consulte `DEPLOYMENT_GUIDE.md` para deploy

### Logs e Debug
- Vercel: Dashboard → Deployments → Logs
- Supabase: Dashboard → Logs → Postgres Logs
- Console do navegador: F12 → Console

---

**Última atualização**: 2025-01-11
**Versão do projeto**: 2.0.0
**Status**: Em desenvolvimento ativo

