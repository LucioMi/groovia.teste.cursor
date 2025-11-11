-- Create audit_logs table for tracking all admin and user actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout', etc.
  resource_type TEXT NOT NULL, -- 'user', 'agent', 'organization', 'subscription', etc.
  resource_id TEXT,
  actor_id TEXT NOT NULL, -- User or admin who performed the action
  actor_type TEXT NOT NULL, -- 'user', 'super_admin', 'system'
  actor_email TEXT,
  organization_id TEXT, -- For organization-scoped actions
  changes JSONB, -- Before/after state or relevant details
  metadata JSONB, -- Additional context like IP address, user agent, etc.
  status TEXT DEFAULT 'success', -- 'success', 'failure'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization_id ON audit_logs(organization_id);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only super_admins can view audit logs
CREATE POLICY "Super admins can view all audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'super_admin'
  )
);

-- Policy: System can insert audit logs
CREATE POLICY "Service role can insert audit logs"
ON audit_logs FOR INSERT
TO service_role
WITH CHECK (true);

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all system actions';
COMMENT ON COLUMN audit_logs.action_type IS 'Type of action performed (create, update, delete, login, etc.)';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (user, agent, organization, etc.)';
COMMENT ON COLUMN audit_logs.actor_id IS 'ID of the user/admin who performed the action';
COMMENT ON COLUMN audit_logs.changes IS 'JSON object containing before/after states or relevant changes';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional contextual information like IP address, user agent';
