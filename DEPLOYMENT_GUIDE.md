# Guia de Implantação - GrooveIA Platform

## Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Ambiente](#configuração-do-ambiente)
3. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
4. [Configuração das Integrações](#configuração-das-integrações)
5. [Desenvolvimento Local](#desenvolvimento-local)
6. [Implantação em Produção](#implantação-em-produção)
7. [Verificação e Testes](#verificação-e-testes)
8. [Solução de Problemas](#solução-de-problemas)

---

## Pré-requisitos

### Ferramentas Necessárias
- **Node.js**: v18.17.0 ou superior
- **pnpm**: v9.x ou v10.x
- **Conta Vercel**: Para deploy e hospedagem
- **Conta Supabase**: Para banco de dados PostgreSQL
- **Conta Stripe**: Para processamento de pagamentos (opcional)

### Verificar Instalações
\`\`\`bash
node --version  # Deve retornar v18.17.0+
pnpm --version  # Deve retornar 9.x ou 10.x
\`\`\`

---

## Configuração do Ambiente

### 1. Obter o Código

O código está disponível no workspace v0. Você pode baixá-lo ou fazer o deploy diretamente pela interface do v0.

### 2. Instalar Dependências
\`\`\`bash
pnpm install
\`\`\`

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[SEU-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[SUA-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[SUA-SERVICE-ROLE-KEY]
SUPABASE_JWT_SECRET=[SEU-JWT-SECRET]

# Database URLs (Supabase)
SUPABASE_POSTGRES_URL=[URL-POSTGRES]
SUPABASE_POSTGRES_PRISMA_URL=[URL-PRISMA]
SUPABASE_POSTGRES_URL_NON_POOLING=[URL-NON-POOLING]
SUPABASE_POSTGRES_USER=[USUARIO]
SUPABASE_POSTGRES_PASSWORD=[SENHA]
SUPABASE_POSTGRES_DATABASE=[NOME-DB]
SUPABASE_POSTGRES_HOST=[HOST]

# Stripe Configuration (Opcional)
STRIPE_SECRET_KEY=sk_test_[SUA-SECRET-KEY]
STRIPE_PUBLISHABLE_KEY=pk_test_[SUA-PUBLISHABLE-KEY]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_[SUA-PUBLISHABLE-KEY]

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=[SEU-BLOB-TOKEN]

# OpenAI API
OPENAI_API_KEY=sk-[SUA-OPENAI-KEY]

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback

# Admin Configuration
DISABLE_ADMIN_AUTH=false
\`\`\`

---

## Configuração do Banco de Dados

**Nota**: Para instruções detalhadas sobre a configuração do banco de dados, consulte:
- [Criar Banco de Dados Completo](./docs/database/CRIAR_BANCO_DADOS_COMPLETO.md) - Guia completo
- [Criar Agentes da Jornada Scan](./docs/database/CRIAR_AGENTES_JORNADA_SCAN.md) - Como criar agentes

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Preencha:
   - **Name**: groovia-production (ou nome desejado)
   - **Database Password**: Crie uma senha forte
   - **Region**: Escolha a região mais próxima
4. Aguarde a criação do projeto (2-3 minutos)

### 2. Obter Credenciais do Supabase

1. No dashboard do Supabase, vá para **Settings** → **API**
2. Copie as seguintes informações:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: `SUPABASE_SERVICE_ROLE_KEY`

3. Vá para **Settings** → **Database**
4. Copie a **Connection string** para:
   - **URI**: `SUPABASE_POSTGRES_URL`
   - **Pooler** (transaction mode): `SUPABASE_POSTGRES_PRISMA_URL`
   - **Session mode**: `SUPABASE_POSTGRES_URL_NON_POOLING`

### 3. Executar Script SQL do Banco de Dados

**Importante**: Agora usamos um único script SQL completo que cria todas as tabelas de uma vez.

1. Acesse o **SQL Editor** do Supabase
2. Copie o conteúdo completo de `scripts/000_COMPLETE_SCHEMA_V2.sql`
3. Cole no SQL Editor e execute (Run)
4. Aguarde a execução (pode levar 1-2 minutos)

**Próximo passo**: Após executar o schema completo, crie os agentes da jornada scan:
1. Copie o conteúdo de `scripts/014_CREATE_SCAN_JOURNEY_AGENTS.sql`
2. Cole no SQL Editor e execute

Para instruções detalhadas, consulte: [Criar Banco de Dados Completo](./docs/database/CRIAR_BANCO_DADOS_COMPLETO.md)

### 4. Verificar Tabelas Criadas

Execute no SQL Editor:
\`\`\`sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
\`\`\`

Você deve ver as seguintes tabelas:
- agents
- conversations
- messages
- organizations
- organization_memberships
- user_roles
- documents
- webhooks
- sessions

### 5. Configurar Storage Buckets (Opcional)

1. No Supabase, vá para **Storage**
2. Crie um bucket chamado `documents`
3. Configure as políticas de acesso conforme necessário

---

## Configuração das Integrações

### 1. OpenAI API

1. Acesse [platform.openai.com](https://platform.openai.com)
2. Vá para **API Keys**
3. Clique em "Create new secret key"
4. Copie a chave e adicione como `OPENAI_API_KEY` no `.env.local`

### 2. Vercel Blob Storage

1. Acesse seu projeto na Vercel
2. Vá para **Storage** → **Create Database** → **Blob**
3. Após criar, copie o token
4. Adicione como `BLOB_READ_WRITE_TOKEN` no `.env.local`

### 3. Stripe (Opcional)

1. Acesse [dashboard.stripe.com](https://dashboard.stripe.com)
2. Ative o **Test Mode** (toggle no canto superior direito)
3. Vá para **Developers** → **API Keys**
4. Copie:
   - **Publishable key**: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - **Secret key**: `STRIPE_SECRET_KEY`

---

## Desenvolvimento Local

### 1. Iniciar Servidor de Desenvolvimento

\`\`\`bash
pnpm dev
\`\`\`

O aplicativo estará disponível em `http://localhost:3000`

### 2. Criar Primeiro Usuário Admin

1. Acesse `http://localhost:3000`
2. Clique em "Criar Conta"
3. Preencha os dados e crie uma conta
4. No Supabase SQL Editor, execute:

\`\`\`sql
-- Busque seu user_id
SELECT id, email FROM auth.users;

-- Torne o usuário um super admin
INSERT INTO user_roles (user_id, role, organization_id)
VALUES ('[SEU-USER-ID]', 'super_admin', NULL);
\`\`\`

### 3. Criar Organização

1. Faça login na aplicação
2. Vá para **Dashboard** → **Empresa**
3. Preencha os dados da organização
4. Clique em "Criar Organização"

### 4. Criar Primeiro Agente

1. Vá para **Agentes**
2. Clique em "Novo Agente"
3. Preencha:
   - **Nome**: Ex: "Assistente de Vendas"
   - **Descrição**: Descrição do agente
   - **Prompt do Sistema**: Instruções para o agente
   - **Modelo**: Escolha o modelo (ex: gpt-4)
4. Clique em "Criar Agente"

---

## Implantação em Produção

### 1. Deploy via v0

A forma mais fácil de fazer deploy é diretamente pela interface do v0:

1. No v0, clique no botão **"Publish"** no canto superior direito
2. Conecte sua conta Vercel se ainda não conectou
3. Configure o nome do projeto
4. O v0 fará o deploy automaticamente

### 2. Deploy via Vercel Dashboard

Se preferir fazer manualmente:

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New" → "Project"
3. Faça upload do código ou conecte via v0
4. Configure o projeto:
   - **Framework Preset**: Next.js
   - **Build Command**: `pnpm build`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

### 3. Configurar Variáveis de Ambiente na Vercel

1. No dashboard do projeto Vercel, vá para **Settings** → **Environment Variables**
2. Adicione TODAS as variáveis do `.env.local`:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...
SUPABASE_POSTGRES_URL=...
SUPABASE_POSTGRES_PRISMA_URL=...
SUPABASE_POSTGRES_URL_NON_POOLING=...
STRIPE_SECRET_KEY=...
STRIPE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
BLOB_READ_WRITE_TOKEN=...
OPENAI_API_KEY=...
NEXT_PUBLIC_APP_URL=https://[SEU-DOMINIO].vercel.app
DISABLE_ADMIN_AUTH=false
\`\`\`

3. Para cada variável:
   - Clique em "Add New"
   - Insira o **Name** e **Value**
   - Marque: **Production**, **Preview**, e **Development**
   - Clique em "Save"

### 4. Atualizar URLs de Callback no Supabase

1. No Supabase, vá para **Authentication** → **URL Configuration**
2. Adicione em **Redirect URLs**:
   \`\`\`
   https://[SEU-DOMINIO].vercel.app/auth/callback
   https://[SEU-DOMINIO].vercel.app
   \`\`\`
3. Clique em "Save"

### 5. Re-deploy (se necessário)

Se você fez alterações nas variáveis de ambiente após o deploy inicial:

1. No dashboard da Vercel, vá para **Deployments**
2. Clique nos três pontos do último deploy
3. Selecione "Redeploy"

---

## Verificação e Testes

### 1. Verificar Build

Após o deploy, verifique no dashboard da Vercel:
- Status do Build deve ser "Ready"
- Build Time deve completar em 2-5 minutos
- Domínio deve estar ativo

### 2. Testar Aplicação

#### a) Teste de Autenticação
1. Acesse `https://[SEU-DOMINIO].vercel.app`
2. Teste login com credenciais existentes
3. Teste criação de nova conta
4. Verifique redirecionamento após login

#### b) Teste de Agentes
1. Navegue para **/agentes**
2. Verifique listagem de agentes
3. Clique em um agente e inicie conversa
4. Envie uma mensagem e aguarde resposta

#### c) Teste de Documentos
1. Navegue para **/documentos**
2. Faça upload de um arquivo
3. Verifique se aparece na lista
4. Teste download do arquivo

#### d) Teste de Exportação PDF
1. Abra uma conversa com mensagens
2. Clique no botão de exportar PDF
3. Verifique se o PDF é gerado corretamente

### 3. Verificar Logs

#### Na Vercel:
1. Vá para **Deployments** → selecione o deploy atual
2. Clique em **Functions**
3. Verifique logs de erros

#### No Supabase:
1. Vá para **Database** → **Logs**
2. Verifique queries executadas
3. Procure por erros de RLS ou queries

---

## Solução de Problemas

### Problema 1: "Infinite recursion detected in policy"

**Causa**: RLS policies com referências circulares

**Solução**:
1. Execute o script completo `scripts/000_COMPLETE_SCHEMA_V2.sql` (já inclui todas as correções)
2. Verifique se as tabelas foram criadas corretamente
3. Verifique se as policies foram atualizadas:
\`\`\`sql
SELECT * FROM pg_policies 
WHERE tablename = 'organization_memberships';
\`\`\`

### Problema 2: "No approved messages found"

**Causa**: Incompatibilidade entre IDs temporários e IDs do banco

**Solução**: Já corrigida no código atual
- Verifica se os UUIDs começam com os short IDs
- Adiciona sincronização final de IDs após streaming

### Problema 3: Mensagens não carregam (0 mensagens)

**Causa**: API `/api/agents/[id]/conversations` não retorna dados

**Solução**:
1. Verifique se o endpoint existe
2. Verifique logs do servidor para ver detalhes
3. Execute o script de fix de RLS para conversations

### Problema 4: Build falha com "Expected '>', got 'size'"

**Causa**: Arquivo `.ts` com sintaxe JSX

**Solução**:
- Renomeie arquivos com JSX de `.ts` para `.tsx`
- Exemplo: `route.ts` → `route.tsx`

### Problema 5: Environment variables não funcionam

**Causa**: Variáveis não configuradas corretamente

**Solução**:
1. Verifique se todas as variáveis estão na Vercel
2. Certifique-se de que variáveis públicas começam com `NEXT_PUBLIC_`
3. Re-deploy após adicionar variáveis

### Problema 6: Supabase retorna 401 Unauthorized

**Causa**: Token ou JWT inválido

**Solução**:
1. Verifique se `SUPABASE_SERVICE_ROLE_KEY` está correto
2. Verifique se `SUPABASE_JWT_SECRET` está correto
3. No código, certifique-se de usar `createServerClient` corretamente

### Problema 7: Stripe webhook falha

**Causa**: Webhook secret não configurado

**Solução**:
1. No Stripe Dashboard, vá para **Developers** → **Webhooks**
2. Adicione endpoint: `https://[SEU-DOMINIO].vercel.app/api/webhooks/stripe`
3. Copie o **Signing secret**
4. Adicione como `STRIPE_WEBHOOK_SECRET` na Vercel

---

## Checklist Final de Implantação

### Antes do Deploy
- [ ] Todas as dependências instaladas (`pnpm install`)
- [ ] Arquivo `.env.local` configurado
- [ ] Banco de dados criado no Supabase
- [ ] Todas as migrações SQL executadas
- [ ] Primeiro usuário admin criado
- [ ] Organização criada
- [ ] Build local funciona (`pnpm build`)

### Durante o Deploy
- [ ] Projeto criado na Vercel (via v0 ou manualmente)
- [ ] Todas as variáveis de ambiente configuradas na Vercel
- [ ] URLs de callback atualizadas no Supabase
- [ ] Deploy completado com sucesso
- [ ] Domínio customizado configurado (opcional)

### Após o Deploy
- [ ] Aplicação acessível via URL de produção
- [ ] Login/Cadastro funcionando
- [ ] Criação de agentes funcionando
- [ ] Chat com agentes funcionando
- [ ] Upload de documentos funcionando
- [ ] Exportação de PDF funcionando
- [ ] Webhooks configurados (se aplicável)
- [ ] Monitoramento ativo
- [ ] Backups automáticos configurados no Supabase

---

## Recursos Adicionais

### Documentação Oficial
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Stripe Documentation](https://stripe.com/docs)

### Comandos Úteis

\`\`\`bash
# Desenvolvimento
pnpm dev                 # Iniciar servidor dev
pnpm build              # Build de produção
pnpm start              # Iniciar servidor de produção
pnpm lint               # Verificar linting
\`\`\`

---

## Conclusão

Este guia cobre todo o processo de implantação da plataforma GrooveIA, desde a configuração inicial até o deploy em produção na Vercel. O sistema utiliza **Supabase PostgreSQL** para banco de dados, **Vercel** para hospedagem, e integra-se com **OpenAI**, **Stripe** e **Vercel Blob** para funcionalidades completas.

Siga cada etapa cuidadosamente e utilize o checklist para garantir que nada seja esquecido.

**Última atualização**: 2025-01-10
**Versão**: 2.0.0
\`\`\`

```md file="docs/OPENAI_ASSISTANTS.md" isDeleted="true"
...deleted...
