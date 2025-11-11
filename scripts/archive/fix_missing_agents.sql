-- Check if the agent exists
SELECT id, name, status, organization_id 
FROM agents 
WHERE id = '61e2e0b6-efd0-4a66-adf5-f4f562603c80';

-- List all agents to see what's available
SELECT id, name, status, organization_id, created_at
FROM agents
ORDER BY created_at DESC;

-- If the agent doesn't exist, you may need to check the scan_steps table
-- to see what agent_id the scan is expecting
SELECT s.id, s.step_order, s.agent_id, s.scan_id, a.name as agent_name
FROM scan_steps s
LEFT JOIN agents a ON s.agent_id = a.id
WHERE s.agent_id = '61e2e0b6-efd0-4a66-adf5-f4f562603c80';
