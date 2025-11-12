-- Remove NOT NULL constraint da coluna organization_id e user_id na tabela agents
-- Isso permite que agentes sejam globais (não vinculados a organizações específicas)
-- Apenas super_admins podem criar agentes globais

ALTER TABLE agents 
ALTER COLUMN organization_id DROP NOT NULL,
ALTER COLUMN user_id DROP NOT NULL;

-- Comentário para confirmar execução
SELECT 'Agentes agora podem ser globais (organization_id e user_id podem ser NULL)' as status;
