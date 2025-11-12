# 📊 Resumo das Mudanças no Banco de Dados

## ✅ O que foi feito

### 1. Script SQL Completo Criado
- ✅ Arquivo: `scripts/000_COMPLETE_SCHEMA_V2.sql`
- ✅ Contém TODAS as tabelas necessárias
- ✅ Inclui melhorias para Jornada Scan
- ✅ RLS (Row Level Security) configurado
- ✅ Índices para performance
- ✅ Triggers para updated_at automático
- ✅ Dados iniciais (planos de assinatura)

### 2. Melhorias no scan_steps

**Novos Campos:**
- ✅ `step_type`: Tipo de etapa (agent, document, autonomous, synthetic)
- ✅ `depends_on_step_ids`: Array de IDs das etapas que devem estar completas antes
- ✅ `input_document_ids`: Array de IDs dos documentos de input
- ✅ `output_document_id`: ID do documento gerado
- ✅ `document_template_url`: URL do template para etapas do tipo "document"
- ✅ `manual_document_uploaded`: Boolean indicando se documento manual foi enviado
- ✅ `manual_document_upload_id`: ID do documento enviado manualmente
- ✅ `auto_execute`: Boolean indicando se deve executar automaticamente
- ✅ `execution_script`: Script para execução automática

**Mudanças:**
- ✅ `agent_id` agora é **opcional** (para etapas não-agentes)

### 3. Nova Tabela: scan_step_documents

- ✅ Vincula documentos a etapas
- ✅ Tipos: `input`, `output`, `template`, `manual_upload`
- ✅ Rastreia quais documentos são inputs/outputs de cada etapa

### 4. Código Atualizado

- ✅ API `/api/scans` atualizada para usar novos campos
- ✅ API `/api/journey/progress` atualizada para considerar `step_type`
- ✅ Página da jornada preparada para diferentes tipos de etapas
- ✅ Corrigida referência de `user_organizations` para `organization_memberships`

## 🚀 Como Usar

### Passo 1: Apagar Tabelas Existentes

No Supabase SQL Editor, execute:

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

### Passo 2: Executar Script Completo

1. Abra: `scripts/000_COMPLETE_SCHEMA_V2.sql`
2. Copie TODO o conteúdo
3. Cole no SQL Editor do Supabase
4. Execute (Run)

### Passo 3: Verificar

Execute para verificar:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Você deve ver 19 tabelas criadas.

## 📋 Estrutura das Tabelas

### Tabelas Principais
1. `organizations` - Organizações
2. `organization_memberships` - Usuários em Organizações
3. `user_roles` - Roles globais
4. `user_preferences` - Preferências
5. `agents` - Agentes de IA
6. `conversations` - Conversas
7. `messages` - Mensagens
8. `documents` - Documentos
9. `knowledge_bases` - Base de conhecimento

### Tabelas de Jornada Scan
1. `scans` - Jornadas Scan
2. `scan_steps` - Etapas (MELHORADA)
3. `scan_step_documents` - Vínculos documento-etapa (NOVA)

### Tabelas Auxiliares
1. `webhooks` - Webhooks
2. `webhook_logs` - Logs de webhooks
3. `subscription_plans` - Planos
4. `organization_subscriptions` - Assinaturas
5. `payments` - Pagamentos
6. `ai_gateway_logs` - Logs do AI Gateway
7. `audit_logs` - Logs de auditoria

## 🎯 Suporte ao Fluxo do Cliente

### Etapa 1 - SCAN (Conversacional)
- ✅ Tipo: `agent`
- ✅ Requer conversação
- ✅ Gera documento
- ✅ Libera etapa 2

### Etapa 2 - SCAN Clarity (Documento Manual)
- ✅ Tipo: `document`
- ✅ `agent_id`: null
- ✅ `document_template_url`: URL do template
- ✅ `manual_document_uploaded`: false (inicialmente)
- ✅ Cliente baixa, preenche e envia

### Etapa 3 - Mercado ICP (Autônomo)
- ✅ Tipo: `autonomous`
- ✅ `is_passive`: true
- ✅ `auto_execute`: true
- ✅ `depends_on_step_ids`: [etapa-1]
- ✅ Roda automaticamente com input do SCAN

### Etapa 4 - Persona (Autônomo)
- ✅ Tipo: `autonomous`
- ✅ `is_passive`: true
- ✅ `auto_execute`: true
- ✅ `depends_on_step_ids`: [etapa-1, etapa-2, etapa-3]
- ✅ Roda automaticamente após etapa 3

### Etapa 5 - Sintetizador
- ✅ Tipo: `agent` (ou `autonomous` se não precisar conversação)
- ✅ `depends_on_step_ids`: [etapa-2]
- ✅ Usa input da etapa 2

### Etapa 6 - GROOVIA INTELLIGENCE (Autônomo)
- ✅ Tipo: `synthetic`
- ✅ `is_passive`: true
- ✅ `auto_execute`: true
- ✅ `depends_on_step_ids`: [todas as anteriores]
- ✅ Compila tudo em dossiê completo

## 📝 Próximos Passos (Código)

### 1. Implementar Página de Documento Manual
- Criar rota `/dashboard/jornada-scan/[stepId]/documento`
- Permitir download do template
- Permitir upload do documento preenchido
- Atualizar `manual_document_uploaded` no banco

### 2. Implementar Execução Automática
- Criar job/worker para executar agentes autônomos
- Verificar `depends_on_step_ids` antes de executar
- Buscar `input_document_ids` e passar para o agente
- Atualizar status após execução

### 3. Implementar Passagem de Inputs
- Quando etapa gera documento, atualizar `output_document_id`
- Vincular documento na tabela `scan_step_documents`
- Próxima etapa busca `input_document_ids` automaticamente

### 4. Atualizar UI da Jornada
- Mostrar ícone diferente para cada tipo de etapa
- Mostrar status de documentos manuais
- Mostrar progresso de execução automática

## ✅ Checklist

- [x] Script SQL completo criado
- [x] Melhorias no scan_steps implementadas
- [x] Tabela scan_step_documents criada
- [x] APIs atualizadas
- [x] Código corrigido (user_organizations → organization_memberships)
- [x] Documentação criada
- [ ] Executar script no Supabase
- [ ] Testar criação de scan
- [ ] Testar criação de etapas
- [ ] Implementar página de documento manual
- [ ] Implementar execução automática

## 🎉 Concluído!

Todas as mudanças foram commitadas e enviadas para o GitHub. Agora você pode:

1. ✅ Executar o script SQL no Supabase
2. ✅ Testar a criação de scans
3. ✅ Configurar as etapas conforme o fluxo do cliente

O banco de dados está preparado para suportar o fluxo completo da Jornada Scan!

