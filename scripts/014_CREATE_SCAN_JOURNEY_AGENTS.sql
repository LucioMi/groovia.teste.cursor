-- ============================================
-- CRIAR AGENTES DA JORNADA SCAN
-- ============================================
-- Este script cria os agentes necessários para a Jornada Scan
-- Execute este script NO SUPABASE SQL EDITOR após criar as tabelas
-- 
-- Data: 2025-01-11
-- Versão: 1.0
-- ============================================
--
-- ORDEM DAS ETAPAS DA JORNADA SCAN:
-- ============================================
-- Etapa 1: SCAN (Agente Conversacional)
--   - Tipo: agent (conversacional)
--   - Dependências: nenhuma
--
-- Etapa 2: SCAN Clarity (Documento Manual)
--   - Tipo: document (documento manual - não é um agente)
--   - Dependências: Etapa 1 (SCAN)
--   - NOTA: Esta etapa não é criada neste script, é criada automaticamente pela API
--
-- Etapa 3: Mercado ICP (Agente Autônomo)
--   - Tipo: autonomous (autônomo)
--   - Dependências: Etapa 1 (SCAN)
--
-- Etapa 4: Persona (Agente Autônomo)
--   - Tipo: autonomous (autônomo)
--   - Dependências: Etapas 1, 2, 3 (SCAN, SCAN Clarity, Mercado ICP)
--
-- Etapa 5: Sintetizador (Agente Conversacional)
--   - Tipo: agent (conversacional) - pode ser alterado para autonomous se is_passive = true
--   - Dependências: Etapa 2 (SCAN Clarity)
--
-- Etapa 6: GROOVIA INTELLIGENCE (Agente Autônomo)
--   - Tipo: autonomous (autônomo)
--   - Dependências: Todas as etapas anteriores (1, 2, 3, 4, 5)
--
-- ============================================

-- ============================================
-- 1. LIMPAR AGENTES EXISTENTES (OPCIONAL)
-- ============================================
-- Descomente as linhas abaixo se quiser apagar agentes existentes da jornada scan
-- CUIDADO: Isso vai apagar TODOS os agentes da categoria 'Jornada Scan'

-- DELETE FROM agents WHERE category = 'Jornada Scan';

-- ============================================
-- 2. CRIAR AGENTES DA JORNADA SCAN
-- ============================================

