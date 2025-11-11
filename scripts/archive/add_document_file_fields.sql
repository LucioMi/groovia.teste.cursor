-- Add new fields to documents table for proper file storage
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_user_org ON documents(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_agent ON documents(agent_id);

-- Add comment for documentation
COMMENT ON COLUMN documents.file_url IS 'URL do arquivo armazenado no Vercel Blob';
COMMENT ON COLUMN documents.file_type IS 'MIME type do arquivo (ex: text/markdown, application/pdf)';
COMMENT ON COLUMN documents.file_size IS 'Tamanho do arquivo em bytes';
COMMENT ON COLUMN documents.content IS 'Conteúdo textual do documento (usado para busca)';
