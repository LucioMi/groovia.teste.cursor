# Como Fazer o Login Admin Funcionar

## Problema Identificado

1. **Múltiplas instâncias de GoTrueClient** - causando behavior indefinido
2. **Middleware verificava cookie errado** - verificava `admin_session` ao invés da sessão Supabase
3. **Admin layout não redirecionava** - sempre renderizava children mesmo sem autenticação

## Solução Implementada

### 1. Singleton no Supabase Client (lib/supabase/client.ts)
- Agora reutiliza a mesma instância do client
- Evita "Multiple GoTrueClient instances detected"

### 2. Middleware Corrigido (middleware.ts)
- Verifica sessão do Supabase Auth ao invés de cookie customizado
- Verifica se usuário tem role `super_admin` na tabela `user_roles`
- Redireciona para `/admin/login` se não autorizado

### 3. Admin Layout Simplificado (app/admin/layout.tsx)
- Confia no middleware para verificação de autenticação
- Renderiza children se não tem admin user (páginas públicas)

## Passos para Testar

1. Execute o script SQL `003_CREATE_USER_ROLES.sql` no Supabase SQL Editor
2. Acesse `/admin/setup` e crie o primeiro admin
3. Faça login em `/admin/login` ou `/auth/signin` com o email do admin
4. Você será redirecionado para `/admin` automaticamente

## Verificar no Supabase

No SQL Editor do Supabase, verifique se o usuário tem a role correta:

\`\`\`sql
SELECT * FROM user_roles WHERE user_id = '<seu_user_id>';
\`\`\`

Deve retornar:
\`\`\`
user_id: <uuid>
role: super_admin
\`\`\`

## Debug

Os logs agora mostram:
- `[v0] Middleware processing: /admin`
- `[v0] Session exists: true`
- `[v0] User role: super_admin`
- `[v0] Super admin verified, allowing access`

Se não estiver funcionando, verifique os logs do navegador e do servidor.
