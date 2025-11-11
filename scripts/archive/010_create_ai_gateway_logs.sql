-- Create AI Gateway Logs table
CREATE TABLE IF NOT EXISTS public.ai_gateway_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  assistant_id TEXT NOT NULL,
  thread_id TEXT,
  run_id TEXT,
  agent_id TEXT,
  conversation_id TEXT,
  organization_id TEXT,
  user_id UUID,
  
  -- Request data
  prompt TEXT,
  request_payload JSONB,
  
  -- Response data
  response_payload JSONB,
  response_text TEXT,
  
  -- Metadata
  model TEXT,
  tokens_used INTEGER,
  latency_ms INTEGER,
  status TEXT, -- success, error, timeout
  error_message TEXT,
  
  -- Gateway info
  gateway_endpoint TEXT,
  cache_hit BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Foreign keys
  CONSTRAINT fk_agent FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
  CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ai_gateway_logs_assistant_id ON public.ai_gateway_logs(assistant_id);
CREATE INDEX IF NOT EXISTS idx_ai_gateway_logs_agent_id ON public.ai_gateway_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_gateway_logs_conversation_id ON public.ai_gateway_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_gateway_logs_organization_id ON public.ai_gateway_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_gateway_logs_created_at ON public.ai_gateway_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_gateway_logs_status ON public.ai_gateway_logs(status);

-- Enable RLS
ALTER TABLE public.ai_gateway_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Membros veem logs das suas organizações
CREATE POLICY "Membros veem logs das suas organizações"
ON public.ai_gateway_logs
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_memberships 
    WHERE user_id = auth.uid()
  )
);

-- Policy: Service role pode inserir logs
CREATE POLICY "Service role pode inserir logs"
ON public.ai_gateway_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE public.ai_gateway_logs IS 'Logs de todas as chamadas feitas ao Vercel AI Gateway para monitoramento e debugging';
