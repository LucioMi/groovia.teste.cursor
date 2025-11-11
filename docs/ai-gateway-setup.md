# Vercel AI Gateway - Guia de Configuração

## 📋 Visão Geral

O **Vercel AI Gateway** atua como uma camada intermediária inteligente entre o aplicativo e a OpenAI, fornecendo:

- ✅ **Cache** de respostas para reduzir latência e custos
- ✅ **Rate Limiting** e controle de custos
- ✅ **Observabilidade** completa com logs e métricas
- ✅ **Segurança** centralizada (API keys nunca expostas)
- ✅ **Fallback** automático em caso de falhas

## 🏗️ Arquitetura

\`\`\`
┌─────────────┐
│   Frontend  │
│  (v0 App)   │
└──────┬──────┘
       │ HTTP Request
       ↓
┌─────────────────────┐
│   Backend API       │
│ /api/agents/[id]/   │
│       chat          │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│ Vercel AI Gateway   │
│ (Proxy + Cache)     │
└──────┬──────────────┘
       │
       ├──→ OpenAI API
       │    /v1/assistants
       │    /v1/threads
       │    /v1/runs
       │
       └──→ Supabase
            (Logs + Analytics)
\`\`\`

## 🔧 Configuração

### 1. Criar Gateway no Painel da Vercel

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Vá em **AI Gateway** no menu lateral
3. Clique em **Create Gateway**
4. Copie o **Gateway ID** e a **Gateway API Key**

### 2. Configurar Variáveis de Ambiente

Adicione as seguintes variáveis no seu projeto Vercel:

\`\`\`bash
# Vercel AI Gateway
OPENAI_GATEWAY_URL=https://ai-gateway.vercel.com/api/gateway/{GATEWAY_ID}
GATEWAY_API_KEY=sua_gateway_api_key_aqui

# OpenAI (fallback se Gateway não configurado)
OPENAI_API_KEY=sua_openai_api_key_aqui

# Supabase (para logs)
SUPABASE_URL=https://{project}.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
\`\`\`

**⚠️ Importante:** Substitua `{GATEWAY_ID}` pelo ID real do seu gateway.

### 3. Executar Migration do Banco

Execute o script SQL para criar a tabela de logs:

\`\`\`bash
# O script já está em scripts/010_create_ai_gateway_logs.sql
# Execute-o no Supabase SQL Editor ou via migration
\`\`\`

## 📊 Endpoints Gerenciados

O Gateway intercepta e gerencia os seguintes endpoints:

### Assistants

\`\`\`typescript
// Listar assistentes
GET /v1/assistants

// Obter assistente específico
GET /v1/assistants/{assistant_id}

// Criar assistente
POST /v1/assistants

// Atualizar assistente
PATCH /v1/assistants/{assistant_id}

// Deletar assistente
DELETE /v1/assistants/{assistant_id}
\`\`\`

### Threads

\`\`\`typescript
// Criar thread
POST /v1/threads

// Adicionar mensagem
POST /v1/threads/{thread_id}/messages

// Listar mensagens
GET /v1/threads/{thread_id}/messages
\`\`\`

### Runs

\`\`\`typescript
// Executar assistente
POST /v1/threads/{thread_id}/runs

// Obter status do run
GET /v1/threads/{thread_id}/runs/{run_id}
\`\`\`

## 💾 Estrutura de Logs no Supabase

Todos os logs são salvos automaticamente na tabela `ai_gateway_logs`:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | TEXT | UUID único do log |
| `assistant_id` | TEXT | ID do assistente OpenAI |
| `thread_id` | TEXT | ID da thread |
| `run_id` | TEXT | ID do run |
| `agent_id` | TEXT | ID do agente no sistema |
| `conversation_id` | TEXT | ID da conversa |
| `organization_id` | TEXT | ID da organização |
| `user_id` | UUID | ID do usuário |
| `prompt` | TEXT | Mensagem enviada |
| `request_payload` | JSONB | Payload completo da requisição |
| `response_payload` | JSONB | Resposta completa da API |
| `response_text` | TEXT | Texto da resposta |
| `model` | TEXT | Modelo usado (ex: gpt-4o) |
| `tokens_used` | INTEGER | Tokens consumidos |
| `latency_ms` | INTEGER | Latência em milissegundos |
| `status` | TEXT | success, error, timeout |
| `error_message` | TEXT | Mensagem de erro (se houver) |
| `gateway_endpoint` | TEXT | Endpoint chamado |
| `cache_hit` | BOOLEAN | Se foi cache hit |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `completed_at` | TIMESTAMPTZ | Data de conclusão |

## 📈 Monitoramento

### No Painel da Vercel

1. Acesse **AI Gateway → Analytics**
2. Visualize métricas em tempo real:
   - Total de requests
   - Cache hit rate
   - Latência média
   - Tokens consumidos
   - Custos estimados

### No Supabase

Execute queries para análises customizadas:

\`\`\`sql
-- Logs das últimas 24h
SELECT * FROM ai_gateway_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Taxa de sucesso por agente
SELECT 
  agent_id,
  COUNT(*) as total_requests,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
  ROUND(AVG(latency_ms), 2) as avg_latency_ms
FROM ai_gateway_logs
GROUP BY agent_id;

-- Tokens consumidos por organização
SELECT 
  organization_id,
  SUM(tokens_used) as total_tokens,
  COUNT(*) as total_requests
FROM ai_gateway_logs
WHERE tokens_used IS NOT NULL
GROUP BY organization_id
ORDER BY total_tokens DESC;
\`\`\`

## 🚀 Uso no Código

O código já está integrado! O sistema usa automaticamente o AI Gateway quando configurado:

\`\`\`typescript
import { runAssistant, addMessageToThread } from "@/lib/openai-gateway"

// O sistema automaticamente:
// 1. Envia requisição para o Gateway
// 2. Gateway encaminha para OpenAI
// 3. Resposta é cacheada e retornada
// 4. Logs são salvos no Supabase
const run = await runAssistant(threadId, assistantId, {
  agent_id: agentId,
  conversation_id: conversationId,
  organization_id: organizationId,
  user_id: userId,
})
\`\`\`

## 🔄 Fallback Automático

Se `OPENAI_GATEWAY_URL` não estiver configurada, o sistema usa diretamente a API da OpenAI com `OPENAI_API_KEY`.

## ✅ Checklist de Implementação

- [x] Criar tabela `ai_gateway_logs` no Supabase
- [x] Criar `lib/openai-gateway.ts` com integração
- [x] Atualizar `/api/agents/[id]/chat/route.ts`
- [ ] Configurar variáveis de ambiente no Vercel
- [ ] Criar Gateway no painel da Vercel
- [ ] Testar integração end-to-end
- [ ] Configurar alertas de erro
- [ ] Criar dashboard de analytics

## 📚 Recursos

- [Vercel AI Gateway Docs](https://vercel.com/docs/ai-gateway)
- [OpenAI Assistants API](https://platform.openai.com/docs/assistants)
- [Supabase RLS](https://supabase.com/docs/guides/auth/row-level-security)
