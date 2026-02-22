# ICEA Chat - Sistema de Bate-papo em Tempo Real

## 📝 Descrição

Sistema de chat inspirado em fóruns de bate-papo clássicos, desenvolvido como trabalho final da disciplina CSI606-2025-01.

**Desenvolvido por:** Felipe Fialho (21.1.8166)

## 🚀 Tecnologias Utilizadas

### Backend
- **NestJS** - Framework Node.js
- **PostgreSQL** - Banco de dados
- **TypeORM** - ORM para TypeScript
- **WebSockets (Socket.IO)** - Comunicação em tempo real
- **JWT** - Autenticação
- **bcrypt** - Criptografia de senhas
- **class-validator** - Validação de DTOs

### Frontend
- **Next.js 14** - Framework React
- **React** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Socket.IO Client** - WebSocket client
- **Axios** - Cliente HTTP
- **Zustand** - Gerenciamento de estado

## ✨ Funcionalidades

### Usuários
- ✅ Criar conta e fazer login
- ✅ Editar perfil (nome, bio, avatar, senha)
- ✅ Adicionar e remover amigos
- ✅ Deletar conta
- ✅ Fazer logout

### Chat
- ✅ Conversas privadas (1-para-1)
- ✅ Grupos com múltiplos membros
- ✅ Enviar mensagens em tempo real via WebSocket
- ✅ Ver quem está online
- ✅ Indicador de digitação
- ✅ Deletar mensagens (próprias ou moderador/admin)

### Moderação
- ✅ Moderadores podem deletar mensagens de outros
- ✅ Moderadores podem expulsar membros de grupos
- ✅ Sistema de roles (user, moderator, admin)

## 📋 Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:

- **Node.js** (v18 ou superior)
- **npm** ou **yarn**
- **Docker** e **Docker Compose** (para o PostgreSQL)

### Instalando os pré-requisitos no Linux Mint:

```bash
# Instalar Node.js via nvm (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Instalar Docker
sudo apt update
sudo apt install docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

**IMPORTANTE:** Após adicionar seu usuário ao grupo docker, você precisa fazer logout e login novamente.

## 🔧 Instalação e Configuração

### 1. Clone ou extraia o projeto

Se você recebeu os arquivos compactados, extraia-os. Se está clonando:

```bash
git clone <repository-url>
cd icea-chat
```

### 2. Configurar o Banco de Dados

Inicie o PostgreSQL com Docker:

```bash
docker-compose up -d
```

Verifique se o container está rodando:

```bash
docker ps
```

Você deve ver o container `icea-chat-postgres` listado.

### 3. Configurar e Iniciar o Backend

```bash
# Entrar no diretório do backend
cd backend

# Instalar dependências
npm install

# Verificar se o arquivo .env existe
cat .env

# Iniciar o servidor em modo desenvolvimento
npm run start:dev
```

O backend estará rodando em `http://localhost:3001`

**Logs esperados:**
```
🚀 ICEA Chat Backend running on http://localhost:3001
```

### 4. Configurar e Iniciar o Frontend

Abra um **novo terminal** e execute:

```bash
# Entrar no diretório do frontend
cd frontend

# Instalar dependências
npm install

# Verificar se o arquivo .env.local existe
cat .env.local

# Iniciar o servidor de desenvolvimento
npm run dev
```

O frontend estará rodando em `http://localhost:3000`

**Logs esperados:**
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
- event compiled client and server successfully
```

## 🎮 Como Usar

### 1. Acesse a aplicação

Abra seu navegador e acesse: `http://localhost:3000`

### 2. Criar uma conta

1. Clique em "Cadastre-se"
2. Preencha:
   - Usuário (mínimo 3 caracteres)
   - Email válido
   - Senha (mínimo 6 caracteres)
3. Clique em "Cadastrar"

### 3. Login

Use suas credenciais para entrar no sistema.

### 4. Adicionar Amigos

1. Clique no ícone de pessoas no topo da sidebar
2. Vá para a aba "Todos os Usuários"
3. Clique em "Adicionar" ao lado do usuário desejado

