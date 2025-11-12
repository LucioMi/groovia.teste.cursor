-- ============================================
-- GROOVIA - SCHEMA COMPLETO DO BANCO DE DADOS
-- ============================================
-- Este script cria TODAS as tabelas necessárias para o sistema Groovia
-- Execute este script NO SUPABASE SQL EDITOR após apagar todas as tabelas
-- 
-- Data: 2025-01-11
-- Versão: 2.0 (com melhorias para Jornada Scan)
-- ============================================

-- ============================================
-- 1. EXTENSÕES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- 2. FUNÇÕES AUXILIARES
-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. TABELAS PRINCIPAIS
-- ============================================

-- 3.1. Organizations (Organizações/Empresas)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_created_at ON organizations(created_at DESC);

-- 3.2. Organization Memberships (Usuários em Organizações)
CREATE TABLE IF NOT EXISTS organization_memberships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_organization_memberships_org ON organization_memberships(organization_id);
CREATE INDEX idx_organization_memberships_user ON organization_memberships(user_id);
CREATE INDEX idx_organization_memberships_role ON organization_memberships(role);

-- 3.3. User Roles (Roles Globais - Super Admins)
CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'owner', 'admin', 'member', 'viewer')),
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- 3.4. User Preferences (Preferências do Usuário)
CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT DEFAULT 'pt-BR',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);

-- 3.5. Agents (Agentes de IA)
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived', 'in_use')),
  system_prompt TEXT,
  model TEXT DEFAULT 'gpt-4',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 2000,
  icon_color TEXT DEFAULT '#7C3AED',
  is_passive BOOLEAN DEFAULT false,
  next_agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  openai_assistant_id TEXT,
  openai_vector_store_id TEXT,
  openai_thread_id TEXT,
  openai_synced_at TIMESTAMP WITH TIME ZONE,
  last_session TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_agents_organization ON agents(organization_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_next_agent ON agents(next_agent_id);
CREATE INDEX idx_agents_created_at ON agents(created_at DESC);

-- 3.6. Conversations (Conversas)
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT,
  openai_thread_id TEXT,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_agent ON conversations(agent_id);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_org ON conversations(organization_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at) WHERE last_message_at IS NOT NULL;

-- 3.7. Messages (Mensagens)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  openai_message_id TEXT,
  openai_run_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_agent ON messages(agent_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- 3.8. Documents (Documentos)
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size BIGINT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_org ON documents(organization_id);
CREATE INDEX idx_documents_agent ON documents(agent_id);
CREATE INDEX idx_documents_conversation ON documents(conversation_id);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);

-- 3.9. Knowledge Bases (Base de Conhecimento)
CREATE TABLE IF NOT EXISTS knowledge_bases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  content_text TEXT,
  openai_file_id TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_knowledge_bases_agent ON knowledge_bases(agent_id);
CREATE INDEX idx_knowledge_bases_org ON knowledge_bases(organization_id);

-- 3.10. Agent Rules (Regras de Agentes)
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

CREATE INDEX idx_agent_rules_agent_id ON agent_rules(agent_id);
CREATE INDEX idx_agent_rules_priority ON agent_rules(agent_id, priority DESC);
CREATE INDEX idx_agent_rules_active ON agent_rules(agent_id, is_active) WHERE is_active = true;

-- 3.11. Agent Behaviors (Comportamentos de Agentes)
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

CREATE INDEX idx_agent_behaviors_agent_id ON agent_behaviors(agent_id);
CREATE INDEX idx_agent_behaviors_active ON agent_behaviors(agent_id, is_active) WHERE is_active = true;

-- 3.12. Agent Sessions (Sessões de Agentes)
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

CREATE INDEX idx_agent_sessions_agent_id ON agent_sessions(agent_id);
CREATE INDEX idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX idx_agent_sessions_org_id ON agent_sessions(organization_id);
CREATE INDEX idx_agent_sessions_started_at ON agent_sessions(started_at DESC);

-- 3.13. Agent Analytics (Analytics de Agentes)
CREATE TABLE IF NOT EXISTS agent_analytics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agent_analytics_agent_id ON agent_analytics(agent_id);
CREATE INDEX idx_agent_analytics_metric_type ON agent_analytics(metric_type);
CREATE INDEX idx_agent_analytics_created_at ON agent_analytics(created_at DESC);

-- 3.14. Message Feedback (Feedback de Mensagens)
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

CREATE INDEX idx_message_feedback_message_id ON message_feedback(message_id);
CREATE INDEX idx_message_feedback_conversation_id ON message_feedback(conversation_id);
CREATE INDEX idx_message_feedback_user_id ON message_feedback(user_id);
CREATE INDEX idx_message_feedback_type ON message_feedback(feedback_type);

-- 3.15. Approved Responses (Respostas Aprovadas)
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

CREATE INDEX idx_approved_responses_conversation_id ON approved_responses(conversation_id);
CREATE INDEX idx_approved_responses_agent_id ON approved_responses(agent_id);
CREATE INDEX idx_approved_responses_user_id ON approved_responses(user_id);
CREATE INDEX idx_approved_responses_order ON approved_responses(conversation_id, order_index);

-- 3.16. Vector Store Files (Arquivos de Vector Store)
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

CREATE INDEX idx_vector_store_files_agent_id ON vector_store_files(agent_id);
CREATE INDEX idx_vector_store_files_knowledge_base_id ON vector_store_files(knowledge_base_id);
CREATE INDEX idx_vector_store_files_openai_file_id ON vector_store_files(openai_file_id);
CREATE INDEX idx_vector_store_files_vector_store_id ON vector_store_files(openai_vector_store_id) WHERE openai_vector_store_id IS NOT NULL;
CREATE INDEX idx_vector_store_files_status ON vector_store_files(status);

-- 3.17. Assistant Runs (Execuções de Assistente)
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

CREATE INDEX idx_assistant_runs_agent_id ON assistant_runs(agent_id);
CREATE INDEX idx_assistant_runs_conversation_id ON assistant_runs(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX idx_assistant_runs_thread_id ON assistant_runs(thread_id);
CREATE INDEX idx_assistant_runs_run_id ON assistant_runs(run_id);
CREATE INDEX idx_assistant_runs_status ON assistant_runs(status);
CREATE INDEX idx_assistant_runs_created_at ON assistant_runs(created_at DESC);

-- 3.18. Password Reset Tokens (Tokens de Recuperação de Senha)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_used ON password_reset_tokens(used, expires_at) WHERE used = false;

-- ============================================
-- 4. TABELAS DE SCANS (JORNADA SCAN) - MELHORADAS
-- ============================================

-- 4.1. Scans (Jornadas Scan)
CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Novo SCAN',
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'archived')),
  current_agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_scans_organization ON scans(organization_id);
