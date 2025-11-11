-- Script para verificar e corrigir scans marcados incorretamente como completed
-- Execute este script no Supabase SQL Editor se houver scans marcados como completed
-- quando não deveriam estar

-- 1. Verificar scans marcados como completed
SELECT 
  id,
  organization_id,
  status,
  completed_at,
  created_at,
  (SELECT COUNT(*) FROM scan_steps WHERE scan_id = scans.id AND status IN ('completed', 'approved')) as completed_steps_count,
  (SELECT COUNT(*) FROM scan_steps WHERE scan_id = scans.id) as total_steps_count
FROM scans
WHERE status = 'completed'
ORDER BY created_at DESC;

-- 2. Verificar se há scans com todos os steps completos mas status não está como completed
SELECT 
  s.id,
  s.organization_id,
  s.status,
  COUNT(ss.id) as total_steps,
  COUNT(CASE WHEN ss.status IN ('completed', 'approved') THEN 1 END) as completed_steps
FROM scans s
LEFT JOIN scan_steps ss ON ss.scan_id = s.id
WHERE s.status = 'in_progress'
GROUP BY s.id, s.organization_id, s.status
HAVING COUNT(ss.id) > 0 AND COUNT(CASE WHEN ss.status IN ('completed', 'approved') THEN 1 END) = COUNT(ss.id);

-- 3. Resetar scans que estão marcados como completed mas não deveriam estar
-- ATENÇÃO: Descomente apenas se você quiser resetar os scans
-- Isso vai mudar o status de 'completed' para 'in_progress' se nem todos os steps estiverem completos

/*
UPDATE scans
SET 
  status = 'in_progress',
  completed_at = NULL,
  updated_at = NOW()
WHERE id IN (
  SELECT s.id
  FROM scans s
  LEFT JOIN scan_steps ss ON ss.scan_id = s.id
  WHERE s.status = 'completed'
  GROUP BY s.id
  HAVING 
    COUNT(ss.id) = 0 
    OR COUNT(CASE WHEN ss.status IN ('completed', 'approved') THEN 1 END) < COUNT(ss.id)
);
*/

-- 4. Verificar scans sem steps (estes devem ser resetados ou ter steps criados)
SELECT 
  s.id,
  s.organization_id,
  s.status,
  s.created_at,
  COUNT(ss.id) as steps_count
FROM scans s
LEFT JOIN scan_steps ss ON ss.scan_id = s.id
WHERE s.status = 'completed'
GROUP BY s.id, s.organization_id, s.status, s.created_at
HAVING COUNT(ss.id) = 0;

-- 5. Opcional: Deletar scans órfãos (sem steps e antigos)
-- ATENÇÃO: Use com cuidado, isso vai deletar dados permanentemente
/*
DELETE FROM scans
WHERE id IN (
  SELECT s.id
  FROM scans s
  LEFT JOIN scan_steps ss ON ss.scan_id = s.id
  WHERE s.status = 'completed'
    AND COUNT(ss.id) = 0
    AND s.created_at < NOW() - INTERVAL '30 days'
  GROUP BY s.id
);
*/