**DICA:** Para testar, crie múltiplas contas em abas anônimas do navegador.

### 5. Iniciar uma Conversa

**Opção 1 - A partir de Amigos:**
1. Vá para a página de Amigos
2. Clique em "Conversar" ao lado de um amigo

**Opção 2 - Criar Nova Conversa:**
1. Clique no ícone de "+" no topo da sidebar
2. Escolha o tipo (Privada ou Grupo)
3. Selecione os membros
4. Se for grupo, defina um nome
5. Clique em "Criar Conversa"

### 6. Enviar Mensagens

1. Selecione uma conversa na sidebar
2. Digite sua mensagem no campo inferior
3. Pressione Enter ou clique em "Enviar"

**Recursos em tempo real:**
- Mensagens aparecem instantaneamente para todos os membros
- Indicador "Alguém está digitando..." quando outro usuário digita
- Status online/offline dos usuários

### 7. Deletar Mensagens

- Clique em "Deletar" na sua própria mensagem
- Moderadores podem deletar mensagens de qualquer usuário

### 8. Editar Perfil

1. Clique em "Editar Perfil" na parte inferior da sidebar
2. Atualize suas informações
3. Clique em "Salvar Alterações"

## 🔑 Sistema de Roles

### User (Padrão)
- Pode enviar mensagens
- Pode deletar apenas suas próprias mensagens
- Pode criar grupos e adicionar membros

### Moderator
- Tudo que o User pode fazer
- Pode deletar mensagens de outros usuários
- Pode expulsar membros de grupos

### Admin
- Tudo que o Moderator pode fazer
- Pode deletar qualquer conversa
- Controle total do sistema

**Para testar moderação:** Você precisará acessar o banco de dados e alterar manualmente o role de um usuário:

```bash
# Conectar ao PostgreSQL
docker exec -it icea-chat-postgres psql -U postgres -d icea_chat

# Listar usuários
SELECT id, username, email, role FROM users;

# Promover usuário a moderador
UPDATE users SET role = 'moderator' WHERE username = 'seu_usuario';

# Sair
\q
```

## 📁 Estrutura do Projeto

```
icea-chat/
├── backend/
│   ├── src/
│   │   ├── auth/          # Autenticação e JWT
│   │   ├── users/         # Gerenciamento de usuários
│   │   ├── friends/       # Sistema de amizades
│   │   ├── chats/         # Conversas
│   │   ├── messages/      # Mensagens
│   │   ├── chat/          # WebSocket Gateway
│   │   └── common/        # Guards, Decorators, Filters
│   ├── .env              # Variáveis de ambiente
│   └── package.json      # Dependências
│
├── frontend/
│   ├── src/
│   │   ├── app/          # Páginas Next.js
│   │   ├── components/   # Componentes React
│   │   ├── lib/          # API client e Socket
│   │   ├── store/        # Zustand store
│   │   └── types/        # TypeScript types
│   ├── .env.local        # Variáveis de ambiente
│   └── package.json      # Dependências
│
├── docker-compose.yml    # PostgreSQL
└── README.md            # Este arquivo
```

## 🐛 Troubleshooting

### Backend não inicia

**Erro: `Cannot connect to database`**
```bash
# Verificar se o PostgreSQL está rodando
docker ps

# Se não estiver, inicie:
docker-compose up -d

# Ver logs do container:
docker logs icea-chat-postgres
```

**Erro: `Port 3001 already in use`**
```bash
# Encontrar processo usando a porta:
lsof -i :3001

# Matar o processo:
kill -9 <PID>
```

### Frontend não inicia

**Erro: `Port 3000 already in use`**
```bash
# Encontrar processo usando a porta:
lsof -i :3000

# Matar o processo:
kill -9 <PID>
```

**Erro: `Cannot connect to backend`**
- Verifique se o backend está rodando em http://localhost:3001
- Verifique o arquivo `.env.local` no frontend

### WebSocket não conecta

1. Verifique se o backend está rodando
2. Abra o console do navegador (F12) e procure por erros
3. Verifique se o token JWT é válido (faça logout e login novamente)

