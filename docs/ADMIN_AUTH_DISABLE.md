# Desabilitar Autenticação Admin (Desenvolvimento)

## Visão Geral

Por padrão, todas as rotas `/admin/*` requerem autenticação. Durante o desenvolvimento ou testes, você pode desabilitar temporariamente a autenticação admin.

## ⚠️ AVISO DE SEGURANÇA

**NUNCA desabilite a autenticação admin em produção!** Isso permitirá que qualquer pessoa acesse o painel administrativo sem credenciais.

## Como Desabilitar (Desenvolvimento)

### Opção 1: Variável de Ambiente

Adicione a seguinte variável ao seu arquivo `.env.local`:

\`\`\`env
DISABLE_ADMIN_AUTH=true
\`\`\`

### Opção 2: Variáveis de Ambiente Vercel

Se estiver usando o Vercel para preview/desenvolvimento:

1. Vá para as configurações do projeto no Vercel
2. Navegue até "Environment Variables"
3. Adicione:
   - **Key**: `DISABLE_ADMIN_AUTH`
   - **Value**: `true`
   - **Environment**: Selecione apenas "Development" e "Preview"

## Como Funciona

Quando `DISABLE_ADMIN_AUTH=true`:
- ✅ Todas as rotas `/admin/*` ficam acessíveis sem login
- ✅ Não é necessário criar usuários admin
- ✅ Não é necessário fazer login
- ⚠️ Qualquer pessoa pode acessar o painel admin

Quando `DISABLE_ADMIN_AUTH=false` ou não definido:
- 🔒 Todas as rotas `/admin/*` requerem autenticação
- 🔒 Usuários devem fazer login em `/admin/login`
- 🔒 Sessões são verificadas em cada requisição

## Reativar Autenticação

Para reativar a autenticação:

1. Remova a variável `DISABLE_ADMIN_AUTH` do `.env.local`
2. Ou defina como `DISABLE_ADMIN_AUTH=false`
3. Reinicie o servidor de desenvolvimento

## Configurar Autenticação para Produção

Antes de fazer deploy em produção:

1. **Remova** `DISABLE_ADMIN_AUTH` das variáveis de ambiente de produção
2. Acesse `/admin/setup` para criar o primeiro usuário admin
3. Configure usuários admin conforme necessário
4. Teste o login em `/admin/login`

## Fluxo Recomendado

### Durante Desenvolvimento
\`\`\`
1. Adicionar DISABLE_ADMIN_AUTH=true ao .env.local
2. Desenvolver e testar funcionalidades admin
3. Acessar /admin/* livremente
\`\`\`

### Antes de Produção
\`\`\`
1. Remover DISABLE_ADMIN_AUTH
2. Acessar /admin/setup
3. Criar primeiro usuário admin
4. Testar login completo
5. Deploy para produção
\`\`\`

## Verificar Status

Para verificar se a autenticação está ativa:

1. Tente acessar `/admin/agentes`
2. Se redirecionar para `/admin/login` → Autenticação ATIVA ✅
3. Se acessar diretamente → Autenticação DESABILITADA ⚠️

## Troubleshooting

### Ainda sendo redirecionado para login mesmo com DISABLE_ADMIN_AUTH=true

1. Verifique se a variável está no arquivo correto (`.env.local`)
2. Reinicie o servidor de desenvolvimento
3. Limpe o cache do navegador
4. Verifique os logs do servidor para confirmar: `[v0] Admin authentication is disabled`

### Não consigo acessar /admin em produção

Isso é esperado! A autenticação deve estar sempre ativa em produção. Siga o fluxo de setup em `/admin/setup`.