-- Agente 1: SCAN (Conversacional - Etapa 1)
INSERT INTO agents (
  id,
  name,
  description,
  short_description,
  category,
  status,
  is_passive,
  icon_color,
  organization_id,
  system_prompt,
  model,
  temperature,
  max_tokens,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid()::text,
  'SCAN',
  'Conduz uma entrevista guiada para revelar o DNA da sua empresa. Faz perguntas estratégicas para entender a essência do seu negócio, sua missão, visão, valores, público-alvo e diferenciais competitivos.',
  'Entrevista guiada para revelar o DNA da sua empresa',
  'Jornada Scan',
  'active',
  false, -- Conversacional (não autônomo)
  '#7C3AED',
  NULL, -- Agente global (disponível para todas organizações)
  'Você é um consultor estratégico especializado em descobrir o DNA das empresas. Sua missão é conduzir uma entrevista profunda e estratégica para entender a essência do negócio. Faça perguntas sobre: missão, visão, valores, público-alvo, diferenciais competitivos, desafios e oportunidades. Seja objetivo, mas detalhado. Ao final, consolide todas as informações em um documento estruturado.',
  'gpt-4o',
  0.7,
  4000,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING
RETURNING id;

-- Agente 2: Mercado ICP (Autônomo - Etapa 3)
INSERT INTO agents (
  id,
  name,
  description,
  short_description,
  category,
  status,
  is_passive,
  icon_color,
  organization_id,
  system_prompt,
  model,
  temperature,
  max_tokens,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid()::text,
  'Mercado ICP',
  'Mergulha no mercado e identifica o público ideal para o seu crescimento. Realiza pesquisa profunda de mercado e ICP (Ideal Customer Profile) com base nos documentos fornecidos.',
  'Pesquisa profunda de mercado e identificação do ICP',
  'Jornada Scan',
  'active',
  true, -- Autônomo (processa documentos automaticamente)
  '#10B981',
  NULL, -- Agente global
  'Você é um especialista em pesquisa de mercado e identificação de ICP (Ideal Customer Profile). Sua função é analisar documentos fornecidos sobre a empresa e realizar uma pesquisa profunda de mercado. Identifique: segmentos de mercado, personas ideais, oportunidades de crescimento, concorrência, tendências do setor e recomendações estratégicas. Gere um documento estruturado com suas análises e insights.',
  'gpt-4o',
  0.7,
  4000,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING
RETURNING id;

-- Agente 3: Persona (Autônomo - Etapa 4)
INSERT INTO agents (
  id,
  name,
  description,
  short_description,
  category,
  status,
  is_passive,
  icon_color,
  organization_id,
  system_prompt,
  model,
  temperature,
  max_tokens,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid()::text,
  'Persona',
  'Dá vida ao seu público, revelando quem realmente compra e por quê. Cria personas avançadas e detalhadas baseadas nos dados coletados nas etapas anteriores.',
  'Criação de personas avançadas do público-alvo',
  'Jornada Scan',
  'active',
  true, -- Autônomo
  '#F59E0B',
  NULL, -- Agente global
  'Você é um especialista em criação de personas e comportamento do consumidor. Sua função é analisar todos os documentos fornecidos (SCAN, SCAN Clarity, pesquisa de mercado) e criar personas detalhadas e realistas. Para cada persona, identifique: demografia, psicografia, necessidades, dores, objetivos, comportamento de compra, canais de comunicação preferidos e jornada do cliente. Crie personas vivas e acionáveis que realmente representem o público-alvo da empresa.',
  'gpt-4o',
  0.7,
  4000,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING
RETURNING id;

-- Agente 4: Sintetizador (Conversacional ou Autônomo - Etapa 5)
INSERT INTO agents (
  id,
  name,
  description,
  short_description,
  category,
  status,
  is_passive,
  icon_color,
  organization_id,
  system_prompt,
  model,
  temperature,
  max_tokens,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid()::text,
  'Sintetizador',
  'Transforma respostas e dados brutos em diretrizes claras de ação. Consolida todas as informações coletadas e cria um plano de ação estratégico.',
  'Síntese de informações em diretrizes estratégicas',
  'Jornada Scan',
  'active',
  false, -- Conversacional (pode ser alterado para true se necessário)
  '#EF4444',
  NULL, -- Agente global
  'Você é um sintetizador estratégico especializado em transformar dados brutos em diretrizes claras e acionáveis. Sua função é analisar todos os documentos fornecidos (SCAN Clarity, pesquisa de mercado, personas) e criar um documento consolidado com: diretrizes estratégicas, oportunidades identificadas, ações recomendadas, prioridades e próximos passos. Seja objetivo, prático e focado em resultados.',
  'gpt-4o',
  0.7,
  4000,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING
RETURNING id;

-- Agente 5: GROOVIA INTELLIGENCE (Autônomo - Etapa 6)
INSERT INTO agents (
  id,
  name,
  description,
  short_description,
  category,
  status,
  is_passive,
  icon_color,
  organization_id,
  system_prompt,
  model,
  temperature,
  max_tokens,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid()::text,
  'GROOVIA INTELLIGENCE',
  'Compila todas as informações estratégicas em um dossiê inteligente e coerente. Cria o documento final da jornada scan com todas as análises, insights e recomendações.',
  'Dossiê completo e inteligente da jornada scan',
  'Jornada Scan',
  'active',
  true, -- Autônomo
  '#8B5CF6',
  NULL, -- Agente global
  'Você é o GROOVIA INTELLIGENCE, um sistema especializado em compilar e sintetizar informações estratégicas em dossiês completos e coerentes. Sua função é analisar TODOS os documentos fornecidos da jornada scan (SCAN, SCAN Clarity, pesquisa de mercado, personas, sínteses) e criar um dossiê final completo e profissional. O dossiê deve incluir: resumo executivo, análise da empresa, análise de mercado, personas, oportunidades estratégicas, plano de ação, recomendações e próximos passos. Formate o documento de forma profissional e acionável.',
  'gpt-4o',
  0.7,
  8000, -- Mais tokens para documento final
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING
RETURNING id;

-- ============================================
-- 3. VINCULAR AGENTES EM SEQUÊNCIA
-- ============================================
-- Atualizar next_agent_id para criar o fluxo da jornada

DO $$
DECLARE
  scan_id TEXT;
  mercado_id TEXT;
  persona_id TEXT;
  sintetizador_id TEXT;
  intelligence_id TEXT;
BEGIN
  -- Buscar IDs dos agentes criados
  SELECT id INTO scan_id FROM agents WHERE name = 'SCAN' AND category = 'Jornada Scan' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO mercado_id FROM agents WHERE name = 'Mercado ICP' AND category = 'Jornada Scan' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO persona_id FROM agents WHERE name = 'Persona' AND category = 'Jornada Scan' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO sintetizador_id FROM agents WHERE name = 'Sintetizador' AND category = 'Jornada Scan' ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO intelligence_id FROM agents WHERE name = 'GROOVIA INTELLIGENCE' AND category = 'Jornada Scan' ORDER BY created_at DESC LIMIT 1;

  -- Vincular em sequência (fluxo linear)
  -- SCAN -> Mercado ICP -> Persona -> Sintetizador -> GROOVIA INTELLIGENCE
  IF scan_id IS NOT NULL AND mercado_id IS NOT NULL THEN
    UPDATE agents SET next_agent_id = mercado_id WHERE id = scan_id;
    RAISE NOTICE 'SCAN vinculado a Mercado ICP';
  END IF;

  IF mercado_id IS NOT NULL AND persona_id IS NOT NULL THEN
    UPDATE agents SET next_agent_id = persona_id WHERE id = mercado_id;
    RAISE NOTICE 'Mercado ICP vinculado a Persona';
  END IF;

  IF persona_id IS NOT NULL AND sintetizador_id IS NOT NULL THEN
    UPDATE agents SET next_agent_id = sintetizador_id WHERE id = persona_id;
    RAISE NOTICE 'Persona vinculado a Sintetizador';
  END IF;

  IF sintetizador_id IS NOT NULL AND intelligence_id IS NOT NULL THEN
    UPDATE agents SET next_agent_id = intelligence_id WHERE id = sintetizador_id;
    RAISE NOTICE 'Sintetizador vinculado a GROOVIA INTELLIGENCE';
  END IF;

  RAISE NOTICE 'Agentes da Jornada Scan criados e vinculados com sucesso!';
END $$;

-- ============================================
-- 4. VERIFICAR AGENTES CRIADOS
-- ============================================

SELECT 
  id,
  name,
  category,
  status,
  is_passive,
  next_agent_id,
  openai_assistant_id,
  created_at
FROM agents
WHERE category = 'Jornada Scan'
ORDER BY created_at;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