### Mensagens não aparecem em tempo real

1. Verifique a conexão WebSocket no console (deve mostrar "✅ Connected to WebSocket")
2. Certifique-se de que ambos os usuários estão logados
3. Recarregue a página (F5)

## 🧪 Testando o Sistema

### Cenário 1: Chat Privado

1. Crie duas contas em abas diferentes do navegador
2. Na primeira conta, adicione a segunda como amigo
3. Inicie uma conversa privada
4. Envie mensagens de ambas as contas
5. Observe as mensagens aparecendo em tempo real

### Cenário 2: Grupo

1. Crie três contas
2. Adicione-as como amigos
3. Crie um grupo com todos os membros
4. Envie mensagens de diferentes contas
5. Teste o indicador de digitação

### Cenário 3: Moderação

1. Promova um usuário a moderador (via SQL)
2. Faça login com essa conta
3. Entre em um grupo
4. Tente deletar mensagens de outros usuários
5. Tente expulsar membros do grupo

## 🔒 Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Autenticação JWT
- ✅ Validação de dados com DTOs
- ✅ Guards para proteger rotas
- ✅ CORS configurado
- ❌ Não implementado: Criptografia E2E, 2FA

## 📊 Banco de Dados

### Schema Principal

**users**
- id (UUID)
- username (unique)
- email (unique)
- password (hashed)
- bio
- avatar
- role (enum: user, moderator, admin)
- isActive

**chats**
- id (UUID)
- type (enum: private, group)
- name
- description
- creator_id

**messages**
- id (UUID)
- content (text)
- sender_id
- chat_id
- isDeleted
- createdAt

**friendships** (many-to-many)
**chat_members** (many-to-many)

### Acessar o banco de dados

```bash
# Entrar no container
docker exec -it icea-chat-postgres psql -U postgres -d icea_chat

# Comandos úteis:
\dt                           # Listar tabelas
\d users                      # Descrever tabela users
SELECT * FROM users;          # Ver todos os usuários
SELECT * FROM chats;          # Ver todas as conversas
SELECT * FROM messages;       # Ver todas as mensagens
\q                           # Sair
```

## 🛠️ Comandos Úteis

### Backend

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod

# Lint
npm run lint
```

### Frontend

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build
npm run start
```

### Docker

```bash
# Iniciar PostgreSQL
docker-compose up -d

# Parar PostgreSQL
docker-compose down

# Ver logs
docker-compose logs -f

# Resetar banco de dados (CUIDADO: apaga todos os dados)
docker-compose down -v
docker-compose up -d
```

## 📝 Notas Adicionais

### Variáveis de Ambiente

**Backend (.env):**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=icea_chat
JWT_SECRET=icea_chat_super_secret_jwt_key_2025
JWT_EXPIRATION=7d
PORT=3001
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Porta padrões

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- PostgreSQL: `localhost:5432`

## 🎓 Trabalho Acadêmico

Este projeto foi desenvolvido como Trabalho Final da disciplina CSI606-2025-01 (Remoto).

**Aluno:** Felipe Fialho  
**Matrícula:** 21.1.8166  
**Data:** 2025

### Requisitos Implementados

- ✅ Autenticação com JWT
- ✅ CRUD completo de usuários
- ✅ Sistema de amizades
- ✅ Chat privado e em grupo
- ✅ Mensagens em tempo real (WebSocket)
- ✅ Sistema de moderação
- ✅ Deletar conta
- ✅ Indicadores visuais (online, digitando)

### Requisitos Não Implementados (conforme escopo)

- ❌ Autenticação 2FA
- ❌ Login por redes sociais
- ❌ Upload de arquivos/mídia
- ❌ Criptografia E2E
- ❌ Notificações push
- ❌ Aplicativo mobile
- ❌ Sistema de recomendação

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Verifique a seção de Troubleshooting
2. Verifique os logs do backend e frontend
3. Verifique os logs do PostgreSQL
4. Entre em contato: [seu-email@exemplo.com]

## 📄 Licença

Este projeto é de uso acadêmico.

---

**Desenvolvido com ❤️ por Felipe Fialho**
