# 🚀 Criar Agentes da Jornada Scan

Este guia explica como criar os agentes necessários para a Jornada Scan no banco de dados.

## 📋 Pré-requisitos

- ✅ Tabelas do banco criadas (execute `scripts/000_COMPLETE_SCHEMA_V2.sql` primeiro)
- ✅ Acesso ao Supabase SQL Editor

## 🎯 Agentes que Serão Criados

1. **SCAN** - Conversacional (Etapa 1)
2. **Mercado ICP** - Autônomo (Etapa 3)
3. **Persona** - Autônomo (Etapa 4)
4. **Sintetizador** - Conversacional (Etapa 5)
5. **GROOVIA INTELLIGENCE** - Autônomo (Etapa 6)

## 📝 Passo a Passo

### Passo 1: Executar Script SQL

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Abra o arquivo: `scripts/014_CREATE_SCAN_JOURNEY_AGENTS.sql`
5. Copie TODO o conteúdo do arquivo
6. Cole no SQL Editor do Supabase
7. Clique em **Run**

### Passo 2: Verificar se os Agentes Foram Criados

Execute esta query para verificar:

```sql
SELECT 
  id,
  name,
  category,
  status,
  is_passive,
  next_agent_id,
  openai_assistant_id,
  created_at
FROM agents
WHERE category = 'Jornada Scan'
ORDER BY created_at;
```

Você deve ver 5 agentes criados.

## ✅ O que o Script Faz

1. **Cria 5 agentes** com todas as configurações necessárias
2. **Vincula os agentes em sequência** usando `next_agent_id`
3. **Configura agentes como globais** (`organization_id = NULL`)
4. **Define `is_passive`** corretamente para cada agente
5. **Adiciona `system_prompt`** específico para cada agente

## 🔄 Próximos Passos

Após criar os agentes no banco:

1. **Criar Assistants na OpenAI** (quando necessário):
   - Acesse `/dashboard/agentes/[id]`
   - Aba "OpenAI Assistant"
   - Clique em "Criar OpenAI Assistant"

2. **Testar a Jornada Scan**:
   - Acesse `/dashboard/jornada-scan`
   - Verifique se as etapas aparecem
   - Teste criar um scan

## 📌 Notas Importantes

- Os agentes são **globais** (disponíveis para todas organizações)
- Agentes autônomos (`is_passive: true`) precisam de Assistants na OpenAI para processar documentos
- Agentes conversacionais (`is_passive: false`) podem funcionar sem Assistant inicialmente
- O `next_agent_id` vincula os agentes em sequência para criar o fluxo da jornada

## 🐛 Solução de Problemas

### Erro: "relation agents does not exist"
- **Solução**: Execute primeiro o script `000_COMPLETE_SCHEMA_V2.sql`

### Agentes não aparecem na Jornada Scan
- **Solução**: Verifique se `status = 'active'` e `category = 'Jornada Scan'`

### Fluxo não funciona corretamente
- **Solução**: Verifique se `next_agent_id` está configurado corretamente

## ✅ Checklist

- [ ] Script SQL executado com sucesso
- [ ] 5 agentes criados no banco
- [ ] Agentes vinculados em sequência (`next_agent_id`)
- [ ] Agentes aparecem na Jornada Scan
- [ ] Status de todos os agentes é `active`

## 🎉 Concluído!

Os agentes da Jornada Scan foram criados no banco de dados. Agora você pode:

1. Ver os agentes na página da Jornada Scan
2. Criar Assistants na OpenAI quando necessário
3. Testar o fluxo completo da jornada

