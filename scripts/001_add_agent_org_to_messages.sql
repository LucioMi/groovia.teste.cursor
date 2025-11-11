-- =====================================================
-- MIGRAÇÃO: Adicionar agent_id e organization_id à tabela messages
-- =====================================================
-- Data: 2025-11-10
-- Descrição: Adiciona referências de agente e organização às mensagens
--            para melhorar o isolamento de dados e facilitar queries

-- Adicionar coluna agent_id
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS agent_id TEXT REFERENCES public.agents(id) ON DELETE CASCADE;

-- Adicionar coluna organization_id
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS organization_id TEXT REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_messages_agent_id ON public.messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_messages_organization_id ON public.messages(organization_id);

-- Atualizar mensagens existentes com os dados das conversations
UPDATE public.messages m
SET 
  agent_id = c.agent_id,
  organization_id = c.organization_id
FROM public.conversations c
WHERE m.conversation_id = c.id
  AND m.agent_id IS NULL
  AND m.organization_id IS NULL;

-- Atualizar as RLS policies para messages para incluir organização
DROP POLICY IF EXISTS "Usuários veem mensagens das suas conversas" ON public.messages;
DROP POLICY IF EXISTS "Usuários podem criar mensagens nas suas conversas" ON public.messages;

-- Nova policy: Usuários veem mensagens das suas organizações
CREATE POLICY "Usuários veem mensagens das suas conversas e organizações"
  ON public.messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE user_id = auth.uid()
    )
    OR
    organization_id IN (
      SELECT organization_id FROM public.organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Nova policy: Usuários podem criar mensagens nas suas conversas
CREATE POLICY "Usuários podem criar mensagens nas suas conversas"
  ON public.messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE user_id = auth.uid()
    )
    AND
    agent_id IN (
      SELECT id FROM public.agents
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_memberships
        WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Para verificar se a migração funcionou:
-- SELECT COUNT(*) FROM public.messages WHERE agent_id IS NOT NULL AND organization_id IS NOT NULL;
-- SELECT COUNT(*) FROM public.messages WHERE agent_id IS NULL OR organization_id IS NULL;
