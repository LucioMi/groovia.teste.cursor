# ✅ EXECUTAR ESTE SCRIPT NO SUPABASE AGORA

## 1️⃣ Acesse o SQL Editor do Supabase

1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto **groovia**
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**

## 2️⃣ Cole e Execute o Script

1. Abra o arquivo: `scripts/000_COMPLETE_SCHEMA_SUPABASE.sql`
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

## 3️⃣ Verifique se Tudo Foi Criado

Execute este comando para ver todas as tabelas criadas:

\`\`\`sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
\`\`\`

Você deve ver todas estas tabelas:
- ✅ admin_sessions
- ✅ admin_users
- ✅ agent_analytics
- ✅ agent_behaviors
- ✅ agent_rules
- ✅ agent_sessions
- ✅ agent_test_cases
- ✅ agent_variables
- ✅ agents
- ✅ approved_responses
- ✅ assistant_runs
- ✅ conversations
- ✅ documents
- ✅ journey_progress
- ✅ knowledge_bases
- ✅ message_feedback
- ✅ messages
- ✅ organization_invitations
- ✅ organization_memberships
- ✅ organization_subscriptions
- ✅ organization_usage
- ✅ organizations
- ✅ payments
- ✅ subscription_plans
- ✅ vector_store_files
- ✅ webhook_logs
- ✅ webhooks

## 4️⃣ Crie o Primeiro Admin

Após o script executar com sucesso:

1. Acesse: **http://localhost:3000/admin/setup**
2. Preencha o formulário:
   - **Nome**: Seu nome completo
   - **Email**: seu@email.com
   - **Senha**: mínimo 6 caracteres
3. Clique em **Criar Administrador**
4. Você será redirecionado automaticamente para o painel admin

## 🎉 PRONTO!

O sistema está 100% funcional com:
- ✅ Todas as tabelas criadas
- ✅ Multi-tenancy (um usuário pode ter múltiplas organizações)
- ✅ Sistema de admin separado (super admins da plataforma)
- ✅ Planos de assinatura (Free, Starter, Pro, Enterprise)
- ✅ Sistema completo de agentes, conversas, documentos, webhooks
- ✅ Analytics e métricas
- ✅ Pronto para integrar com Supabase Auth

## 📝 Próximos Passos

1. Configure o Supabase Auth no Dashboard
2. Implemente RLS policies através do código
3. Configure Stripe para pagamentos
4. Deploy em produção
