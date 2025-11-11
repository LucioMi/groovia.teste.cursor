# Vercel AI Gateway - Integração com OpenAI Assistants API

## Visão Geral

O **Vercel AI Gateway** atua como um intermediário (proxy) entre a aplicação e a API da OpenAI, fornecendo uma camada adicional de controle, segurança, cache e observabilidade para todas as chamadas aos endpoints da OpenAI Assistants API.

## Arquitetura

\`\`\`
┌─────────────┐         ┌──────────────────┐         ┌──────────────┐
│   v0 App    │ ──────> │ Vercel AI Gateway│ ──────> │   OpenAI API │
│             │         │   (Proxy Layer)  │         │              │
└─────────────┘         └──────────────────┘         └──────────────┘
       │                        │
       │                        │
       v                        v
┌─────────────┐         ┌──────────────────┐
│  Supabase   │         │  Logs & Metrics  │
│  (Storage)  │         │   (Analytics)    │
└─────────────┘         └──────────────────┘
\`\`\`

## Endpoints Suportados

O Vercel AI Gateway encaminha as seguintes chamadas para a OpenAI:

### 1. **Assistants** (`/v1/assistants`)
- `GET /v1/assistants` - Listar assistentes
- `POST /v1/assistants` - Criar assistant
- `GET /v1/assistants/{assistant_id}` - Obter assistant
- `POST /v1/assistants/{assistant_id}` - Modificar assistant
- `DELETE /v1/assistants/{assistant_id}` - Deletar assistant

### 2. **Threads** (`/v1/threads`)
- `POST /v1/threads` - Criar thread
- `GET /v1/threads/{thread_id}` - Obter thread
- `POST /v1/threads/{thread_id}` - Modificar thread
- `DELETE /v1/threads/{thread_id}` - Deletar thread

### 3. **Messages** (`/v1/threads/{thread_id}/messages`)
- `POST /v1/threads/{thread_id}/messages` - Criar mensagem
- `GET /v1/threads/{thread_id}/messages` - Listar mensagens
- `GET /v1/threads/{thread_id}/messages/{message_id}` - Obter mensagem
- `POST /v1/threads/{thread_id}/messages/{message_id}` - Modificar mensagem

### 4. **Runs** (`/v1/threads/{thread_id}/runs`)
- `POST /v1/threads/{thread_id}/runs` - Criar run
- `GET /v1/threads/{thread_id}/runs` - Listar runs
- `GET /v1/threads/{thread_id}/runs/{run_id}` - Obter run
- `POST /v1/threads/{thread_id}/runs/{run_id}/cancel` - Cancelar run

### 5. **Vector Stores** (`/v1/vector_stores`)
- `POST /v1/vector_stores` - Criar vector store
- `GET /v1/vector_stores` - Listar vector stores
- `GET /v1/vector_stores/{vector_store_id}` - Obter vector store
- `POST /v1/vector_stores/{vector_store_id}` - Modificar vector store
- `DELETE /v1/vector_stores/{vector_store_id}` - Deletar vector store

## Implementação

### Configuração de Endpoints

Para integrar o Vercel AI Gateway, substitua a base URL da OpenAI pela URL do gateway:

**Antes (OpenAI direto):**
\`\`\`typescript
const baseURL = "https://api.openai.com/v1"
const apiKey = process.env.OPENAI_API_KEY
\`\`\`

**Depois (via Vercel AI Gateway):**
\`\`\`typescript
const baseURL = "https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT_ID/YOUR_GATEWAY"
const apiKey = process.env.VERCEL_AI_GATEWAY_API_KEY
\`\`\`

### Formato de Requisição

O formato JSON das requisições permanece **idêntico** ao formato original da OpenAI. O gateway atua como um proxy transparente:

\`\`\`typescript
// Criar thread - formato idêntico à OpenAI
const response = await fetch(`${baseURL}/threads`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'OpenAI-Beta': 'assistants=v2'
  },
  body: JSON.stringify({
    messages: [{
      role: 'user',
      content: 'Hello'
    }]
  })
})
\`\`\`

### Autenticação

A autenticação utiliza a chave `VERCEL_AI_GATEWAY_API_KEY`:

\`\`\`typescript
headers: {
  'Authorization': `Bearer ${process.env.VERCEL_AI_GATEWAY_API_KEY}`,
  'OpenAI-Beta': 'assistants=v2'
}
\`\`\`

### Fluxo de Dados

1. **Requisição:** O app envia uma requisição para o Vercel AI Gateway
2. **Proxy:** O gateway encaminha a requisição para a OpenAI API
3. **Cache:** Verifica se existe cache válido antes de chamar a OpenAI
4. **Resposta:** Retorna a resposta da OpenAI (ou do cache)
5. **Logs:** Envia logs e métricas para o Supabase
6. **Analytics:** Armazena dados de uso, latência e custos

## Recursos do Gateway

### 1. **Cache Inteligente**
- Cache de respostas de leitura (GET requests)
- TTL configurável por endpoint
- Invalidação automática em mutações (POST, PUT, DELETE)

### 2. **Controle de Custos**
- Tracking de tokens utilizados
- Limites de rate por usuário/organização
- Alertas de uso excessivo

### 3. **Segurança**
- Validação de autenticação antes de proxy
- Rate limiting por IP/usuário
- Proteção contra ataques DDoS
- Logs de acesso completos

### 4. **Observabilidade**
- Logs detalhados de todas as requisições
- Métricas de latência e performance
- Rastreamento de erros
- Dashboard de analytics

### 5. **Retry & Failover**
- Retry automático em caso de falha temporária
- Fallback para endpoints alternativos
- Circuit breaker para proteger a aplicação

## Integração com Supabase

Todos os dados e logs são enviados para o Supabase:

### Tabelas Utilizadas

**`agent_conversations`** - Armazena conversas
\`\`\`sql
- id: uuid
- agent_id: uuid
- user_id: uuid
- openai_thread_id: text  -- Thread ID da OpenAI
- created_at: timestamp
\`\`\`

**`agent_messages`** - Armazena mensagens
\`\`\`sql
- id: uuid
- conversation_id: uuid
- openai_message_id: text  -- Message ID da OpenAI
- role: text
- content: text
- created_at: timestamp
\`\`\`

**`agent_runs`** - Rastreia execuções
\`\`\`sql
- id: uuid
- conversation_id: uuid
- openai_run_id: text  -- Run ID da OpenAI
- status: text
- started_at: timestamp
- completed_at: timestamp
\`\`\`

## Exemplo de Uso Completo

\`\`\`typescript
import OpenAI from 'openai'

// Configurar cliente com gateway
const openai = new OpenAI({
  apiKey: process.env.VERCEL_AI_GATEWAY_API_KEY,
  baseURL: process.env.VERCEL_AI_GATEWAY_URL,
  defaultHeaders: {
    'OpenAI-Beta': 'assistants=v2'
  }
})

// Criar thread
const thread = await openai.beta.threads.create()

// Adicionar mensagem
await openai.beta.threads.messages.create(thread.id, {
  role: 'user',
  content: 'Explain quantum computing'
})

// Executar assistant
const run = await openai.beta.threads.runs.create(thread.id, {
  assistant_id: 'asst_abc123'
})

// Aguardar conclusão
let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
  await new Promise(resolve => setTimeout(resolve, 1000))
  runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id)
}

// Obter resposta
const messages = await openai.beta.threads.messages.list(thread.id)
const response = messages.data[0].content[0].text.value

// Salvar no Supabase
await supabase.from('agent_messages').insert({
  conversation_id: conversationId,
  openai_message_id: messages.data[0].id,
  role: 'assistant',
  content: response
})
\`\`\`

## Variáveis de Ambiente

\`\`\`bash
# Vercel AI Gateway
VERCEL_AI_GATEWAY_URL=https://gateway.ai.cloudflare.com/v1/YOUR_ACCOUNT/YOUR_GATEWAY
VERCEL_AI_GATEWAY_API_KEY=your_gateway_api_key_here

# Supabase (para logs e storage)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI (fallback/direto se necessário)
OPENAI_API_KEY=your_openai_api_key
\`\`\`

## Benefícios da Integração

1. **Redução de Custos:** Cache reduz chamadas redundantes para OpenAI
2. **Melhor Performance:** Respostas em cache são instantâneas
3. **Segurança:** Camada adicional de validação e rate limiting
4. **Observabilidade:** Logs completos de todas as interações
5. **Controle:** Gerenciamento centralizado de todas as chamadas de IA
6. **Escalabilidade:** Distribuição de carga e retry automático
7. **Compliance:** Logs auditáveis para conformidade regulatória

## Limitações e Considerações

- **Latência adicional:** O proxy adiciona ~50-100ms de latência
- **Single point of failure:** Se o gateway cair, a aplicação fica sem acesso à OpenAI
- **Cache stale:** Dados em cache podem estar desatualizados
- **Custos do gateway:** Pode haver custos adicionais pela infraestrutura do gateway

## Troubleshooting

### Erro: "Invalid API Key"
- Verificar se `VERCEL_AI_GATEWAY_API_KEY` está configurada
- Confirmar que a key tem permissões necessárias

### Timeout nas requisições
- Aumentar timeout do client
- Verificar se o gateway está online
- Considerar fallback direto para OpenAI

### Cache desatualizado
- Implementar invalidação manual de cache
- Reduzir TTL do cache
- Usar headers de bypass de cache quando necessário

\`\`\`typescript
// Bypass cache example
headers: {
  'Cache-Control': 'no-cache'
}
