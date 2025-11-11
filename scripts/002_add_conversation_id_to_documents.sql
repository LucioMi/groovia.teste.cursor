-- Add conversation_id column to documents table
ALTER TABLE documents 
ADD COLUMN conversation_id text;

-- Add foreign key constraint
ALTER TABLE documents
ADD CONSTRAINT documents_conversation_id_fkey 
FOREIGN KEY (conversation_id) 
REFERENCES conversations(id) 
ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX idx_documents_conversation_id ON documents(conversation_id);

-- Update existing documents to link them to conversations if possible
-- This attempts to match documents to conversations by agent_id and user_id
UPDATE documents d
SET conversation_id = (
  SELECT c.id 
  FROM conversations c 
  WHERE c.agent_id = d.agent_id 
    AND c.user_id = d.user_id
  ORDER BY c.created_at DESC
  LIMIT 1
)
WHERE d.conversation_id IS NULL;
