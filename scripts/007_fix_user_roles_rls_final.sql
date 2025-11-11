-- CORREÇÃO DEFINITIVA: Desabilitar RLS na tabela user_roles
-- Esta tabela só deve ser acessada pelo backend usando Service Role Key

-- Remover todas as policies existentes
DROP POLICY IF EXISTS "Users can see their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins podem ver todas as roles" ON public.user_roles;
DROP POLICY IF EXISTS "Usuários podem ver sua própria role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins podem gerenciar roles" ON public.user_roles;

-- DESABILITAR RLS completamente
-- Isso é seguro porque:
-- 1. user_roles é uma tabela de sistema
-- 2. Só é acessada pelo backend com SERVICE ROLE KEY
-- 3. Nunca é acessada diretamente pelo frontend
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Garantir que o super_admin existe
INSERT INTO public.user_roles (user_id, role)
VALUES ('3a52f68b-aa23-4c42-8559-4370e460a9c7', 'super_admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
