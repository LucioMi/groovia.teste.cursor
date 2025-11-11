-- Adiciona coluna is_passive para controlar se o agente é passivo ou interativo
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS is_passive BOOLEAN DEFAULT false;

-- Adiciona coluna short_description para descrição curta que aparece nos cards
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS short_description TEXT;

COMMENT ON COLUMN agents.is_passive IS 'Se true, agente é passivo (executa automaticamente). Se false, agente requer interação do usuário.';
COMMENT ON COLUMN agents.short_description IS 'Descrição curta para exibição nos cards da jornada (ao invés do system_prompt)';