CREATE INDEX idx_scans_status ON scans(status);
CREATE INDEX idx_scans_created_by ON scans(created_by);
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);

-- 4.2. Scan Steps (Etapas da Jornada) - MELHORADO
CREATE TABLE IF NOT EXISTS scan_steps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  scan_id TEXT NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL, -- Opcional (para etapas não-agentes)
  conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL,
  step_order INTEGER NOT NULL,
  
  -- Tipo de etapa (NOVO)
  step_type TEXT NOT NULL DEFAULT 'agent' CHECK (step_type IN ('agent', 'document', 'autonomous', 'synthetic')),
  
  -- Dependências (NOVO)
  depends_on_step_ids TEXT[] DEFAULT '{}',
  input_document_ids TEXT[] DEFAULT '{}',
  output_document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
  
  -- Documentos manuais (NOVO)
  document_template_url TEXT,
  manual_document_uploaded BOOLEAN DEFAULT false,
  manual_document_upload_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
  manual_document_uploaded_at TIMESTAMP WITH TIME ZONE,
  
  -- Execução automática (NOVO)
  auto_execute BOOLEAN DEFAULT false,
  execution_script TEXT,
  
  -- Status e aprovação
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved', 'rejected')),
  document_url TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(scan_id, step_order)
);

CREATE INDEX idx_scan_steps_scan_id ON scan_steps(scan_id);
CREATE INDEX idx_scan_steps_status ON scan_steps(status);
CREATE INDEX idx_scan_steps_step_order ON scan_steps(scan_id, step_order);
CREATE INDEX idx_scan_steps_step_type ON scan_steps(step_type);
CREATE INDEX idx_scan_steps_agent ON scan_steps(agent_id) WHERE agent_id IS NOT NULL;

-- 4.3. Scan Step Documents (Vínculos Documento-Etapa) - NOVO
CREATE TABLE IF NOT EXISTS scan_step_documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  scan_step_id TEXT NOT NULL REFERENCES scan_steps(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('input', 'output', 'template', 'manual_upload')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(scan_step_id, document_id, document_type)
);

