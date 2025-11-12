-- ============================================
-- MIGRAÇÃO: Adicionar Campos e Tabelas Faltantes
-- ============================================
-- Este script adiciona todos os campos e tabelas que estão sendo
-- usados no código mas não existem no schema atual.
-- 
-- Data: 2025-01-11
-- Versão: 1.0
-- ============================================

-- ============================================
-- 1. ADICIONAR CAMPOS FALTANTES EM TABELAS EXISTENTES
-- ============================================

-- 1.1. Agents - Adicionar campos faltantes
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS openai_thread_id TEXT,
ADD COLUMN IF NOT EXISTS last_session TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS openai_synced_at TIMESTAMP WITH TIME ZONE;

-- 1.2. Agents - Atualizar constraint de status para incluir 'in_use'
-- Primeiro, remover a constraint existente
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_status_check;
-- Adicionar nova constraint com 'in_use'
ALTER TABLE agents 
ADD CONSTRAINT agents_status_check 
CHECK (status IN ('active', 'inactive', 'archived', 'in_use'));

-- 1.3. Organizations - Adicionar owner_id
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 1.4. Webhooks - Adicionar event_type (além de events[])
ALTER TABLE webhooks 
ADD COLUMN IF NOT EXISTS event_type TEXT;

-- Criar índice para event_type
CREATE INDEX IF NOT EXISTS idx_webhooks_event_type ON webhooks(event_type) WHERE event_type IS NOT NULL;

-- 1.5. Webhook Logs - Adicionar campos faltantes
ALTER TABLE webhook_logs 
ADD COLUMN IF NOT EXISTS status_code INTEGER,
ADD COLUMN IF NOT EXISTS request_payload JSONB,
ADD COLUMN IF NOT EXISTS response_payload JSONB;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status_code ON webhook_logs(status_code) WHERE status_code IS NOT NULL;

-- ============================================
-- 2. CRIAR TABELAS FALTANTES
-- ============================================

-- 2.1. Agent Rules (Regras de Agentes)
CREATE TABLE IF NOT EXISTS agent_rules (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_rules_agent_id ON agent_rules(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_rules_priority ON agent_rules(agent_id, priority DESC);
CREATE INDEX IF NOT EXISTS idx_agent_rules_active ON agent_rules(agent_id, is_active) WHERE is_active = true;

-- Trigger para updated_at
CREATE TRIGGER update_agent_rules_updated_at 
BEFORE UPDATE ON agent_rules 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2.2. Agent Behaviors (Comportamentos de Agentes)
CREATE TABLE IF NOT EXISTS agent_behaviors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  behavior_type TEXT NOT NULL,
  parameters JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_behaviors_agent_id ON agent_behaviors(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_behaviors_active ON agent_behaviors(agent_id, is_active) WHERE is_active = true;

-- Trigger para updated_at
CREATE TRIGGER update_agent_behaviors_updated_at 
BEFORE UPDATE ON agent_behaviors 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2.3. Agent Sessions (Sessões de Agentes)
CREATE TABLE IF NOT EXISTS agent_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_agent_id ON agent_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_org_id ON agent_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_started_at ON agent_sessions(started_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_agent_sessions_updated_at 
BEFORE UPDATE ON agent_sessions 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2.4. Agent Analytics (Analytics de Agentes)
CREATE TABLE IF NOT EXISTS agent_analytics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_analytics_agent_id ON agent_analytics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_analytics_metric_type ON agent_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_agent_analytics_created_at ON agent_analytics(created_at DESC);

-- 2.5. Message Feedback (Feedback de Mensagens)
CREATE TABLE IF NOT EXISTS message_feedback (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('approved', 'rejected', 'helpful', 'not_helpful')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_feedback_message_id ON message_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_conversation_id ON message_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_user_id ON message_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_type ON message_feedback(feedback_type);

-- Trigger para updated_at
CREATE TRIGGER update_message_feedback_updated_at 
BEFORE UPDATE ON message_feedback 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2.6. Approved Responses (Respostas Aprovadas)
CREATE TABLE IF NOT EXISTS approved_responses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  response TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approved_responses_conversation_id ON approved_responses(conversation_id);
CREATE INDEX IF NOT EXISTS idx_approved_responses_agent_id ON approved_responses(agent_id);
CREATE INDEX IF NOT EXISTS idx_approved_responses_user_id ON approved_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_approved_responses_order ON approved_responses(conversation_id, order_index);

-- Trigger para updated_at
CREATE TRIGGER update_approved_responses_updated_at 
BEFORE UPDATE ON approved_responses 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2.7. Vector Store Files (Arquivos de Vector Store)
CREATE TABLE IF NOT EXISTS vector_store_files (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  knowledge_base_id TEXT REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  openai_file_id TEXT NOT NULL,
  openai_vector_store_id TEXT,
  filename TEXT NOT NULL,
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'failed')),
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agent_id, openai_file_id)
);

CREATE INDEX IF NOT EXISTS idx_vector_store_files_agent_id ON vector_store_files(agent_id);
CREATE INDEX IF NOT EXISTS idx_vector_store_files_knowledge_base_id ON vector_store_files(knowledge_base_id);
CREATE INDEX IF NOT EXISTS idx_vector_store_files_openai_file_id ON vector_store_files(openai_file_id);
CREATE INDEX IF NOT EXISTS idx_vector_store_files_vector_store_id ON vector_store_files(openai_vector_store_id) WHERE openai_vector_store_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vector_store_files_status ON vector_store_files(status);

-- Trigger para updated_at
CREATE TRIGGER update_vector_store_files_updated_at 
BEFORE UPDATE ON vector_store_files 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2.8. Assistant Runs (Execuções de Assistente)
CREATE TABLE IF NOT EXISTS assistant_runs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL,
  thread_id TEXT NOT NULL,
  run_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assistant_runs_agent_id ON assistant_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_assistant_runs_conversation_id ON assistant_runs(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assistant_runs_thread_id ON assistant_runs(thread_id);
CREATE INDEX IF NOT EXISTS idx_assistant_runs_run_id ON assistant_runs(run_id);
CREATE INDEX IF NOT EXISTS idx_assistant_runs_status ON assistant_runs(status);
CREATE INDEX IF NOT EXISTS idx_assistant_runs_created_at ON assistant_runs(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_assistant_runs_updated_at 
BEFORE UPDATE ON assistant_runs 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2.9. Password Reset Tokens (Tokens de Recuperação de Senha)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_used ON password_reset_tokens(used, expires_at) WHERE used = false;

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- 3.1. Agent Rules
ALTER TABLE agent_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem regras dos agentes das suas organizações"
  ON agent_rules FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents
      WHERE organization_id IN (
        SELECT organization_id FROM organization_memberships
        WHERE user_id = auth.uid()
      )
      OR organization_id IS NULL
    )
  );

CREATE POLICY "Membros podem criar regras"
  ON agent_rules FOR INSERT
  WITH CHECK (
    agent_id IN (
      SELECT id FROM agents
      WHERE organization_id IN (
        SELECT organization_id FROM organization_memberships
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
      )
      OR organization_id IS NULL
    )
  );

-- 3.2. Agent Behaviors
ALTER TABLE agent_behaviors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem comportamentos dos agentes das suas organizações"
  ON agent_behaviors FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents
      WHERE organization_id IN (
        SELECT organization_id FROM organization_memberships
        WHERE user_id = auth.uid()
      )
      OR organization_id IS NULL
    )
  );

