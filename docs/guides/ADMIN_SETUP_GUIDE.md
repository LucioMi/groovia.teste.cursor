# Guia de Configuração do Admin

## Como Criar o Primeiro Administrador

### Passo 1: Acesse a Página de Setup

Navegue para: **`/admin/setup`**

Esta página só é acessível quando NÃO existe nenhum administrador no sistema.

### Passo 2: Preencha o Formulário

Campos obrigatórios:
- **Usuário**: Nome de usuário para login (ex: admin)
- **Email**: Email do administrador (ex: admin@groovia.com)
- **Senha**: Senha forte com mínimo 6 caracteres

Campo opcional:
- **Nome Completo**: Nome completo do administrador

### Passo 3: Clique em "Criar Admin"

O sistema irá:
1. Validar os dados
2. Verificar se já existe um admin
3. Criar o usuário com senha criptografada (SHA-256)
4. Redirecionar para a página de login

### Passo 4: Faça Login

Após a criação, você será redirecionado para `/admin/login`.

Use as credenciais que acabou de criar para fazer login.

## Credenciais de Exemplo

Para facilitar o teste inicial, você pode usar:
- **Usuário**: admin
- **Email**: admin@groovia.com
- **Senha**: admin123

## Segurança

- A senha é hasheada usando SHA-256 com salt
- As sessões expiram em 7 dias
- Apenas usuários admin ativos podem fazer login
- O middleware protege todas as rotas `/admin/*` exceto `/admin/login` e `/admin/setup`

## Próximos Passos

Após o primeiro login, você pode:
1. Acessar o painel administrativo em `/admin`
2. Gerenciar outros admins em `/admin/admins`
3. Gerenciar usuários do sistema em `/admin/users`
4. Visualizar estatísticas e métricas do sistema

## Troubleshooting

### Erro: "Sistema já configurado"
- Já existe um admin no sistema
- Use `/admin/login` para fazer login
- Se perdeu a senha, você precisará resetá-la diretamente no banco de dados

### Erro: "Erro ao criar admin"
- Verifique os logs do servidor para mais detalhes
- Certifique-se de que o banco de dados está acessível
- Verifique se a tabela `admin_users` existe

### Página não carrega
- Verifique se o middleware está permitindo acesso a `/admin/setup`
- Verifique os logs do navegador (Console)
- Verifique os logs do servidor

## Resetar Admin (Emergência)

Se você perdeu acesso ao admin, pode criar um novo diretamente no banco:

\`\`\`sql
-- Deletar admins existentes
DELETE FROM admin_sessions;
DELETE FROM admin_users;

-- Criar novo admin
-- Senha: admin123 (hash com salt groovia_admin_salt_2024)
INSERT INTO admin_users (username, email, password_hash, is_active)
VALUES (
  'admin',
  'admin@groovia.com',
  'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
  true
);
\`\`\`

Depois acesse `/admin/login` com as credenciais: admin / admin123
