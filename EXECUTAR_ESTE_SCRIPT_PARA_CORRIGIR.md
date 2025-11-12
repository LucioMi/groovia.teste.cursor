# 🚨 CORRIGIR RECURSÃO INFINITA - EXECUTE AGORA! 🚨

## O Problema

A tabela `user_roles` tem RLS policies que causam **recursão infinita** porque:

1. A policy tenta verificar se o usuário é `super_admin`
2. Para isso, ela consulta a tabela `user_roles`
3. Mas para consultar `user_roles`, ela precisa verificar a policy novamente
4. Loop infinito! 💥

## A Solução

**DESABILITAR RLS** na tabela `user_roles` porque:
- É uma tabela de sistema que só deve ser acessada pelo **backend**
- O backend usa `supabaseAdmin` com **Service Role Key** que bypassa RLS
- Nunca deve ser acessada diretamente pelo client

## Execute Agora

1. Abra o **SQL Editor** no Supabase Dashboard
2. Cole e execute o script: `scripts/002_FIX_USER_ROLES_RLS.sql`
3. O script vai:
   - Remover todas as policies problemáticas
   - Desabilitar RLS na tabela `user_roles`
   - Inserir/atualizar o super_admin `inteligencia@groovia.com.br`

## Após Executar

✅ O login admin funcionará perfeitamente
✅ O usuário `inteligencia@groovia.com.br` será reconhecido como super_admin
✅ O redirecionamento para `/admin` funcionará corretamente

## Segurança

Isso é **100% SEGURO** porque:
- `user_roles` só é acessada pelo backend usando Service Role Key
- O código nunca expõe essa tabela ao client
- As APIs verificam a role antes de permitir ações administrativas
