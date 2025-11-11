-- Add openai_thread_id column to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS openai_thread_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_conversations_openai_thread_id 
ON conversations(openai_thread_id);

-- Add comment
COMMENT ON COLUMN conversations.openai_thread_id IS 'ID do thread da OpenAI Assistants API';
