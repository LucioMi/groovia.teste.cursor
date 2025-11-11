# 🚀 Como Executar o Script SQL no Supabase

## 1. Acesse o SQL Editor do Supabase

1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto **GrooveIA**
3. No menu lateral esquerdo, clique em **SQL Editor**

## 2. Execute o Script

1. Clique em **New Query**
2. Copie TODO o conteúdo do arquivo `scripts/000_COMPLETE_SCHEMA_SUPABASE.sql`
3. Cole no editor
4. Clique em **RUN** (canto inferior direito)

## 3. Aguarde a Execução

- O script pode levar 10-30 segundos para executar
- Você verá "Success. No rows returned" quando terminar

## 4. Verifique se Funcionou

Execute esta query para ver todas as tabelas criadas:

\`\`\`sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
\`\`\`

Você deve ver cerca de 30+ tabelas incluindo:
- organizations
- organization_memberships
- agents
- conversations
- messages
- admin_users
- admin_sessions
- etc.

## 5. Próximo Passo: Criar Primeiro Admin

Depois que o script executar com sucesso, acesse:

**`/admin/setup`**

Preencha o formulário com:
- Nome completo
- Email
- Senha (mínimo 6 caracteres)

O sistema criará o primeiro super admin e fará login automaticamente!

## 🎯 Diferenças Importantes do Supabase

### ✅ O que o Supabase FAZ automaticamente:
- Gerencia `auth.users` (tabela de autenticação)
- Cria triggers para sincronização
- Gerencia sessões e tokens
- Fornece `auth.uid()` para RLS policies

### ⚠️ O que VOCÊ precisa fazer:
- Executar este script SQL uma vez
- Criar o primeiro admin via `/admin/setup`
- Usuários normais se cadastram via Supabase Auth (não SQL direto)

## 🔐 Sistema de Usuários

### Usuários Normais do SaaS:
- Gerenciados pelo **Supabase Auth**
- Cadastro via `/auth/signup` (usa API do Supabase)
- Podem ter múltiplas organizações
- Dados em `organization_memberships`

### Super Admins da Plataforma:
- Gerenciados em **`admin_users`** (SQL direto)
- Cadastro via `/admin/setup` (primeira vez)
- Acesso total ao painel administrativo
- Sistema separado do auth normal

## ✨ Multi-Tenancy Funciona Assim:

1. **João** cria conta via Supabase Auth
2. **João** cria organização "Empresa A" → vira OWNER
3. **Maria** cria conta via Supabase Auth
4. **Maria** é convidada para "Empresa A" → vira MEMBER
5. **Maria** cria organização "Empresa B" → vira OWNER
6. **João** é convidado para "Empresa B" → vira ADMIN

✅ **João** tem acesso a 2 organizações (owner em A, admin em B)
✅ **Maria** tem acesso a 2 organizações (member em A, owner em B)

## 🛠️ Troubleshooting

### "schema 'auth' does not exist"
❌ **Problema:** Script antigo tentando acessar `auth.users`
✅ **Solução:** Use o novo script que NÃO faz referência direta ao schema auth

### "relation already exists"
❌ **Problema:** Script já foi executado antes
✅ **Solução:** Normal! O script usa `IF NOT EXISTS` e não vai quebrar

### Preciso recriar o banco?
Não! O script é idempotente e pode ser executado múltiplas vezes sem problemas.
