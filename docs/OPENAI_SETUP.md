# Configuração do OpenAI Assistants

## Passo 1: Obter API Key do OpenAI

1. Acesse [platform.openai.com](https://platform.openai.com)
2. Faça login ou crie uma conta
3. Vá em **API Keys** no menu lateral
4. Clique em **Create new secret key**
5. Copie a chave gerada (ela só será mostrada uma vez!)

## Passo 2: Adicionar a API Key ao Projeto

### Opção 1: Via Vercel Dashboard (Recomendado)

1. Acesse seu projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Settings** → **Environment Variables**
3. Adicione uma nova variável:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Cole sua API key do OpenAI
   - **Environment**: Selecione Production, Preview e Development
4. Clique em **Save**
5. Faça um novo deploy ou reinicie o ambiente de desenvolvimento

### Opção 2: Via Arquivo .env.local (Desenvolvimento Local)

1. Crie um arquivo `.env.local` na raiz do projeto
2. Adicione a seguinte linha:
   \`\`\`
   OPENAI_API_KEY=sk-proj-...sua-chave-aqui...
   \`\`\`
3. Reinicie o servidor de desenvolvimento

## Passo 3: Verificar Configuração

Acesse a rota de status para verificar se a API key está configurada:

\`\`\`bash
curl http://localhost:3000/api/openai/status
\`\`\`

Resposta esperada:
\`\`\`json
{
  "configured": true,
  "message": "OpenAI API key está configurada corretamente"
}
\`\`\`

## Passo 4: Usar OpenAI Assistants

### Criar um Novo Assistant

1. Vá em **Controle de Agentes** → Selecione um agente
2. Clique na aba **OpenAI Assistant**
3. Clique em **Criar Novo Assistant**
4. O sistema criará automaticamente um assistant com base nas configurações do agente

### Vincular um Assistant Existente

1. Vá em **Controle de Agentes** → Selecione um agente
2. Clique na aba **OpenAI Assistant**
3. Clique em **Vincular Assistente Existente**
4. Busque e selecione o assistant desejado
5. Clique em **Vincular**

## Recursos Disponíveis

### Code Interpreter
Permite que o assistant execute código Python para análises, cálculos e visualizações.

### File Search
Permite que o assistant busque informações em arquivos enviados (PDFs, documentos, etc.).

### Function Calling
Permite que o assistant chame funções customizadas para integrar com sistemas externos.

## Troubleshooting

### Erro: "OpenAI API key não configurada"

**Solução**: Verifique se a variável `OPENAI_API_KEY` está configurada corretamente nas variáveis de ambiente.

### Erro: "Failed to list assistants"

**Possíveis causas**:
1. API key inválida ou expirada
2. Sem créditos na conta OpenAI
3. Problemas de rede

**Solução**: 
1. Verifique se a API key está correta
2. Acesse [platform.openai.com/account/billing](https://platform.openai.com/account/billing) para verificar créditos
3. Tente novamente em alguns minutos

### Erro: "Rate limit exceeded"

**Solução**: Você atingiu o limite de requisições da API. Aguarde alguns minutos ou faça upgrade do seu plano no OpenAI.

## Custos

O uso do OpenAI Assistants API é cobrado por:
- **Tokens de entrada**: Texto enviado para o assistant
- **Tokens de saída**: Texto gerado pelo assistant
- **Armazenamento de arquivos**: Arquivos enviados para File Search
- **Code Interpreter**: Execuções de código

Consulte [openai.com/pricing](https://openai.com/pricing) para valores atualizados.

## Segurança

⚠️ **IMPORTANTE**: 
- Nunca compartilhe sua API key publicamente
- Não commite a API key no Git
- Use variáveis de ambiente para armazenar a chave
- Monitore o uso da API regularmente
- Configure limites de gastos no OpenAI Dashboard
