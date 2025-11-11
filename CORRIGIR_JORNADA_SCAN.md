# 🔧 Como Corrigir o Problema da Jornada Scan

## Problema Identificado

A Jornada Scan estava aparecendo como "Jornada Concluída!" mesmo quando não deveria estar. Isso acontecia por dois motivos:

1. **Bug na lógica da página**: Quando não havia steps carregados, a condição `steps.every((s) => s.completed)` retornava `true` (array vazio sempre passa no `.every()`)
2. **API retornando dados incorretos**: A API estava usando uma tabela que não existia (`journey_progress`), então sempre retornava vazio, mas havia possibilidade de scans marcados incorretamente como "completed" no banco

## Correções Aplicadas

✅ **Página corrigida**: Agora verifica `steps.length > 0` antes de verificar se todos estão completos
✅ **API atualizada**: Agora usa o sistema de `scans` e `scan_steps` do banco de dados
✅ **Verificação de status**: A API só retorna progresso de scans com status `in_progress`

## Como Verificar e Corrigir no Banco de Dados

### Passo 1: Verificar Scans no Banco

Execute este SQL no Supabase SQL Editor:

```sql
-- Ver todos os scans da sua organização
SELECT 
  id,
  organization_id,
  status,
  completed_at,
  created_at,
  (SELECT COUNT(*) FROM scan_steps WHERE scan_id = scans.id) as total_steps,
  (SELECT COUNT(*) FROM scan_steps WHERE scan_id = scans.id AND status IN ('completed', 'approved')) as completed_steps
FROM scans
ORDER BY created_at DESC;
```

### Passo 2: Verificar Scans Marcados Incorretamente como "completed"

```sql
-- Encontrar scans marcados como completed mas que não deveriam estar
SELECT 
  s.id,
  s.organization_id,
  s.status,
  s.completed_at,
  COUNT(ss.id) as total_steps,
  COUNT(CASE WHEN ss.status IN ('completed', 'approved') THEN 1 END) as completed_steps
FROM scans s
LEFT JOIN scan_steps ss ON ss.scan_id = s.id
WHERE s.status = 'completed'
GROUP BY s.id, s.organization_id, s.status, s.completed_at
HAVING 
  COUNT(ss.id) = 0 
  OR COUNT(CASE WHEN ss.status IN ('completed', 'approved') THEN 1 END) < COUNT(ss.id);
```

### Passo 3: Resetar Scans Incorretos

Se você encontrar scans marcados incorretamente como "completed", execute este SQL para resetá-los:

```sql
-- Resetar scans que estão marcados como completed mas não deveriam estar
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
```

### Passo 4: Verificar se Há Scan Ativo

```sql
-- Verificar se há scan ativo (in_progress) para sua organização
-- Substitua 'SUA_ORGANIZATION_ID' pelo ID da sua organização
SELECT 
  id,
  organization_id,
  status,
  created_at,
  (SELECT COUNT(*) FROM scan_steps WHERE scan_id = scans.id) as total_steps
FROM scans
WHERE organization_id = 'SUA_ORGANIZATION_ID'
  AND status = 'in_progress'
ORDER BY created_at DESC
LIMIT 1;
```

### Passo 5: Criar Novo Scan (Se Necessário)

Se não houver scan ativo, você pode criar um novo através da interface da aplicação ou executar este SQL:

```sql
-- Criar novo scan (substitua os valores)
INSERT INTO scans (
  organization_id,
  created_by,
  title,
  status,
  current_agent_id
)
VALUES (
  'SUA_ORGANIZATION_ID',  -- ID da sua organização
  'SEU_USER_ID',           -- ID do usuário (UUID)
  'Novo SCAN',
  'in_progress',
  NULL  -- Será preenchido automaticamente quando os steps forem criados
)
RETURNING *;
```

## Como a Jornada Scan Funciona Agora

1. **Ao carregar a página**: 
   - Busca agentes ativos
   - Busca scan ativo (status = 'in_progress') da organização
   - Se não houver scan ativo, mostra a jornada vazia (não concluída)

2. **Ao completar um step**:
   - Marca o `scan_step` correspondente como "completed"
   - Atualiza o progresso na página

3. **Quando todos os steps estão completos**:
   - O scan é marcado como "completed" automaticamente
   - A página mostra "Jornada Concluída!"

## Verificação Final

Após aplicar as correções:

1. ✅ A página não deve mostrar "Jornada Concluída" quando não há steps
2. ✅ A API deve retornar apenas progresso de scans ativos
3. ✅ Scans marcados incorretamente devem ser resetados

## Script SQL Completo

Você pode usar o script `scripts/013_FIX_SCANS_STATUS.sql` para diagnosticar e corrigir problemas no banco de dados.

## Próximos Passos

1. Execute as queries de verificação no Supabase
2. Se encontrar scans incorretos, execute o script de reset
3. Teste a jornada scan na aplicação
4. Se o problema persistir, verifique os logs do console do navegador

## Suporte

Se o problema continuar após seguir estes passos, verifique:
- Logs do console do navegador (F12)
- Logs da API no Vercel
- Status dos scans no banco de dados

