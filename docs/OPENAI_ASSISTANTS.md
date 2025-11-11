# Integração OpenAI Assistants

Este documento explica como usar a integração do OpenAI Assistants na plataforma GroovIA.

## Visão Geral

A integração permite que cada agente seja conectado a um OpenAI Assistant, aproveitando recursos avançados como:

- **Code Interpreter**: Execução de código Python para análises e cálculos
- **File Search**: Busca semântica em documentos e bases de conhecimento
- **Function Calling**: Chamada de funções personalizadas
- **Streaming**: Respostas em tempo real

## Configuração

### 1. Adicionar API Key

Adicione sua chave de API da OpenAI no arquivo `.env`:

\`\`\`env
OPENAI_API_KEY=sk-proj-...
\`\`\`

### 2. Executar Migrations

Execute os scripts SQL para adicionar as tabelas necessárias:

\`\`\`bash
# Execute o script 007_openai_assistants.sql no seu banco Neon
\`\`\`

## Como Usar

### Criar um Assistant para um Agente

1. Acesse **Admin > Controle de Agentes**
2. Clique em um agente existente
3. Vá para a aba **OpenAI Assistant**
4. Clique em **Criar OpenAI Assistant**

O sistema irá:
- Criar um Assistant na OpenAI com o nome e descrição do agente
- Usar o `system_prompt` do agente como instruções do Assistant
- Habilitar a ferramenta `file_search` por padrão
- Salvar o ID do Assistant no banco de dados

### Sincronizar Alterações

Se você modificar o nome, descrição ou prompt do agente:

1. Vá para a aba **OpenAI Assistant**
2. Clique em **Sincronizar Alterações**

Isso atualizará o Assistant na OpenAI com as novas informações.

### Testar o Assistant

Na aba **OpenAI Assistant**, você pode:

1. Digitar uma mensagem no campo de teste
2. Clicar em **Enviar para Assistant**
3. Ver a resposta gerada pelo OpenAI Assistant

### Usar em Conversas

Quando um agente tem um Assistant conectado, você pode usar a API:

\`\`\`typescript
// POST /api/agents/{agentId}/assistant/chat
const response = await fetch(`/api/agents/${agentId}/assistant/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Sua mensagem aqui',
    conversationId: 'optional-conversation-id'
  })
});

const data = await response.json();
console.log(data.response); // Resposta do Assistant
\`\`\`

## Estrutura de Dados

### Tabela `agents`

Novos campos adicionados:
- `openai_assistant_id`: ID do Assistant na OpenAI
- `openai_thread_id`: ID do Thread para conversas contínuas
- `openai_synced_at`: Timestamp da última sincronização

### Tabela `assistant_runs`

Armazena histórico de execuções:
- `id`: ID único da execução
- `agent_id`: Referência ao agente
- `conversation_id`: Referência à conversa (opcional)
- `thread_id`: ID do Thread na OpenAI
- `run_id`: ID da execução na OpenAI
- `status`: Status da execução (queued, in_progress, completed, failed)
- `error_message`: Mensagem de erro (se houver)

## API Endpoints

### GET /api/agents/[id]/assistant
Retorna informações do Assistant conectado ao agente.

**Resposta:**
\`\`\`json
{
  "assistant": {
    "id": "asst_...",
    "name": "Nome do Agente",
    "description": "Descrição",
    "model": "gpt-4o",
    "instructions": "Prompt do sistema",
    "tools": [{ "type": "file_search" }],
    "syncedAt": "2025-01-01T00:00:00Z"
  }
}
\`\`\`

### POST /api/agents/[id]/assistant
Cria ou sincroniza um Assistant para o agente.

**Resposta:**
\`\`\`json
{
  "success": true,
  "assistant": {
    "id": "asst_...",
    "name": "Nome do Agente",
    "model": "gpt-4o"
  }
}
\`\`\`

### DELETE /api/agents/[id]/assistant
Remove o Assistant da OpenAI e desconecta do agente.

### POST /api/agents/[id]/assistant/chat
Envia uma mensagem para o Assistant e retorna a resposta.

**Body:**
\`\`\`json
{
  "message": "Sua mensagem",
  "conversationId": "optional-id"
}
\`\`\`

**Resposta:**
\`\`\`json
{
  "success": true,
  "response": "Resposta do Assistant",
  "runId": "run_..."
}
\`\`\`

## Recursos Avançados

### Adicionar Bases de Conhecimento

Os arquivos enviados na aba **Base de Conhecimento** podem ser usados pelo Assistant:

1. Faça upload de documentos (PDF, TXT, MD, etc.)
2. Os arquivos são armazenados no Vercel Blob
3. Você pode anexá-los ao Assistant via API da OpenAI

### Ferramentas Personalizadas

Para adicionar ferramentas personalizadas (Function Calling):

1. Edite o arquivo `lib/openai-assistant.ts`
2. Modifique a função `createAssistant` para incluir suas ferramentas
3. Implemente os handlers para as funções

Exemplo:
\`\`\`typescript
const assistant = await createAssistant({
  name: agent.name,
  instructions: agent.system_prompt,
  tools: [
    { type: 'file_search' },
    { type: 'code_interpreter' },
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: 'Get weather information',
        parameters: {
          type: 'object',
          properties: {
            location: { type: 'string' }
          }
        }
      }
    }
  ]
});
\`\`\`

## Limitações

- Cada agente pode ter apenas um Assistant conectado
- As conversas usam um único Thread por agente (pode ser modificado)
- O polling de status é síncrono (pode ser otimizado com webhooks)
- Custos da OpenAI se aplicam a cada execução

## Troubleshooting

### "Agent does not have an OpenAI Assistant configured"
- Certifique-se de criar o Assistant primeiro na aba OpenAI Assistant

### "Failed to create assistant"
- Verifique se a `OPENAI_API_KEY` está configurada corretamente
- Confirme que sua conta OpenAI tem créditos disponíveis

### "Run failed with status: failed"
- Verifique os logs do Assistant na OpenAI Dashboard
- O erro detalhado estará em `assistant_runs.error_message`

## Próximos Passos

- [ ] Implementar streaming de respostas
- [ ] Adicionar suporte a múltiplos Threads por agente
- [ ] Integrar Vector Stores para bases de conhecimento
- [ ] Adicionar webhooks da OpenAI para atualizações em tempo real
- [ ] Implementar retry logic para falhas temporárias
