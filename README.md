# CSI606 2025/02 - Trabalho Final - Resultados
## *Discente: Felipe Fialho - 21.1.8166*

## Resumo

O **ICEA Chat** é uma aplicação de mensagens em tempo real desenvolvida como trabalho final da disciplina Sistemas Web. O sistema permite que usuários se comuniquem por meio de conversas privadas e grupos, com suporte a envio de imagens, emojis, gerenciamento de membros e cargos dentro de grupos. A aplicação foi construída com Next.js no frontend, API REST + WebSocket no backend utilizando NestJS, PostgreSQL como banco de dados e Prisma como ORM.

---

## 1. Funcionalidades Implementadas

### Autenticação
- Cadastro de usuário com username, e-mail e senha
- Login por username **ou** e-mail
- Autenticação via JWT com persistência em `localStorage`
- Proteção de rotas no frontend e guards no backend

### Perfil de Usuário
- Upload de foto de perfil com redimensionamento no cliente (máx. 5 MB, reduzida para 256×256 px)
- Edição de username e bio
- Troca de senha
- Exclusão de conta (soft-delete: libera username/e-mail para reutilização, limpa avatar e bio)
- Tema claro/escuro com persistência em `localStorage` e ausência de flash ao carregar a página

### Amizades
- Adição e remoção de amigos
- Listagem de amigos e usuários disponíveis para adicionar
- Sistema de amizade mútua (ambos os lados são registrados)

### Conversas Privadas
- Criação de chat privado com qualquer usuário
- Mensagens em tempo real via Socket.IO
- Histórico de mensagens com separadores de data

### Grupos
- Criação de grupo com nome, descrição, avatar e seleção de membros
- Edição de informações do grupo (nome, descrição, avatar) pelo administrador
- Sistema de cargos: **Administrador**, **Moderador** e **Membro**
- Promoção/rebaixamento de membros pelo administrador
- Expulsão direta de membros pelo administrador
- Solicitações de expulsão por moderadores (aprovadas/rejeitadas pelo administrador)
- Adição de novos membros pelo administrador ou moderadores
- Painel lateral de membros com ações contextuais por cargo

### Mensagens
- Envio de texto com suporte a emojis
- Envio de imagens
- Exclusão de mensagens (próprias pelo autor; qualquer mensagem por admin)
- Mensagens deletadas exibem marcação "Mensagem deletada"
- Timestamps em todas as mensagens

### Interface
- Tema claro e escuro

---

## 2. Funcionalidades Previstas e Não Implementadas

- Todas as funcionalidades previstas foram implementadas.

---

## 3. Outras Funcionalidades Implementadas

- **Envio de imagens**, permitindo usuários compartilharem fotos entre si.

---

## 4. Principais Desafios e Dificuldades

- **Gerenciamento de estado em tempo real:** integrar o estado do Zustand com eventos de Socket.IO exigiu atenção para evitar duplicação de listeners e memory leaks entre navegações de rota.
- **Consistência de tema sem flash:** garantir que o tema escuro/claro fosse aplicado antes da hidratação do React exigiu um script inline no `<head>` do layout.
- **Transferência de administrador em transação:** realizar a transferência de cargo e o soft-delete do usuário de forma atômica com `prisma.$transaction`, incluindo operações dinâmicas em array, foi um ponto delicado de implementação.
- **Envio de imagens via WebSocket:** como o Socket.IO não suporta multipart, as imagens são convertidas para base64 no cliente e enviadas como strings, com redimensionamento prévio para manter o payload gerenciável.

---

## 5. Instruções para Instalação e Execução

### Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Node.js | 18.x |
| npm | 9.x |
| PostgreSQL | 14.x |

### Configuração do banco de dados

Ao clonar o repositório, entre na pasta raiz do projeto e suba o docker-compose.yml contendo o banco de dados utilizado:

```bash
cd icea-chat

docker compose up -d
```

### Backend

```bash
# 1. Entrar na pasta do backend
cd backend

# 2. Instalar dependências
npm install

# 3. Criar o arquivo de variáveis de ambiente
nano .env
# Edite o .env e defina:

  # Prisma
  DATABASE_URL="postgresql://postgres:postgres@localhost:5433/icea_chat"

  # JWT
  JWT_SECRET="icea_chat_super_secret_jwt_key_2025"
  JWT_EXPIRATION="7d"

  # Server
  PORT=3001

# 4. Aplicar o schema ao banco de dados
npx prisma db push

# 5. Iniciar o servidor em modo desenvolvimento
npm run start:dev
```

O backend estará disponível em `http://localhost:3001`.

### Frontend

```bash
# 1. Em outro terminal, entrar na pasta do frontend
cd frontend

# 2. Instalar dependências
npm install

# 3. Iniciar o servidor em modo desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:3000`.

---

## 6. Referências

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Socket.IO Documentation](https://socket.io/docs/v4)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [JSON Web Tokens (JWT)](https://jwt.io/introduction)
- [bcrypt — npm](https://www.npmjs.com/package/bcrypt)
