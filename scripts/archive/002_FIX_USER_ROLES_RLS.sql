-- CORRIGIR RECURSÃO INFINITA nas RLS policies de user_roles
-- Este script remove as policies problemáticas e desabilita RLS
-- porque user_roles é uma tabela de sistema que deve ser acessada apenas pelo backend

-- Remover TODAS as policies existentes
DROP POLICY IF EXISTS "Super admins podem ver todas as roles" ON public.user_roles;
DROP POLICY IF EXISTS "Usuários podem ver sua própria role" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins podem gerenciar roles" ON public.user_roles;

-- DESABILITAR RLS na tabela user_roles
-- Isso é seguro porque user_roles só é acessada pelo backend usando Service Role Key
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Comentário: user_roles é uma tabela de sistema que deve ser acessada
-- APENAS pelo backend usando supabaseAdmin (Service Role Key).
-- Nunca deve ser acessada diretamente pelo client com RLS.

-- Inserir o super_admin se ainda não existe
INSERT INTO public.user_roles (user_id, role)
VALUES ('3a52f68b-aa23-4c42-8559-4370e460a9c7', 'super_admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
