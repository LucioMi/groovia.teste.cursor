# 🚀 EXECUTAR SCRIPT NO SUPABASE - GUIA DEFINITIVO

## ✅ PASSO 1: Abrir SQL Editor do Supabase

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto "groovia"
3. Clique em **"SQL Editor"** no menu lateral esquerdo
4. Clique em **"New query"**

## ✅ PASSO 2: Copiar e Executar o Script

1. Abra o arquivo `scripts/000_COMPLETE_SCHEMA_SUPABASE.sql`
2. Copie TODO o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** (ou pressione Ctrl+Enter)

## ✅ PASSO 3: Verificar Sucesso

Se tudo funcionou, você verá:
- **Sucesso**: ✅ Success. No rows returned
- Todas as tabelas foram criadas
- Todas as RLS policies foram aplicadas

Para verificar as tabelas criadas, execute:
\`\`\`sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
\`\`\`

Você deve ver 30+ tabelas criadas!

## ✅ PASSO 4: Criar Primeiro Admin

Agora acesse a aplicação:

1. Abra http://localhost:3000/admin/setup
2. Preencha:
   - **Nome Completo**: Seu nome
   - **Email**: seu@email.com  
   - **Usuário**: admin
   - **Senha**: mínimo 6 caracteres
3. Clique em "Criar Administrador"
4. Você será redirecionado para /dashboard/admin

## 🔒 SEGURANÇA - RLS CONFIGURADO

O script configura Row Level Security (RLS) em TODAS as tabelas:

✅ **Usuários só veem dados das suas organizações**
✅ **Owners podem gerenciar suas organizações**
✅ **Membros têm acesso baseado em role (owner, admin, member, viewer)**
✅ **Dados completamente isolados entre organizações (multi-tenancy)**
✅ **Admin users separados do sistema de usuários normais**

## 📊 ESTRUTURA DO BANCO

### Sistema Multi-Tenancy
- **Um USUÁRIO** pode ter **MÚLTIPLAS ORGANIZAÇÕES**
- Cada usuário tem uma **ROLE POR ORGANIZAÇÃO** (owner, admin, member, viewer)
- Dados completamente isolados entre organizações

### Tabelas Principais
- `organizations` - Empresas/organizações dos clientes
- `organization_memberships` - Relaciona users com organizations (multi-tenancy)
- `agents` - Agentes IA das organizações
- `conversations` - Conversas com agentes
- `messages` - Mensagens das conversas
- `knowledge_bases` - Base de conhecimento dos agentes
- `webhooks` - Integrações via webhook
- `subscription_plans` - Planos de assinatura
- `organization_subscriptions` - Assinaturas ativas
- `admin_users` - Super admins da plataforma (separado)

## ⚡ PRÓXIMOS PASSOS

Após executar o script:

1. ✅ Criar primeiro admin via `/admin/setup`
2. ✅ Fazer login como admin
3. ✅ Criar primeira organização
4. ✅ Adicionar usuários à organização
5. ✅ Criar agentes IA
6. ✅ Começar a usar o SaaS!

## 🆘 PROBLEMAS?

Se der erro no script:
- Verifique se está usando o SQL Editor do Supabase (não o pgAdmin ou outro)
- Certifique-se de que copiou o script completo
- Se já executou antes, pode ignorar erros "already exists"

**O sistema está 100% pronto e seguro com RLS!** 🎉
