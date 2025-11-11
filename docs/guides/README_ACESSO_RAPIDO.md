# 🚀 Acesso Rápido ao Painel Admin

## Problema: Não consigo acessar /admin/agentes

Se você está sendo redirecionado para a página de login e não quer configurar autenticação agora, siga estes passos:

### Solução Rápida (Desenvolvimento)

1. **Crie um arquivo `.env.local`** na raiz do projeto (se não existir)

2. **Adicione esta linha:**
   \`\`\`env
   DISABLE_ADMIN_AUTH=true
   \`\`\`

3. **Reinicie o servidor de desenvolvimento**

4. **Acesse `/admin/agentes`** - agora deve funcionar! ✅

### ⚠️ IMPORTANTE

- Esta solução é **APENAS para desenvolvimento/testes**
- **NUNCA use em produção**
- Quando estiver pronto para produção, remova esta variável e configure a autenticação

### Configurar Autenticação (Produção)

Quando estiver pronto para produção:

1. Remova `DISABLE_ADMIN_AUTH` do `.env.local`
2. Acesse `/admin/setup`
3. Crie seu primeiro usuário admin
4. Faça login em `/admin/login`

---

**Documentação completa:** Veja `../ADMIN_AUTH_DISABLE.md` para mais detalhes.
