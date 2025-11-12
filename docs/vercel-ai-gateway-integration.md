# Integração com Vercel AI Gateway

## Visão Geral

O **Vercel AI Gateway** atua como uma camada intermediária (proxy) entre a aplicação e os serviços da OpenAI, proporcionando recursos avançados de cache, controle, observabilidade e segurança para chamadas à API de Assistants.

## Arquitetura

### Fluxo de Comunicação

\`\`\`
Aplicação → Vercel AI Gateway → OpenAI API → Vercel AI Gateway → Aplicação
                    ↓
                Supabase (Logs & Data)
\`\`\`

### Endpoints Gerenciados

O Gateway intercepta e gerencia as seguintes categorias de endpoints da OpenAI Assistants API:

1. **Assistants Management** (`/v1/assistants`)
   - `GET /v1/assistants` - Listar assistants
   - `POST /v1/assistants` - Criar assistant
   - `GET /v1/assistants/{assistant_id}` - Obter assistant específico
   - `POST /v1/assistants/{assistant_id}` - Atualizar assistant
   - `DELETE /v1/assistants/{assistant_id}` - Deletar assistant

2. **Threads Management** (`/v1/threads`)
   - `POST /v1/threads` - Criar thread
   - `GET /v1/threads/{thread_id}` - Obter thread
   - `POST /v1/threads/{thread_id}` - Modificar thread
   - `DELETE /v1/threads/{thread_id}` - Deletar thread

3. **Messages Management** (`/v1/threads/{thread_id}/messages`)
   - `POST /v1/threads/{thread_id}/messages` - Criar mensagem
   - `GET /v1/threads/{thread_id}/messages` - Listar mensagens
   - `GET /v1/threads/{thread_id}/messages/{message_id}` - Obter mensagem

4. **Runs Management** (`/v1/threads/{thread_id}/runs`)
   - `POST /v1/threads/{thread_id}/runs` - Criar run
   - `GET /v1/threads/{thread_id}/runs/{run_id}` - Obter status do run
   - `POST /v1/threads/{thread_id}/runs/{run_id}/cancel` - Cancelar run
   - `POST /v1/threads/{thread_id}/runs/{run_id}/submit_tool_outputs` - Enviar tool outputs

## Implementação

### Configuração de Endpoints

#### Antes (OpenAI Direto)
\`\`\`typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1'
})
\`\`\`

#### Depois (Vercel AI Gateway)
\`\`\`typescript
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Mesma chave da OpenAI
  baseURL: process.env.AI_GATEWAY_URL || 'https://gateway.ai.vercel.app/v1',
  defaultHeaders: {
    'x-vercel-ai-gateway-key': process.env.GATEWAY_API_KEY
  }
})
\`\`\`

### Formato de Request/Response

O Gateway mantém **total compatibilidade** com o formato JSON da OpenAI. Nenhuma alteração é necessária no corpo das requisições ou no parsing das respostas.

#### Exemplo: Criar Thread
\`\`\`typescript
// Request (idêntico ao OpenAI)
const thread = await openai.beta.threads.create({
  messages: [
    {
      role: "user",
      content: "Olá, preciso de ajuda"
    }
  ]
})

// Response (formato idêntico ao OpenAI)
{
  "id": "thread_abc123",
  "object": "thread",
  "created_at": 1699012949,
  "metadata": {}
}
\`\`\`

#### Exemplo: Executar Assistant
\`\`\`typescript
// Request
const run = await openai.beta.threads.runs.create(
  thread.id,
  {
    assistant_id: "asst_abc123",
    instructions: "Por favor, ajude o usuário com suas dúvidas"
  }
)

// Response
{
  "id": "run_abc123",
  "object": "thread.run",
  "status": "queued",
  "thread_id": "thread_abc123",
  "assistant_id": "asst_abc123"
}
\`\`\`

## Recursos do Gateway

### 1. Cache Inteligente

O Gateway implementa estratégias de cache para:
- Listagem de assistants (reduz chamadas repetidas)
- Metadados de threads
- Configurações de assistants

\`\`\`typescript
// Configuração de cache headers
const assistants = await openai.beta.assistants.list({
  headers: {
    'Cache-Control': 'max-age=300' // Cache por 5 minutos
  }
})
\`\`\`

### 2. Rate Limiting e Controle

- **Rate Limiting**: Proteção contra excesso de requisições
- **Retry Logic**: Tentativas automáticas em caso de falha
- **Circuit Breaker**: Interrompe chamadas quando a API está instável

### 3. Observabilidade

Todas as chamadas são logadas no Supabase com:
- Timestamp da requisição
- Endpoint chamado
- Status da resposta
- Tempo de latência
- Payload (opcional, configurável)

\`\`\`sql
-- Tabela de logs no Supabase
CREATE TABLE ai_gateway_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  latency_ms INTEGER,
  request_payload JSONB,
  response_payload JSONB,
  error_message TEXT,
  user_id UUID REFERENCES auth.users(id),
  agent_id UUID REFERENCES agents(id)
);
\`\`\`

### 4. Segurança

- **API Key Rotation**: Suporte para rotação de chaves sem downtime
- **Request Validation**: Validação de payload antes de enviar para OpenAI
- **Sensitive Data Filtering**: Remoção automática de dados sensíveis dos logs

## Variáveis de Ambiente

\`\`\`env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Vercel AI Gateway
AI_GATEWAY_URL=https://gateway.ai.vercel.app/v1
GATEWAY_API_KEY=vkey-xxxxxxxxxxxxx

# Supabase (para logs e dados)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

## Integração com Supabase

### Schema de Dados

\`\`\`sql
-- Tabela de conversas com thread_id da OpenAI
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES agents(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  openai_thread_id TEXT UNIQUE, -- Thread ID do OpenAI
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de mensagens
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) NOT NULL,
  openai_message_id TEXT, -- Message ID do OpenAI
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de agents com assistant_id da OpenAI
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  openai_assistant_id TEXT UNIQUE, -- Assistant ID do OpenAI
  instructions TEXT,
  model TEXT DEFAULT 'gpt-4-turbo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### Fluxo de Logging

\`\`\`typescript
async function logGatewayCall(
  endpoint: string,
  method: string,
  statusCode: number,
  latencyMs: number,
  error?: string
) {
  await supabase
    .from('ai_gateway_logs')
    .insert({
      endpoint,
      method,
      status_code: statusCode,
      latency_ms: latencyMs,
      error_message: error,
      user_id: (await supabase.auth.getUser()).data.user?.id,
    })
}
\`\`\`

## Monitoramento

### Métricas Disponíveis

1. **Latência**: Tempo de resposta por endpoint
2. **Taxa de Sucesso**: Percentual de chamadas bem-sucedidas
3. **Cache Hit Rate**: Efetividade do cache
4. **Custos**: Tracking de tokens consumidos via OpenAI

### Dashboard de Monitoramento

Query exemplo para métricas:

\`\`\`sql
-- Latência média por endpoint (últimas 24h)
SELECT 
  endpoint,
  AVG(latency_ms) as avg_latency,
  COUNT(*) as total_calls,
  COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) as successful_calls
FROM ai_gateway_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY endpoint
ORDER BY avg_latency DESC;

-- Custos estimados por agente
SELECT 
  a.name,
  COUNT(m.id) as total_messages,
  SUM(LENGTH(m.content)) / 4 as estimated_tokens -- Aproximação
FROM agents a
JOIN conversations c ON c.agent_id = a.id
JOIN messages m ON m.conversation_id = c.id
WHERE m.created_at > NOW() - INTERVAL '30 days'
GROUP BY a.id, a.name
ORDER BY estimated_tokens DESC;
\`\`\`

## Tratamento de Erros

### Códigos de Status

| Status | Descrição | Ação |
|--------|-----------|------|
| 200-299 | Sucesso | Processar resposta normalmente |
| 401 | Não autorizado | Verificar `GATEWAY_API_KEY` |
| 429 | Rate limit excedido | Implementar backoff exponencial |
| 500-599 | Erro no Gateway/OpenAI | Retry com backoff |

### Implementação de Retry

\`\`\`typescript
async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      // Não fazer retry em erros 4xx (exceto 429)
      if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error
      }
      
      // Backoff exponencial
      const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}
\`\`\`

## Migração de OpenAI Direto para Gateway

### Checklist

- [ ] Adicionar variáveis de ambiente `AI_GATEWAY_URL` e `GATEWAY_API_KEY`
- [ ] Atualizar configuração do cliente OpenAI com novo `baseURL`
- [ ] Adicionar headers `x-vercel-ai-gateway-key`
- [ ] Criar tabela `ai_gateway_logs` no Supabase
- [ ] Implementar logging de chamadas
- [ ] Configurar monitoramento de métricas
- [ ] Testar endpoints críticos
- [ ] Configurar alertas para falhas

### Rollback Plan

Manter configuração condicional para rápido rollback:

\`\`\`typescript
const useGateway = process.env.USE_AI_GATEWAY === 'true'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: useGateway 
    ? process.env.AI_GATEWAY_URL 
    : 'https://api.openai.com/v1',
  defaultHeaders: useGateway ? {
    'x-vercel-ai-gateway-key': process.env.GATEWAY_API_KEY
  } : {}
})
\`\`\`

## Conclusão

O Vercel AI Gateway oferece uma camada robusta de gerenciamento para chamadas à OpenAI Assistants API, mantendo total compatibilidade com o formato original enquanto adiciona recursos enterprise de cache, observabilidade, segurança e controle. A integração requer apenas mudança de endpoint, permitindo migração gradual e rollback simplificado.