CREATE INDEX idx_scan_step_documents_step ON scan_step_documents(scan_step_id);
CREATE INDEX idx_scan_step_documents_doc ON scan_step_documents(document_id);
CREATE INDEX idx_scan_step_documents_type ON scan_step_documents(document_type);

-- ============================================
-- 5. TABELAS AUXILIARES
-- ============================================

-- 5.1. Webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  event_type TEXT,
  secret TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhooks_org ON webhooks(organization_id);
CREATE INDEX idx_webhooks_agent ON webhooks(agent_id);
CREATE INDEX idx_webhooks_event_type ON webhooks(event_type) WHERE event_type IS NOT NULL;

-- 5.2. Webhook Logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  webhook_id TEXT NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  status_code INTEGER,
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_webhook ON webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX idx_webhook_logs_status_code ON webhook_logs(status_code) WHERE status_code IS NOT NULL;

-- 5.3. Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  features JSONB DEFAULT '[]'::jsonb,
  limits JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subscription_plans_slug ON subscription_plans(slug);

-- 5.4. Organization Subscriptions
CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_org_subscriptions_org ON organization_subscriptions(organization_id);
CREATE INDEX idx_org_subscriptions_plan ON organization_subscriptions(plan_id);

-- 5.5. Payments
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id TEXT REFERENCES organization_subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_org ON payments(organization_id);
CREATE INDEX idx_payments_subscription ON payments(subscription_id);

-- 5.6. AI Gateway Logs
CREATE TABLE IF NOT EXISTS ai_gateway_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  assistant_id TEXT NOT NULL,
  thread_id TEXT,
  run_id TEXT,
  agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),
  prompt TEXT,
  request_payload JSONB,
  response_payload JSONB,
  response_text TEXT,
  model TEXT,
  tokens_used INTEGER,
  latency_ms INTEGER,
  status TEXT CHECK (status IN ('success', 'error', 'timeout')),
  error_message TEXT,
  gateway_endpoint TEXT,
  cache_hit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_ai_gateway_logs_assistant_id ON ai_gateway_logs(assistant_id);
CREATE INDEX idx_ai_gateway_logs_agent_id ON ai_gateway_logs(agent_id);
CREATE INDEX idx_ai_gateway_logs_conversation_id ON ai_gateway_logs(conversation_id);
CREATE INDEX idx_ai_gateway_logs_organization_id ON ai_gateway_logs(organization_id);
CREATE INDEX idx_ai_gateway_logs_created_at ON ai_gateway_logs(created_at DESC);
CREATE INDEX idx_ai_gateway_logs_status ON ai_gateway_logs(status);

-- 5.7. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'super_admin', 'system')),
  actor_email TEXT,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  changes JSONB,
  metadata JSONB,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failure')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);

-- ============================================
-- 6. TRIGGERS (Atualização Automática de updated_at)
-- ============================================

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organization_memberships_updated_at BEFORE UPDATE ON organization_memberships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_bases_updated_at BEFORE UPDATE ON knowledge_bases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_rules_updated_at BEFORE UPDATE ON agent_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_behaviors_updated_at BEFORE UPDATE ON agent_behaviors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_sessions_updated_at BEFORE UPDATE ON agent_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_message_feedback_updated_at BEFORE UPDATE ON message_feedback FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approved_responses_updated_at BEFORE UPDATE ON approved_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vector_store_files_updated_at BEFORE UPDATE ON vector_store_files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assistant_runs_updated_at BEFORE UPDATE ON assistant_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scans_updated_at BEFORE UPDATE ON scans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scan_steps_updated_at BEFORE UPDATE ON scan_steps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organization_subscriptions_updated_at BEFORE UPDATE ON organization_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

