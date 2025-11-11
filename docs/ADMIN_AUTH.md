# Sistema de Autenticação Admin

## Visão Geral

O sistema de autenticação admin protege todas as rotas `/admin/*` e requer login para acesso.

## Credenciais Padrão

- **Usuário**: `admin`
- **Senha**: `admin123`

⚠️ **IMPORTANTE**: Altere essas credenciais em produção!

## Estrutura

### Banco de Dados

Duas tabelas principais:

1. **admin_users**: Armazena usuários admin
   - `id`: UUID único
   - `username`: Nome de usuário único
   - `password_hash`: Hash bcrypt da senha
   - `email`: Email único
   - `full_name`: Nome completo (opcional)
   - `is_active`: Status do usuário
   - `last_login`: Último login
   - `created_at`, `updated_at`: Timestamps

2. **admin_sessions**: Gerencia sessões ativas
   - `id`: UUID único
   - `admin_user_id`: Referência ao usuário
   - `token`: Token de sessão único
   - `expires_at`: Data de expiração (7 dias)
   - `ip_address`, `user_agent`: Informações da sessão
   - `created_at`: Timestamp

### Middleware

O arquivo `middleware.ts` protege todas as rotas `/admin/*`:

- Verifica se existe um token de sessão válido
- Redireciona para `/admin/login` se não autenticado
- Permite acesso à página de login sem autenticação
- Valida sessões no banco de dados

### Rotas de API

1. **POST /api/admin/login**
   - Autentica usuário admin
   - Cria sessão e define cookie
   - Retorna sucesso ou erro

2. **POST /api/admin/logout**
   - Remove sessão do banco
   - Limpa cookie de sessão
   - Redireciona para login

3. **GET /api/admin/me**
   - Retorna informações do usuário logado
   - Usado para exibir dados no sidebar

### Componentes

1. **app/admin/login/page.tsx**
   - Página de login com formulário
   - Design moderno com gradientes
   - Feedback de erros
   - Loading states

2. **components/admin-user-info.tsx**
   - Exibe informações do admin no sidebar
   - Dropdown com opção de logout
   - Avatar com iniciais
   - Badge de admin

## Segurança

### Hashing de Senhas

- Usa bcrypt com salt rounds = 10
- Senhas nunca são armazenadas em texto plano
- Verificação segura com timing-safe comparison

### Sessões

- Tokens aleatórios de 64 caracteres (256 bits)
- Expiração de 7 dias
- Armazenados com httpOnly, secure (produção), sameSite
- Limpeza automática de sessões expiradas

### Proteção de Rotas

- Middleware valida todas as requisições
- Sessões verificadas no banco de dados
- Usuários inativos não podem fazer login
- Redirecionamento automático para login

## Como Usar

### Fazer Login

1. Acesse `/admin/login`
2. Digite as credenciais
3. Será redirecionado para `/admin/agentes`

### Fazer Logout

1. Clique no avatar no sidebar
2. Selecione "Sair"
3. Será redirecionado para `/admin/login`

### Criar Novo Admin

Execute SQL no banco de dados:

\`\`\`sql
INSERT INTO admin_users (username, email, password_hash, full_name)
VALUES (
  'novo_admin',
  'novo@groovia.com',
  -- Use bcrypt para gerar o hash da senha
  '$2a$10$...',
  'Nome Completo'
);
\`\`\`

Para gerar o hash da senha, use:

\`\`\`typescript
import bcrypt from 'bcryptjs'
const hash = await bcrypt.hash('sua_senha', 10)
\`\`\`

### Alterar Senha

\`\`\`sql
UPDATE admin_users
SET password_hash = '$2a$10$...',
    updated_at = NOW()
WHERE username = 'admin';
\`\`\`

## Troubleshooting

### Não consigo fazer login

1. Verifique se o banco de dados está rodando
2. Confirme que a tabela `admin_users` existe
3. Execute o script `008_admin_users.sql`
4. Verifique as credenciais

### Sessão expira muito rápido

- Sessões duram 7 dias por padrão
- Verifique se os cookies estão sendo salvos
- Confirme que o domínio está correto

### Erro de middleware

- Verifique se `middleware.ts` está na raiz do projeto
- Confirme a configuração do matcher
- Verifique logs do servidor

## Próximos Passos

1. ✅ Alterar senha padrão
2. ✅ Criar usuários admin adicionais
3. ⚠️ Implementar recuperação de senha
4. ⚠️ Adicionar autenticação de dois fatores
5. ⚠️ Implementar logs de auditoria
