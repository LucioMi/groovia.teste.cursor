# 🚀 Guia de Deploy na Vercel - Groovia

Este guia vai te ajudar a fazer o deploy do projeto Groovia na Vercel de forma rápida e simples.

## 📋 Pré-requisitos

- Conta na [Vercel](https://vercel.com)
- Conta no [Supabase](https://supabase.com)
- Conta na [OpenAI](https://platform.openai.com) (opcional, mas recomendado)
- Repositório no GitHub (já configurado ✅)

## 🎯 Passo 1: Conectar Projeto na Vercel

### Opção A: Via Dashboard da Vercel (Recomendado)

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique em **"Add New"** → **"Project"**
3. Conecte seu repositório GitHub
4. Selecione o repositório: `groovia.teste.cursor`
5. Clique em **"Import"**

### Opção B: Via CLI da Vercel

```bash
# Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# Fazer login
vercel login

# Deploy do projeto
cd /Users/luciohenrique/Desktop/trae/groovia_cursor
vercel
```

## 🔧 Passo 2: Configurar Variáveis de Ambiente

No dashboard da Vercel, vá em **Settings** → **Environment Variables** e adicione as seguintes variáveis:

**💡 Dica:** Você pode adicionar todas as variáveis de uma vez ou uma por uma. Para cada variável:
1. Clique em **"Add New"**
2. Cole o **Name** e **Value**
3. Marque os ambientes: ✅ **Production**, ✅ **Preview**, ✅ **Development**
4. Clique em **Save**

### Variáveis Obrigatórias (Supabase)

| Nome | Valor |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xscfyyngcuwiblrfexlb.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzY2Z5eW5nY3V3aWJscmZleGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDc0OTgsImV4cCI6MjA3ODQyMzQ5OH0.uA6NLnZr7TXnliOXS-5dU23AJkU9NFVtijc71M20kl8` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzY2Z5eW5nY3V3aWJscmZleGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDc0OTgsImV4cCI6MjA3ODQyMzQ5OH0.uA6NLnZr7TXnliOXS-5dU23AJkU9NFVtijc71M20kl8` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzY2Z5eW5nY3V3aWJscmZleGxiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0NzQ5OCwiZXhwIjoyMDc4NDIzNDk4fQ.Nk-vPnv7SuNhtNnuPD9DyBa2vPTJJ45QnoUA64OTMeA` |

### Variáveis Obrigatórias (OpenAI)

| Nome | Valor |
|------|-------|
| `OPENAI_API_KEY` | `sk-proj-...` (sua chave da OpenAI) |

### Variáveis Obrigatórias (Vercel AI Gateway)

| Nome | Valor |
|------|-------|
| `OPENAI_GATEWAY_URL` | `https://ai-gateway.vercel.sh/v1` |
| `GATEWAY_API_KEY` | `vck_...` (sua chave do AI Gateway) |

### Variáveis de Aplicação

| Nome | Valor |
|------|-------|
| `NEXT_PUBLIC_APP_URL` | `https://seu-projeto.vercel.app` ⚠️ **Atualize após o primeiro deploy!** |

**⚠️ IMPORTANTE:** 
- A variável `NEXT_PUBLIC_APP_URL` deve ser atualizada após o primeiro deploy com a URL real gerada pela Vercel
- Para cada variável, marque os ambientes: ✅ **Production**, ✅ **Preview**, ✅ **Development**
- Clique em **Save** após adicionar cada variável

## 🏗️ Passo 3: Configurar Build Settings

A Vercel detecta automaticamente Next.js, mas verifique se está assim:

- **Framework Preset**: Next.js
- **Build Command**: `pnpm build` (ou deixe vazio para auto-detect)
- **Output Directory**: `.next` (ou deixe vazio para auto-detect)
- **Install Command**: `pnpm install` (ou deixe vazio para auto-detect)
- **Root Directory**: `./` (raiz do projeto)

## 🚀 Passo 4: Fazer o Deploy

1. Clique em **"Deploy"** no dashboard da Vercel
2. Aguarde o build completar (2-5 minutos)
3. Anote a URL gerada (ex: `https://groovia-teste-cursor.vercel.app`)

## 🔄 Passo 5: Atualizar URLs no Supabase

Após o deploy, você precisa atualizar as URLs de callback no Supabase:

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Vá em **Authentication** → **URL Configuration**
3. Em **Redirect URLs**, adicione:
   ```
   https://seu-projeto.vercel.app/auth/callback
   https://seu-projeto.vercel.app
   ```
4. Em **Site URL**, adicione:
   ```
   https://seu-projeto.vercel.app
   ```
5. Clique em **Save**

## 🔄 Passo 6: Atualizar NEXT_PUBLIC_APP_URL

Após obter a URL do projeto na Vercel:

1. Volte para **Settings** → **Environment Variables** na Vercel
2. Edite a variável `NEXT_PUBLIC_APP_URL`
3. Atualize com a URL real: `https://seu-projeto.vercel.app`
4. Clique em **Save**
5. Vá em **Deployments** → clique nos três pontos do último deploy → **Redeploy**

## ✅ Passo 7: Verificar se Funcionou

### Teste 1: Acessar a Aplicação
- Abra a URL do projeto no navegador
- Deve carregar a página inicial

### Teste 2: Criar Conta
- Clique em "Criar Conta" ou "Sign Up"
- Preencha os dados e crie uma conta
- Verifique se redireciona corretamente após o cadastro

### Teste 3: Fazer Login
- Faça logout (se estiver logado)
- Tente fazer login com a conta criada
- Verifique se funciona corretamente

### Teste 4: Verificar Logs
- No dashboard da Vercel, vá em **Deployments**
- Clique no último deploy
- Vá em **Functions** para ver logs de erros

## 🐛 Solução de Problemas Comuns

### Problema: Build falha com erro de dependências
**Solução:**
```bash
# Verifique se o package.json está correto
# A Vercel deve usar pnpm automaticamente
```

### Problema: Erro 401 Unauthorized do Supabase
**Solução:**
- Verifique se todas as variáveis do Supabase estão configuradas
- Verifique se as URLs de callback estão corretas no Supabase
- Faça um redeploy após atualizar as variáveis

### Problema: OpenAI não funciona
**Solução:**
- Verifique se `OPENAI_API_KEY` está configurada
- Verifique se `OPENAI_GATEWAY_URL` e `GATEWAY_API_KEY` estão corretas
- Veja os logs na Vercel para mais detalhes

### Problema: Página não carrega
**Solução:**
- Verifique os logs na Vercel
- Verifique se `NEXT_PUBLIC_APP_URL` está configurada corretamente
- Verifique se o build foi bem-sucedido

## 📝 Checklist Final

- [ ] Projeto conectado na Vercel
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Build completado com sucesso
- [ ] URLs de callback atualizadas no Supabase
- [ ] `NEXT_PUBLIC_APP_URL` atualizada com a URL real
- [ ] Redeploy feito após atualizar variáveis
- [ ] Aplicação acessível via URL de produção
- [ ] Login/Cadastro funcionando
- [ ] Sem erros nos logs

## 🎉 Pronto!

Seu projeto está no ar! 🚀

A URL de produção será algo como: `https://groovia-teste-cursor.vercel.app`

**Dica:** Você pode adicionar um domínio customizado depois em **Settings** → **Domains** na Vercel.

