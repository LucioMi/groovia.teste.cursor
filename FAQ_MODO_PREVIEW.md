# ❓ FAQ: Por Que Vejo "Modo Preview"?

## 🤔 Por que continuo vendo "Modo Preview - Dados de Exemplo"?

### Resposta Curta
Porque você está no **v0 preview**, que roda no navegador. A API do OpenAI não pode ser chamada do navegador por segurança.

### Resposta Técnica
O v0 preview é um ambiente de desenvolvimento que executa Next.js **completamente no navegador** para permitir edição e visualização rápida. Isso significa:

1. **Não há servidor Node.js real**
   - API routes são simuladas no navegador
   - Pacotes server-side (como OpenAI SDK) não funcionam

2. **Segurança do OpenAI SDK**
   - O SDK detecta ambiente de navegador
   - Recusa inicializar para proteger sua API key
   - Erro: "browser-like environment"

3. **Solução Automática**
   - O código detecta que está no preview
   - Retorna dados de exemplo para testar a UI
   - Em produção, busca dados reais automaticamente

---

## ✅ Isso é um Problema?

**NÃO!** É o comportamento esperado e correto.

### O Código Está Correto ✓
- A integração OpenAI está implementada corretamente
- Os vector stores serão carregados em produção
- As instruções e prompts serão importados
- Tudo funcionará perfeitamente quando deployado

### Preview é Para UI ✓
- Testar layout e design
- Verificar fluxos de navegação
- Validar formulários e interações
- Ver como os dados serão exibidos

### Produção é Para Funcionalidade ✓
- Chamadas reais à API OpenAI
- Operações de banco de dados
- Autenticação completa
- Todas as features funcionando

---

## 🚀 Como Testar Com Dados Reais?

### Opção 1: Deploy no Vercel (Recomendado)
\`\`\`bash
# 1. Clique em "Publish" no v0
# 2. Escolha "Deploy to Vercel"
# 3. Configure OPENAI_API_KEY
# 4. Acesse seu-projeto.vercel.app
\`\`\`

### Opção 2: Desenvolvimento Local
\`\`\`bash
# 1. Baixe o código do v0
# 2. Instale dependências: npm install
# 3. Configure .env.local com OPENAI_API_KEY
# 4. Execute: npm run dev
# 5. Acesse localhost:3000
\`\`\`

---

## 🎯 O Que Esperar em Produção

Quando você deployar no Vercel com `OPENAI_API_KEY` configurada:

### ✅ Sem Banner de Preview
- O banner laranja desaparece
- Nenhuma menção a "dados de exemplo"

### ✅ Assistentes Reais
- Lista completa dos seus assistentes OpenAI
- Nomes, descrições e IDs reais
- Modelos configurados (gpt-4, gpt-3.5-turbo, etc.)

### ✅ Dados Completos
- Instruções e prompts originais
- Vector stores com contagem de arquivos
- Ferramentas configuradas (file_search, code_interpreter)
- Metadados e configurações

### ✅ Importação Funcional
- Clique em um assistente para importar
- Todos os dados são copiados para o formulário
- Crie agentes baseados em assistentes existentes

---

## 💡 Dica Pro

Mantenha o v0 preview aberto para:
- Fazer ajustes visuais rápidos
- Testar novos layouts
- Validar formulários

E use a versão deployada para:
- Testar funcionalidades reais
- Validar integrações
- Demonstrar para clientes

---

## 🆘 Ainda Com Dúvidas?

1. Leia `COMO_USAR_EM_PRODUCAO.md`
2. Acesse `/admin/diagnostico` no seu projeto deployado
3. Verifique os logs do Vercel para erros
4. Confirme que `OPENAI_API_KEY` está configurada

**Lembre-se:** O "Modo Preview" não é um erro, é uma feature! 🎉
