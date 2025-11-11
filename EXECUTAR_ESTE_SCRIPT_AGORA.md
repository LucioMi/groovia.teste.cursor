# 🚀 EXECUTE ESTE SCRIPT AGORA NO SUPABASE

## ⚠️ PROBLEMA IDENTIFICADO

O erro "infinite recursion detected in policy for relation user_roles" acontece porque **a tabela `user_roles` NÃO EXISTE no seu banco de dados Supabase**.

O usuário `inteligencia@groovia.com.br` FOI CRIADO no Supabase Auth, mas a role não foi salva porque a tabela não existe.

## ✅ SOLUÇÃO: Execute o script SQL

### Passo 1: Copiar o Script SQL

Abra o arquivo: `scripts/001_ADD_USER_ROLES.sql`

Copie TODO o conteúdo do arquivo.

### Passo 2: Executar no Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: **Groovia**
3. Clique em **SQL Editor** (no menu lateral esquerdo)
4. Clique em **New query**
5. Cole o script SQL completo
6. Clique em **Run** ou pressione `Ctrl+Enter`

### Passo 3: Verificar Sucesso

Você deve ver uma mensagem como:
\`\`\`
Success. No rows returned
\`\`\`

Isso é NORMAL e significa que as tabelas foram criadas com sucesso!

### Passo 4: Adicionar a Role ao Usuário Criado

Agora que a tabela existe, execute este SQL para dar role de super_admin ao usuário que você criou:

\`\`\`sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('3a52f68b-aa23-4c42-8559-4370e460a9c7', 'super_admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
\`\`\`

**IMPORTANTE:** O ID `3a52f68b-aa23-4c42-8559-4370e460a9c7` é do usuário `inteligencia@groovia.com.br` que apareceu nos logs. Se você criou outro usuário, substitua pelo ID correto.

### Passo 5: Fazer Login

1. Acesse: `/auth/signin`
2. Faça login com:
   - **Email**: inteligencia@groovia.com.br
   - **Senha**: a senha que você criou
3. Você será redirecionado automaticamente para `/admin` (painel administrativo)

## ✅ Pronto!

Agora você tem:
- ✅ Tabela `user_roles` criada no Supabase
- ✅ Usuário `inteligencia@groovia.com.br` com role `super_admin`
- ✅ Sistema de autenticação usando Supabase Auth
- ✅ Redirecionamento automático baseado na role

## 📋 Roles Disponíveis

- `super_admin`: Acesso total à plataforma (painel `/admin`)
- `owner`: Dono de organização
- `admin`: Administrador de organização  
- `member`: Membro de organização
- `viewer`: Visualizador apenas

## 🔒 Como Funciona

1. Usuários são criados no **Supabase Auth** (tabela `auth.users`)
2. Roles são armazenadas na tabela **`user_roles`**
3. No login, o sistema verifica a role e redireciona:
   - `super_admin` → `/admin` (painel administrativo)
   - Outros → `/dashboard` (área do cliente)

## ❓ Em Caso de Erro

Se mesmo depois de executar o script ainda der erro, verifique:

1. A tabela `user_roles` foi criada? Execute no SQL Editor:
   \`\`\`sql
   SELECT * FROM public.user_roles;
   \`\`\`

2. O usuário tem role? Execute:
   \`\`\`sql
   SELECT * FROM public.user_roles WHERE user_id = '3a52f68b-aa23-4c42-8559-4370e460a9c7';
   \`\`\`

3. Se não aparecer nenhum resultado, execute o INSERT do Passo 4 novamente.
