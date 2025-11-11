-- Adicionar coluna openai_thread_id na tabela conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS openai_thread_id TEXT;

-- Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_conversations_openai_thread_id 
ON conversations(openai_thread_id);

-- Adicionar comentários nas colunas
COMMENT ON COLUMN conversations.openai_thread_id IS 'ID da thread do OpenAI Assistants API associada a esta conversa';
COMMENT ON COLUMN agents.openai_assistant_id IS 'ID do assistente no OpenAI Assistants API';
COMMENT ON COLUMN agents.openai_thread_id IS 'ID da thread padrão do agente (se houver)';
COMMENT ON COLUMN agents.openai_vector_store_id IS 'ID do vector store associado ao agente';
