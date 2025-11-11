# 🗄️ Criar Banco de Dados Completo - Groovia

## 📋 Instruções

Este documento contém as instruções para criar todas as tabelas do banco de dados do Groovia no Supabase.

## ⚠️ IMPORTANTE

**Antes de executar este script:**
1. ✅ Faça backup do banco de dados atual (se houver dados importantes)
2. ✅ Apague todas as tabelas existentes no Supabase
3. ✅ Execute o script completo uma única vez

## 🚀 Passo a Passo

### 1. Acessar o Supabase SQL Editor

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**

### 2. Apagar Tabelas Existentes (Se Necessário)

Se você já tem tabelas no banco, execute este comando primeiro para apagá-las:

```sql
-- CUIDADO: Isso vai apagar TODAS as tabelas!
DROP TABLE IF EXISTS scan_step_documents CASCADE;
DROP TABLE IF EXISTS scan_steps CASCADE;
DROP TABLE IF EXISTS scans CASCADE;
DROP TABLE IF EXISTS ai_gateway_logs CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS webhook_logs CASCADE;
DROP TABLE IF EXISTS webhooks CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS organization_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS knowledge_bases CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS organization_memberships CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Apagar funções e triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
```

### 3. Executar o Script Completo

1. Abra o arquivo: `scripts/000_COMPLETE_SCHEMA_V2.sql`
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)
5. Aguarde a execução (pode levar 1-2 minutos)

### 4. Verificar se Tudo Foi Criado

Execute este comando para verificar todas as tabelas criadas:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Você deve ver estas tabelas:

- ✅ `ai_gateway_logs`
- ✅ `agents`
- ✅ `audit_logs`
- ✅ `conversations`
- ✅ `documents`
- ✅ `knowledge_bases`
- ✅ `messages`
- ✅ `organization_memberships`
- ✅ `organization_subscriptions`
- ✅ `organizations`
- ✅ `payments`
- ✅ `scan_step_documents` (NOVA)
- ✅ `scan_steps` (MELHORADA)
- ✅ `scans`
- ✅ `subscription_plans`
- ✅ `user_preferences`
- ✅ `user_roles`
- ✅ `webhook_logs`
- ✅ `webhooks`

### 5. Verificar Planos de Assinatura

Execute este comando para verificar os planos criados:

```sql
SELECT id, name, slug, price_monthly, is_active 
FROM subscription_plans 
ORDER BY price_monthly;
```

Você deve ver 4 planos:
- ✅ Free (R$ 0,00)
- ✅ Starter (R$ 99,00)
- ✅ Pro (R$ 299,00)
- ✅ Enterprise (R$ 999,00)

## 🔍 Verificações Adicionais

### Verificar Campos Novos do scan_steps

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'scan_steps'
  AND column_name IN (
    'step_type',
    'depends_on_step_ids',
    'input_document_ids',
    'output_document_id',
    'document_template_url',
    'manual_document_uploaded',
    'auto_execute'
  )
ORDER BY column_name;
```

### Verificar Tabela scan_step_documents

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'scan_step_documents'
ORDER BY column_name;
```

### Verificar RLS (Row Level Security)

