# OpenAI Assistants - Modo Produção

## Como Funciona

O sistema de integração com OpenAI Assistants foi projetado para funcionar de forma inteligente em diferentes ambientes:

### No Ambiente de Preview (v0)

- **Comportamento**: Exibe assistentes de exemplo (mock data)
- **Por quê**: O ambiente de preview do v0 roda no navegador, e o SDK do OpenAI não permite execução em navegadores por segurança
- **Indicador**: Banner laranja "Modo Preview - Dados de Exemplo" é exibido
- **Objetivo**: Permite testar a interface e o fluxo de importação sem precisar de uma API key real

### Em Produção (Vercel/Deploy)

- **Comportamento**: Busca seus assistentes reais da sua conta OpenAI
- **Requisito**: Variável de ambiente `OPENAI_API_KEY` configurada
- **Indicador**: Nenhum banner de preview é exibido
- **Resultado**: Você pode importar seus assistentes reais do OpenAI para o sistema

## Como Fazer Funcionar em Produção

### Passo 1: Obter sua API Key do OpenAI

1. Acesse [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Faça login na sua conta OpenAI
3. Clique em "Create new secret key"
4. Copie a chave (ela começa com `sk-`)
5. **IMPORTANTE**: Guarde essa chave em local seguro, ela não será mostrada novamente

### Passo 2: Configurar no Vercel

#### Opção A: Via Dashboard do Vercel

1. Acesse seu projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Settings** → **Environment Variables**
3. Adicione uma nova variável:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Sua chave do OpenAI (sk-...)
   - **Environment**: Selecione Production, Preview e Development
4. Clique em **Save**
5. Faça um novo deploy ou redeploy do projeto

#### Opção B: Via CLI do Vercel

\`\`\`bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Adicionar a variável de ambiente
vercel env add OPENAI_API_KEY

# Quando solicitado, cole sua API key
# Selecione os ambientes: Production, Preview, Development

# Fazer redeploy
vercel --prod
\`\`\`

### Passo 3: Verificar se Funcionou

1. Acesse seu site em produção
2. Vá para **Admin** → **Controle de Agentes**
3. Clique em **Novo Agente**
4. Clique em **Buscar Assistentes OpenAI**
5. **Se funcionou**: Você verá seus assistentes reais, sem banner de preview
6. **Se ainda está em preview**: Verifique se a variável de ambiente foi configurada corretamente

## Testando Localmente (Desenvolvimento)

Se você quiser testar com dados reais no seu ambiente local:

1. Crie um arquivo `.env.local` na raiz do projeto:

\`\`\`env
OPENAI_API_KEY=sk-sua-chave-aqui
\`\`\`

2. Reinicie o servidor de desenvolvimento:

\`\`\`bash
npm run dev
\`\`\`

3. Acesse `http://localhost:3000/admin/agentes`
4. A funcionalidade agora buscará assistentes reais

## Solução de Problemas

### "Erro ao conectar com OpenAI"

**Causa**: API key inválida ou não configurada

**Solução**:
1. Verifique se a variável `OPENAI_API_KEY` está configurada
2. Confirme que a chave está correta (começa com `sk-`)
3. Verifique se a chave não expirou no dashboard do OpenAI
4. Certifique-se de que fez redeploy após adicionar a variável

### "Ainda mostra dados de exemplo em produção"

**Causa**: Variável de ambiente não foi aplicada

**Solução**:
1. Verifique no Vercel Dashboard se a variável está configurada
2. Faça um redeploy do projeto
3. Limpe o cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)
4. Acesse a página de diagnóstico: `/admin/diagnostico`

### "Nenhum assistente encontrado"

**Causa**: Você ainda não criou assistentes no OpenAI

**Solução**:
1. Acesse [platform.openai.com/assistants](https://platform.openai.com/assistants)
2. Crie pelo menos um assistente
3. Volte ao sistema e tente buscar novamente

## Recursos Adicionais

- **Página de Diagnóstico**: `/admin/diagnostico` - Verifica se tudo está configurado corretamente
- **Documentação OpenAI**: [platform.openai.com/docs/assistants](https://platform.openai.com/docs/assistants)
- **Suporte**: Se precisar de ajuda, verifique os logs no Vercel Dashboard

## Segurança

⚠️ **NUNCA** compartilhe sua API key do OpenAI publicamente ou comite ela no Git!

- ✅ Use variáveis de ambiente
- ✅ Adicione `.env.local` no `.gitignore`
- ✅ Rotacione a chave se ela for exposta acidentalmente
- ❌ Não coloque a chave diretamente no código
- ❌ Não compartilhe a chave em screenshots ou documentação pública
