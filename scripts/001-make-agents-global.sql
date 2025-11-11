-- Permitir agentes globais removendo NOT NULL de organization_id e user_id
-- Isso permite que agentes sejam criados sem vinculação a organizações específicas

ALTER TABLE agents 
ALTER COLUMN organization_id DROP NOT NULL,
ALTER COLUMN user_id DROP NOT NULL;

-- Adicionar comentário para documentar que agentes podem ser globais
COMMENT ON COLUMN agents.organization_id IS 'ID da organização (null para agentes globais criados pelo super_admin)';
COMMENT ON COLUMN agents.user_id IS 'ID do usuário (null para agentes globais criados pelo super_admin)';
