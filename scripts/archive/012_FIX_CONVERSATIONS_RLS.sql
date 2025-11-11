-- Fix RLS policies to prevent recursion issues when loading conversations
-- This ensures users can properly load their conversation history

BEGIN;

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Usuários veem suas conversas" ON conversations;
DROP POLICY IF EXISTS "Usuários podem deletar suas conversas" ON conversations;
DROP POLICY IF EXISTS "Usuários podem criar conversas" ON conversations;
DROP POLICY IF EXISTS "Usuários podem atualizar suas conversas" ON conversations;

-- Create simplified RLS policies for conversations table
-- SELECT: Users can see their own conversations
CREATE POLICY "users_select_own_conversations"
  ON conversations
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: Users can create conversations
CREATE POLICY "users_insert_conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: Users can update their own conversations
CREATE POLICY "users_update_own_conversations"
  ON conversations
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Users can delete their own conversations
CREATE POLICY "users_delete_own_conversations"
  ON conversations
  FOR DELETE
  USING (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'conversations';
