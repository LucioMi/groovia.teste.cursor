-- Fix infinite recursion in user_roles RLS policies
-- This script removes the recursive policies and creates new ones that don't cause infinite loops

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can see their own role" ON user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON user_roles;

-- Create new non-recursive policies
-- Allow users to see their own role without any complex checks
CREATE POLICY "Users can view their own role"
ON user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Allow service role (backend) to manage all roles
-- This prevents recursion because it doesn't check user_roles table again
CREATE POLICY "Service role can manage all roles"
ON user_roles FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions
GRANT SELECT ON user_roles TO authenticated;
GRANT ALL ON user_roles TO service_role;

-- Add helpful comment
COMMENT ON TABLE user_roles IS 'User roles table - uses simple RLS policies to avoid infinite recursion';
