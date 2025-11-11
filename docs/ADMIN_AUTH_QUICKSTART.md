# Guia Rápido: Autenticação Admin

## Configuração Inicial

### 1. Acesse a Página de Setup

Navegue para: `http://localhost:3000/admin/setup`

### 2. Crie o Primeiro Usuário Admin

Preencha o formulário com:
- **Usuário**: Seu nome de usuário (ex: `admin`)
- **Email**: Seu email (ex: `admin@groovia.com`)
- **Nome Completo**: Seu nome completo (opcional)
- **Senha**: Uma senha segura (mínimo 6 caracteres)

### 3. Faça Login

Após a configuração, você será redirecionado para a página de login.
Use as credenciais que você acabou de criar.

## Fluxo de Autenticação

\`\`\`
┌─────────────┐
│ /admin/*    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐      ┌──────────────┐
│ Tem sessão?     │─No──▶│ /admin/login │
└────────┬────────┘      └──────┬───────┘
         │                      │
        Yes                     ▼
         │              ┌──────────────┐
         │              │ Precisa      │
         │              │ setup?       │
         │              └──────┬───────┘
         │                     │
         │                    Yes
         │                     │
         │                     ▼
         │              ┌──────────────┐
         │              │ /admin/setup │
         │              └──────────────┘
         │
         ▼
┌─────────────────┐
│ Acesso liberado │
└─────────────────┘
\`\`\`

## Solução de Problemas

### "Usuário ou senha inválidos"

1. Verifique se você digitou as credenciais corretamente
2. Certifique-se de que o usuário está ativo no banco de dados
3. Verifique os logs do console para mais detalhes

### "Sistema já configurado"

Se você tentar acessar `/admin/setup` depois que já existe um usuário:
- Use `/admin/login` para fazer login
- Se esqueceu a senha, você precisará resetá-la diretamente no banco de dados

### Resetar Senha Manualmente

Execute no banco de dados:

\`\`\`sql
-- Gerar hash da nova senha (use bcrypt com salt rounds = 10)
-- Exemplo: senha "novasenha123"
UPDATE admin_users 
SET password_hash = '$2a$10$...' -- hash gerado pelo bcrypt
WHERE username = 'admin';
\`\`\`

## Segurança

- ✅ Senhas são hasheadas com bcrypt (10 rounds)
- ✅ Sessões expiram após 7 dias
- ✅ Cookies são httpOnly e secure em produção
- ✅ Middleware protege todas as rotas /admin/*
- ✅ Sessões inválidas são automaticamente removidas

## Desenvolvimento

Para testar localmente:

1. Execute o script SQL de setup: `scripts/008_admin_users.sql`
2. Acesse `http://localhost:3000/admin/setup`
3. Crie seu usuário admin
4. Faça login em `http://localhost:3000/admin/login`

## Produção

Antes de fazer deploy:

1. ✅ Certifique-se de que `DATABASE_URL` está configurado
2. ✅ Execute as migrations do banco de dados
3. ✅ Configure um usuário admin forte
4. ✅ Ative HTTPS (cookies secure)
5. ✅ Configure rate limiting no login (recomendado)
