# ⚡ Início Rápido - Deploy na Vercel

## 🎯 Resumo Rápido

Siga estes 3 passos principais para fazer o deploy:

### 1️⃣ Conectar Projeto na Vercel
- Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
- Clique em **"Add New"** → **"Project"**
- Conecte o repositório: `groovia.teste.cursor`
- Clique em **"Import"**

### 2️⃣ Adicionar Variáveis de Ambiente
Vá em **Settings** → **Environment Variables** e adicione:

**Supabase:**
- `NEXT_PUBLIC_SUPABASE_URL` = `https://xscfyyngcuwiblrfexlb.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzY2Z5eW5nY3V3aWJscmZleGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDc0OTgsImV4cCI6MjA3ODQyMzQ5OH0.uA6NLnZr7TXnliOXS-5dU23AJkU9NFVtijc71M20kl8`
- `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzY2Z5eW5nY3V3aWJscmZleGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NDc0OTgsImV4cCI6MjA3ODQyMzQ5OH0.uA6NLnZr7TXnliOXS-5dU23AJkU9NFVtijc71M20kl8`
- `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzY2Z5eW5nY3V3aWJscmZleGxiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg0NzQ5OCwiZXhwIjoyMDc4NDIzNDk4fQ.Nk-vPnv7SuNhtNnuPD9DyBa2vPTJJ45QnoUA64OTMeA`

**OpenAI:**
- `OPENAI_API_KEY` = `sk-proj-...` (sua chave da OpenAI)

**Vercel AI Gateway:**
- `OPENAI_GATEWAY_URL` = `https://ai-gateway.vercel.sh/v1`
- `GATEWAY_API_KEY` = `vck_...` (sua chave do AI Gateway)

**Aplicação:**
- `NEXT_PUBLIC_APP_URL` = `https://seu-projeto.vercel.app` ⚠️ **Atualize após o primeiro deploy!**

**⚠️ Para cada variável:** Marque ✅ Production, ✅ Preview, ✅ Development

### 3️⃣ Fazer Deploy
- Clique em **"Deploy"**
- Aguarde o build (2-5 minutos)
- Anote a URL gerada

### 4️⃣ Atualizar URLs (Após o Deploy)
1. **Na Vercel:** Atualize `NEXT_PUBLIC_APP_URL` com a URL real
2. **No Supabase:** Vá em **Authentication** → **URL Configuration** e adicione:
   - `https://seu-projeto.vercel.app/auth/callback`
   - `https://seu-projeto.vercel.app`
3. **Redeploy:** Faça um novo deploy na Vercel

## 📚 Documentação Completa

Para instruções detalhadas, veja: **[DEPLOYMENT_GUIDE.md](../../DEPLOYMENT_GUIDE.md)** ou **[DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)**

## ✅ Checklist

- [ ] Projeto conectado na Vercel
- [ ] 7 variáveis de ambiente adicionadas
- [ ] Build completado
- [ ] URLs atualizadas no Supabase
- [ ] `NEXT_PUBLIC_APP_URL` atualizada
- [ ] Redeploy feito
- [ ] Aplicação funcionando

## 🆘 Precisa de Ajuda?

Veja a seção "Solução de Problemas" no arquivo [DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md) ou [DEPLOYMENT_GUIDE.md](../../DEPLOYMENT_GUIDE.md)

