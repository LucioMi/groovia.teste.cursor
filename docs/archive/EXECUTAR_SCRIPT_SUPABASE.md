# ✅ SCRIPT SQL 100% FUNCIONAL COM RLS COMPLETO

Execute este script no **SQL Editor** do Supabase Dashboard:

## 📋 PASSOS:

1. **Acesse o Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto **groovia**
3. Vá em **SQL Editor** (ícone de banco de dados na lateral)
4. Clique em **New Query**
5. Cole o conteúdo do arquivo `scripts/000_COMPLETE_SCHEMA_SUPABASE.sql`
6. Clique em **RUN** (ou Ctrl+Enter)

## ✅ O QUE O SCRIPT FAZ:

### 1. **Cria TODAS as tabelas do SaaS Multi-Tenancy**
- Organizations (empresas dos clientes)
- Organization Memberships (usuários em múltiplas organizações com roles)
- Agents, Conversas, Mensagens, Documentos
- Knowledge Bases, Webhooks, Assinaturas, Pagamentos
- Analytics, Testes, Feedback

### 2. **Configura Row Level Security (RLS) COMPLETO**
- ✅ Usuários só veem organizações que fazem parte
- ✅ Usuários podem ter múltiplas organizações
- ✅ Roles por organização (owner, admin, member, viewer)
- ✅ Owners podem gerenciar organização
- ✅ Admins podem gerenciar membros e recursos
- ✅ Members podem criar agentes e conversas
- ✅ Viewers só podem visualizar

### 3. **Cria tabela Admin separada**
- `admin_users` - Super admins da plataforma (você)
- `admin_sessions` - Sessões de admin
- **SEM RLS** - gerenciado via código

### 4. **Seed data**
- Planos de assinatura (Free, Starter, Pro, Enterprise)

## 🔐 SEGURANÇA:

O script usa **auth.uid()** do Supabase Auth para verificar permissões.
Cada tabela tem policies específicas para SELECT, INSERT, UPDATE e DELETE.

## ⚠️ IMPORTANTE:

- Execute o script UMA VEZ
- Depois acesse `/admin/setup` para criar o primeiro admin
- Use o **Supabase Auth** para usuários normais (signup/signin)

## 🎯 PRÓXIMOS PASSOS:

1. Execute o script SQL ✅
2. Acesse `/admin/setup` e crie admin (email, senha)
3. Acesse `/admin` e faça login como admin
4. Cadastre usuários via `/auth/signup` (usam Supabase Auth)
5. Usuários fazem login via `/auth/signin`
6. Sistema pronto! 🚀
