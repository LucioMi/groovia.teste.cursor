-- Create scans table for organization-level journeys
CREATE TABLE IF NOT EXISTS scans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Novo SCAN',
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'archived')),
  current_agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create scan_steps to track progress within each scan
CREATE TABLE IF NOT EXISTS scan_steps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  scan_id TEXT NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  conversation_id TEXT REFERENCES conversations(id) ON DELETE SET NULL,
  step_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved', 'rejected')),
  document_url TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(scan_id, agent_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scans_organization ON scans(organization_id);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_created_by ON scans(created_by);
CREATE INDEX IF NOT EXISTS idx_scan_steps_scan_id ON scan_steps(scan_id);
CREATE INDEX IF NOT EXISTS idx_scan_steps_status ON scan_steps(status);

-- Enable RLS
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_steps ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scans
CREATE POLICY "Membros veem scans das suas organizações"
  ON scans FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Membros podem criar scans"
  ON scans FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Membros podem atualizar scans das suas organizações"
  ON scans FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for scan_steps
CREATE POLICY "Membros veem steps dos scans das suas organizações"
  ON scan_steps FOR SELECT
  USING (
    scan_id IN (
      SELECT id FROM scans 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM organization_memberships 
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
        SELECT organization_id 
        FROM organization_memberships 
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
        SELECT organization_id 
        FROM organization_memberships 
        WHERE user_id = auth.uid()
      )
    )
  );
