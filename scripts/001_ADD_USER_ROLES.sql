-- Adiciona tabela de roles para usuários do Supabase Auth
-- Este script pode ser executado mesmo se outras tabelas já existem

-- Criar tabela de roles (se não existir)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para busca rápida por user_id
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins podem ver todas as roles
DROP POLICY IF EXISTS "Super admins podem ver todas as roles" ON public.user_roles;
CREATE POLICY "Super admins podem ver todas as roles"
ON public.user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin'
  )
);

-- Policy: Usuários podem ver sua própria role
DROP POLICY IF EXISTS "Usuários podem ver sua própria role" ON public.user_roles;
CREATE POLICY "Usuários podem ver sua própria role"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- Policy: Super admins podem gerenciar roles
DROP POLICY IF EXISTS "Super admins podem gerenciar roles" ON public.user_roles;
CREATE POLICY "Super admins podem gerenciar roles"
ON public.user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin'
  )
);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