```sql
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

1. **organizations** - Organizações/Empresas
2. **organization_memberships** - Usuários em Organizações (multi-tenancy)
3. **user_roles** - Roles globais (super_admin, etc)
4. **user_preferences** - Preferências do usuário
5. **agents** - Agentes de IA
6. **conversations** - Conversas entre usuários e agentes
7. **messages** - Mensagens das conversas
8. **documents** - Documentos gerados
9. **knowledge_bases** - Base de conhecimento dos agentes

### Tabelas de Jornada Scan (Melhoradas)

1. **scans** - Jornadas Scan (workflows completos)
2. **scan_steps** - Etapas da jornada (com novos campos):
   - `step_type`: Tipo de etapa (agent, document, autonomous, synthetic)
   - `depends_on_step_ids`: Dependências entre etapas
   - `input_document_ids`: Documentos de input
   - `output_document_id`: Documento gerado
   - `document_template_url`: URL do template (para etapas document)
   - `manual_document_uploaded`: Se documento manual foi enviado
   - `auto_execute`: Se deve executar automaticamente
3. **scan_step_documents** - Vínculos entre documentos e etapas

### Tabelas Auxiliares

1. **webhooks** - Webhooks configurados
2. **webhook_logs** - Logs de webhooks
3. **subscription_plans** - Planos de assinatura
4. **organization_subscriptions** - Assinaturas das organizações
5. **payments** - Pagamentos
6. **ai_gateway_logs** - Logs do AI Gateway
7. **audit_logs** - Logs de auditoria

## 🎯 Melhorias Implementadas

### 1. Suporte a Etapas Não-Agentes

- ✅ Campo `step_type` com valores: `agent`, `document`, `autonomous`, `synthetic`
- ✅ Campo `agent_id` agora é **opcional** (para etapas do tipo `document`)
- ✅ Campo `document_template_url` para templates de documentos

### 2. Dependências Entre Etapas

- ✅ Campo `depends_on_step_ids` (array de IDs)
- ✅ Campo `input_document_ids` (array de IDs de documentos)
- ✅ Campo `output_document_id` (ID do documento gerado)

### 3. Documentos Manuais

- ✅ Campo `manual_document_uploaded` (boolean)
- ✅ Campo `manual_document_upload_id` (referência ao documento)
- ✅ Campo `manual_document_uploaded_at` (timestamp)

### 4. Execução Automática

- ✅ Campo `auto_execute` (boolean)
- ✅ Campo `execution_script` (texto do script)

### 5. Vínculos Documento-Etapa

- ✅ Nova tabela `scan_step_documents`
- ✅ Tipos de documento: `input`, `output`, `template`, `manual_upload`

## 📝 Configuração Esperada das Etapas

### Etapa 1 - SCAN (Conversacional)
```json
{
  "step_order": 1,
  "step_type": "agent",
  "agent_id": "scan-agent-id",
  "is_passive": false,
  "auto_execute": false,
  "depends_on_step_ids": []
}
```

### Etapa 2 - SCAN Clarity (Documento Manual)
```json
{
  "step_order": 2,
  "step_type": "document",
  "agent_id": null,
  "document_template_url": "https://...",
  "depends_on_step_ids": ["scan-1"],
  "manual_document_uploaded": false
}
```

### Etapa 3 - Mercado ICP (Autônomo)
```json
{
  "step_order": 3,
  "step_type": "autonomous",
  "agent_id": "mercado-icp-agent-id",
  "is_passive": true,
  "auto_execute": true,
  "depends_on_step_ids": ["scan-1"]
}
```

### Etapa 4 - Persona (Autônomo)
```json
{
  "step_order": 4,
  "step_type": "autonomous",
  "agent_id": "persona-agent-id",
  "is_passive": true,
  "auto_execute": true,
  "depends_on_step_ids": ["scan-1", "scan-2", "scan-3"]
}
```

### Etapa 5 - Sintetizador
```json
{
  "step_order": 5,
  "step_type": "agent",
  "agent_id": "sintetizador-agent-id",
  "is_passive": false,
  "auto_execute": false,
  "depends_on_step_ids": ["scan-2"]
}
```

### Etapa 6 - GROOVIA INTELLIGENCE (Autônomo)
```json
{
  "step_order": 6,
  "step_type": "synthetic",
  "agent_id": "intelligence-agent-id",
  "is_passive": true,
  "auto_execute": true,
  "depends_on_step_ids": ["scan-1", "scan-2", "scan-3", "scan-4", "scan-5"]
}
```

## 🔒 Segurança (RLS)

Todas as tabelas têm Row Level Security (RLS) configurado:

- ✅ Usuários só veem dados das organizações que fazem parte
- ✅ Usuários podem ter múltiplas organizações
- ✅ Roles por organização (owner, admin, member, viewer)
- ✅ Super admins podem ver tudo (via user_roles)

## ✅ Próximos Passos

Após executar o script:

1. ✅ Verificar se todas as tabelas foram criadas
2. ✅ Verificar se os planos de assinatura foram criados
3. ✅ Testar criação de organização
4. ✅ Testar criação de agentes
5. ✅ Testar criação de scan
6. ✅ Atualizar código da aplicação para usar novos campos

## 🐛 Troubleshooting

### Erro: "relation already exists"
- **Solução**: Execute o script de DROP TABLE primeiro (passo 2)

### Erro: "permission denied"
- **Solução**: Certifique-se de estar usando o SQL Editor com permissões de admin

### Erro: "column does not exist"
- **Solução**: Verifique se executou o script completo sem erros

### RLS não funciona
- **Solução**: Verifique se o RLS está habilitado nas tabelas:
  ```sql
  SELECT tablename, rowsecurity 
  FROM pg_tables 
  WHERE schemaname = 'public';
  ```

## 📚 Referências

- Script SQL: `scripts/000_COMPLETE_SCHEMA_V2.sql`
- Documentação Supabase: https://supabase.com/docs
- RLS Documentation: https://supabase.com/docs/guides/auth/row-level-security

## 🎉 Concluído!

Após executar o script com sucesso, seu banco de dados está pronto para uso com todas as melhorias para a Jornada Scan!