-- 7.1. Organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem organizações que fazem parte"
  ON organizations FOR SELECT
  USING (
    id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Owners podem atualizar organizações"
  ON organizations FOR UPDATE
  USING (
    id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- 7.2. Organization Memberships
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seus próprios memberships"
  ON organization_memberships FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Owners e admins podem gerenciar memberships"
  ON organization_memberships FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 7.3. User Roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem sua própria role"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Super admins podem gerenciar roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- 7.4. User Preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários gerenciam suas próprias preferências"
  ON user_preferences FOR ALL
  USING (user_id = auth.uid());

-- 7.5. Agents
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem agentes das suas organizações ou globais"
  ON agents FOR SELECT
  USING (
    organization_id IS NULL OR
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Membros podem criar agentes"
  ON agents FOR INSERT
  WITH CHECK (
    organization_id IS NULL OR
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Owners e admins podem atualizar agentes"
  ON agents FOR UPDATE
  USING (
    organization_id IS NULL OR
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 7.6. Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas próprias conversas"
  ON conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem criar conversas"
  ON conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar suas conversas"
  ON conversations FOR UPDATE
  USING (user_id = auth.uid());

-- 7.7. Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem mensagens de suas conversas"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar mensagens"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- 7.8. Documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem documentos das suas organizações"
  ON documents FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar documentos"
  ON documents FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- 7.9. Knowledge Bases
ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem knowledge bases das suas organizações"
  ON knowledge_bases FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- 7.10. Scans
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem scans das suas organizações"
  ON scans FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Membros podem criar scans"
  ON scans FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Membros podem atualizar scans das suas organizações"
  ON scans FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- 7.11. Scan Steps
ALTER TABLE scan_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem steps dos scans das suas organizações"
  ON scan_steps FOR SELECT
  USING (
    scan_id IN (
      SELECT id FROM scans
      WHERE organization_id IN (
        SELECT organization_id FROM organization_memberships
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Membros podem criar steps"
  ON scan_steps FOR INSERT
  WITH CHECK (
    scan_id IN (
      SELECT id FROM scans
      WHERE organization_id IN (
        SELECT organization_id FROM organization_memberships
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Membros podem atualizar steps"
  ON scan_steps FOR UPDATE
  USING (
    scan_id IN (
      SELECT id FROM scans
      WHERE organization_id IN (
        SELECT organization_id FROM organization_memberships
        WHERE user_id = auth.uid()
      )
    )
  );

-- 7.12. Scan Step Documents
ALTER TABLE scan_step_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem documentos dos steps"
  ON scan_step_documents FOR SELECT
  USING (
    scan_step_id IN (
      SELECT id FROM scan_steps
      WHERE scan_id IN (
        SELECT id FROM scans
        WHERE organization_id IN (
          SELECT organization_id FROM organization_memberships
          WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Membros podem criar vínculos de documentos"
  ON scan_step_documents FOR INSERT
  WITH CHECK (
    scan_step_id IN (
      SELECT id FROM scan_steps
      WHERE scan_id IN (
        SELECT id FROM scans
        WHERE organization_id IN (
          SELECT organization_id FROM organization_memberships
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- 7.13. Webhooks
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem webhooks das suas organizações"
  ON webhooks FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- 7.14. Organization Subscriptions
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem assinaturas das suas organizações"
  ON organization_subscriptions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- 7.15. Payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem pagamentos das suas organizações"
  ON payments FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- 7.16. AI Gateway Logs
ALTER TABLE ai_gateway_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem logs das suas organizações"
  ON ai_gateway_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- 7.17. Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins podem ver audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- 7.18. Agent Rules
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

-- 7.19. Agent Behaviors
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

-- 7.20. Agent Sessions
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem suas próprias sessões"
  ON agent_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem criar sessões"
  ON agent_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 7.21. Agent Analytics
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

-- 7.22. Message Feedback
ALTER TABLE message_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem feedback de suas mensagens"
  ON message_feedback FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem criar feedback"
  ON message_feedback FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 7.23. Approved Responses
ALTER TABLE approved_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem respostas aprovadas de suas conversas"
  ON approved_responses FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- 7.24. Vector Store Files
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

-- 7.25. Assistant Runs
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

-- 7.26. Password Reset Tokens
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem seus próprios tokens"
  ON password_reset_tokens FOR SELECT
  USING (user_id = auth.uid());

-- ============================================
-- 8. DADOS INICIAIS (SEED)
-- ============================================

-- 8.1. Subscription Plans
INSERT INTO subscription_plans (id, name, slug, description, price_monthly, price_yearly, features, limits, is_active)
VALUES
  (
    'free',
    'Free',
    'free',
    'Plano gratuito com funcionalidades básicas',
    0.00,
    0.00,
    '["Agentes básicos", "10 conversas/mês", "Suporte por email"]'::jsonb,
    '{"agents": 3, "conversations_per_month": 10, "messages_per_conversation": 50}'::jsonb,
    true
  ),
  (
    'starter',
    'Starter',
    'starter',
    'Plano inicial para pequenas empresas',
    99.00,
    990.00,
    '["Agentes ilimitados", "100 conversas/mês", "Suporte prioritário", "API access"]'::jsonb,
    '{"agents": -1, "conversations_per_month": 100, "messages_per_conversation": 200}'::jsonb,
    true
  ),
  (
    'pro',
    'Pro',
    'pro',
    'Plano profissional para empresas em crescimento',
    299.00,
    2990.00,
    '["Tudo do Starter", "Conversas ilimitadas", "Suporte 24/7", "Analytics avançado", "Custom integrations"]'::jsonb,
    '{"agents": -1, "conversations_per_month": -1, "messages_per_conversation": -1}'::jsonb,
    true
  ),
  (
    'enterprise',
    'Enterprise',
    'enterprise',
    'Plano empresarial com recursos avançados',
    999.00,
    9990.00,
    '["Tudo do Pro", "Dedicated support", "SLA garantido", "Custom features", "On-premise option"]'::jsonb,
    '{"agents": -1, "conversations_per_month": -1, "messages_per_conversation": -1}'::jsonb,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 9. COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE organizations IS 'Organizações/Empresas dos clientes';
COMMENT ON TABLE organization_memberships IS 'Relacionamento muitos-para-muitos entre usuários e organizações com roles';
COMMENT ON TABLE user_roles IS 'Roles globais dos usuários (super_admin, etc)';
COMMENT ON TABLE agents IS 'Agentes de IA do sistema';
COMMENT ON TABLE conversations IS 'Conversas entre usuários e agentes';
COMMENT ON TABLE messages IS 'Mensagens das conversas';
COMMENT ON TABLE documents IS 'Documentos gerados pelo sistema';
COMMENT ON TABLE knowledge_bases IS 'Bases de conhecimento dos agentes';
COMMENT ON TABLE agent_rules IS 'Regras configuráveis para agentes';
COMMENT ON TABLE agent_behaviors IS 'Comportamentos configuráveis para agentes';
COMMENT ON TABLE agent_sessions IS 'Sessões de uso de agentes';
COMMENT ON TABLE agent_analytics IS 'Métricas e analytics de agentes';
COMMENT ON TABLE message_feedback IS 'Feedback dos usuários sobre mensagens';
COMMENT ON TABLE approved_responses IS 'Respostas aprovadas pelos usuários';
COMMENT ON TABLE vector_store_files IS 'Arquivos sincronizados com OpenAI Vector Store';
COMMENT ON TABLE assistant_runs IS 'Execuções de OpenAI Assistants';
COMMENT ON TABLE password_reset_tokens IS 'Tokens para recuperação de senha';
COMMENT ON TABLE scans IS 'Jornadas Scan (workflows completos)';
COMMENT ON TABLE scan_steps IS 'Etapas individuais de uma jornada scan (agent, document, autonomous, synthetic)';
COMMENT ON TABLE scan_step_documents IS 'Vínculos entre documentos e etapas da jornada scan';
COMMENT ON COLUMN agents.openai_thread_id IS 'ID do thread OpenAI para conversas contínuas';
COMMENT ON COLUMN agents.last_session IS 'Data da última sessão do agente';
COMMENT ON COLUMN agents.openai_synced_at IS 'Data da última sincronização com OpenAI';
COMMENT ON COLUMN organizations.owner_id IS 'ID do usuário dono da organização';
COMMENT ON COLUMN webhooks.event_type IS 'Tipo de evento (campo auxiliar além de events[])';
COMMENT ON COLUMN conversations.message_count IS 'Número de mensagens na conversa';
COMMENT ON COLUMN conversations.last_message_at IS 'Data da última mensagem na conversa';
COMMENT ON COLUMN scan_steps.step_type IS 'Tipo de etapa: agent (conversacional), document (manual), autonomous (automático), synthetic (compilação)';
COMMENT ON COLUMN scan_steps.depends_on_step_ids IS 'IDs das etapas que devem estar completas antes desta';
COMMENT ON COLUMN scan_steps.input_document_ids IS 'IDs dos documentos que servem como input para esta etapa';
COMMENT ON COLUMN scan_steps.output_document_id IS 'ID do documento gerado por esta etapa';
COMMENT ON COLUMN scan_steps.document_template_url IS 'URL do template de documento para etapas do tipo document';
COMMENT ON COLUMN scan_steps.manual_document_uploaded IS 'Se true, documento manual foi enviado pelo cliente';
COMMENT ON COLUMN scan_steps.auto_execute IS 'Se true, etapa deve executar automaticamente quando inputs estiverem prontos';

-- ============================================
-- FIM DO SCRIPT
-- ============================================

