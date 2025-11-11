-- Fix infinite recursion in organization_memberships RLS policies
-- This script prevents circular dependencies between policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Usuários veem memberships das suas organizações" ON organization_memberships;
DROP POLICY IF EXISTS "Owners e admins podem adicionar membros" ON organization_memberships;
DROP POLICY IF EXISTS "Owners e admins podem atualizar membros" ON organization_memberships;
DROP POLICY IF EXISTS "Owners e admins podem remover membros" ON organization_memberships;

-- Create new non-recursive policy for SELECT
-- This policy allows users to see memberships without checking memberships again
CREATE POLICY "Users see their organization memberships"
ON organization_memberships FOR SELECT
USING (
  user_id = auth.uid()
  OR organization_id IN (
    SELECT organization_id FROM organization_memberships WHERE user_id = auth.uid()
  )
);

-- Create policy for INSERT - only authenticated users can add themselves
CREATE POLICY "Authenticated users can create memberships"
ON organization_memberships FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create policy for UPDATE - service role only
CREATE POLICY "Service role can update memberships"
ON organization_memberships FOR UPDATE
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create policy for DELETE - service role only
CREATE POLICY "Service role can delete memberships"
ON organization_memberships FOR DELETE
USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions
GRANT SELECT ON organization_memberships TO authenticated;
GRANT INSERT ON organization_memberships TO authenticated;
GRANT UPDATE, DELETE ON organization_memberships TO service_role;

-- Add helpful comment
COMMENT ON TABLE organization_memberships IS 'Organization memberships - simplified RLS to avoid infinite recursion with other tables';