-- 3.3. Agent Sessions
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas próprias sessões"
  ON agent_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem criar sessões"
  ON agent_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 3.4. Agent Analytics
ALTER TABLE agent_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem analytics dos agentes das suas organizações"
  ON agent_analytics FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents
      WHERE organization_id IN (
        SELECT organization_id FROM organization_memberships
        WHERE user_id = auth.uid()
      )
      OR organization_id IS NULL
    )
  );

-- 3.5. Message Feedback
ALTER TABLE message_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem feedback de suas mensagens"
  ON message_feedback FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem criar feedback"
  ON message_feedback FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 3.6. Approved Responses
ALTER TABLE approved_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem respostas aprovadas de suas conversas"
  ON approved_responses FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- 3.7. Vector Store Files
ALTER TABLE vector_store_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem arquivos dos agentes das suas organizações"
  ON vector_store_files FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents
      WHERE organization_id IN (
        SELECT organization_id FROM organization_memberships
        WHERE user_id = auth.uid()
      )
      OR organization_id IS NULL
    )
  );

-- 3.8. Assistant Runs
ALTER TABLE assistant_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem runs dos agentes das suas organizações"
  ON assistant_runs FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents
      WHERE organization_id IN (
        SELECT organization_id FROM organization_memberships
        WHERE user_id = auth.uid()
      )
      OR organization_id IS NULL
    )
  );

-- 3.9. Password Reset Tokens
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seus próprios tokens"
  ON password_reset_tokens FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- 4. COMENTÁRIOS
-- ============================================

COMMENT ON TABLE agent_rules IS 'Regras configuráveis para agentes';
COMMENT ON TABLE agent_behaviors IS 'Comportamentos configuráveis para agentes';
COMMENT ON TABLE agent_sessions IS 'Sessões de uso de agentes';
COMMENT ON TABLE agent_analytics IS 'Métricas e analytics de agentes';
COMMENT ON TABLE message_feedback IS 'Feedback dos usuários sobre mensagens';
COMMENT ON TABLE approved_responses IS 'Respostas aprovadas pelos usuários';
COMMENT ON TABLE vector_store_files IS 'Arquivos sincronizados com OpenAI Vector Store';
COMMENT ON TABLE assistant_runs IS 'Execuções de OpenAI Assistants';
COMMENT ON TABLE password_reset_tokens IS 'Tokens para recuperação de senha';

COMMENT ON COLUMN agents.openai_thread_id IS 'ID do thread OpenAI para conversas contínuas';
COMMENT ON COLUMN agents.last_session IS 'Data da última sessão do agente';
COMMENT ON COLUMN agents.openai_synced_at IS 'Data da última sincronização com OpenAI';
COMMENT ON COLUMN organizations.owner_id IS 'ID do usuário dono da organização';
COMMENT ON COLUMN webhooks.event_type IS 'Tipo de evento (campo auxiliar além de events[])';

-- ============================================
-- FIM DO SCRIPT DE MIGRAÇÃO
-- ============================================

