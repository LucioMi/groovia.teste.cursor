# Integração com OpenAI Assistants API - GrooveIA

## ✅ O QUE FOI IMPLEMENTADO

### 1. Biblioteca de Integração (`lib/openai-assistants.ts`)
- **Listar assistentes** da OpenAI
- **Buscar assistente específico** por ID
- **Criar threads** para conversação
- **Adicionar mensagens** à thread
- **Executar assistente** e aguardar resposta
- **Buscar mensagens** da thread

### 2. API de Importação (`/api/admin/agents/import-from-openai`)
- Busca todos os assistentes da OpenAI
- Importa para a tabela `agents` do Supabase
- Evita duplicatas (verifica por `openai_assistant_id`)
- Retorna quantos foram importados e quantos já existiam

### 3. API de Conversação (`/api/chat/[conversationId]`)
- Recebe mensagem do usuário
- Cria ou recupera thread da OpenAI
- Executa o assistente da OpenAI
- Aguarda resposta (polling com timeout de 30s)
- Salva mensagens no banco (user + assistant)

### 4. Interface Admin
- Botão "Importar da OpenAI" na página de agentes
- Mostra feedback de sucesso/erro
- Recarrega lista após importação

### 5. Script SQL (`004_ADD_OPENAI_THREAD_TO_CONVERSATIONS.sql`)
- Adiciona coluna `openai_thread_id` na tabela `conversations`
- Cria índice para performance
- Adiciona comentários explicativos

## 🚀 COMO USAR

### 1. Execute o Script SQL
\`\`\`bash
# No SQL Editor do Supabase, execute:
scripts/004_ADD_OPENAI_THREAD_TO_CONVERSATIONS.sql
\`\`\`

### 2. Importe os Assistentes
1. Acesse `/admin/agents`
2. Clique em "Importar da OpenAI"
3. Aguarde a importação
4. Os assistentes aparecerão na tabela

### 3. Use em Conversas
- Quando um usuário criar uma conversa com um agente importado
- O sistema automaticamente:
  - Cria uma thread na OpenAI
  - Executa o assistente
  - Retorna a resposta

## 📋 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

✅ Já configuradas:
- `OPENAI_API_KEY` - Chave da API da OpenAI
- `SUPABASE_URL` - URL do Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key do Supabase

## 🔧 PRÓXIMOS PASSOS

1. **Testar a importação** clicando no botão
2. **Criar uma conversa** com um agente importado
3. **Enviar mensagens** e verificar respostas
4. **Monitorar logs** no console do navegador (busque por `[v0]`)

## 📊 ESTRUTURA DO BANCO

### Tabela `agents`
- `openai_assistant_id` - ID do assistente na OpenAI
- `openai_thread_id` - Thread padrão (opcional)
- `openai_vector_store_id` - Vector store associado (opcional)

### Tabela `conversations`
- `openai_thread_id` - Thread específica desta conversa

## ⚠️ NOTAS IMPORTANTES

1. **Timeout**: A API aguarda até 30 segundos pela resposta do assistente
2. **Polling**: Verifica o status do run a cada 1 segundo
3. **Erros**: Todos os erros são logados com `[v0]` no console
4. **Duplicatas**: O sistema não importa assistentes que já existem
