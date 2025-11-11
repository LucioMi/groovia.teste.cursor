-- Step 1: Check if the specific agent exists
SELECT 
  id, 
  name, 
  status, 
  organization_id,
  created_at,
  updated_at
FROM agents 
WHERE id = '61e2e0b6-efd0-4a66-adf5-f4f562603c80';

-- Step 2: List ALL agents in the database
SELECT 
  id, 
  name, 
  status, 
  organization_id,
  category,
  created_at
FROM agents
ORDER BY created_at DESC
LIMIT 20;

-- Step 3: Check scan_steps that reference this agent
SELECT 
  ss.id as step_id,
  ss.step_order,
  ss.agent_id,
  ss.scan_id,
  ss.status as step_status,
  a.name as agent_name,
  a.status as agent_status
FROM scan_steps ss
LEFT JOIN agents a ON ss.agent_id = a.id
WHERE ss.agent_id = '61e2e0b6-efd0-4a66-adf5-f4f562603c80'
ORDER BY ss.step_order;

-- Step 4: Check if there are orphaned scan_steps (referencing non-existent agents)
SELECT 
  ss.id,
  ss.step_order,
  ss.agent_id,
  ss.scan_id,
  ss.status
FROM scan_steps ss
LEFT JOIN agents a ON ss.agent_id = a.id
WHERE a.id IS NULL;

-- Step 5: Count total agents vs scan_steps
SELECT 
  'Total Agents' as metric,
  COUNT(*) as count
FROM agents
UNION ALL
SELECT 
  'Total Scan Steps' as metric,
  COUNT(*) as count
FROM scan_steps
UNION ALL
SELECT 
  'Orphaned Scan Steps' as metric,
  COUNT(*) as count
FROM scan_steps ss
LEFT JOIN agents a ON ss.agent_id = a.id
WHERE a.id IS NULL;
