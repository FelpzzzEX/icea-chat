# SQL Commands - ICEA Chat

## Conectar ao Banco de Dados

```bash
docker exec -it icea-chat-postgres psql -U postgres -d icea_chat
```

## Comandos Úteis do PostgreSQL

### Listar Tabelas
```sql
\dt
```

### Descrever Estrutura de Tabela
```sql
\d users
\d chats
\d messages
\d friendships
\d chat_members
```

### Sair
```sql
\q
```

---

## Consultas Úteis

### Usuários

#### Listar todos os usuários
```sql
SELECT id, username, email, role, "isActive", "createdAt" 
FROM users 
ORDER BY "createdAt" DESC;
```

#### Buscar usuário específico
```sql
SELECT * FROM users WHERE username = 'seu_usuario';
```

#### Contar usuários por role
```sql
SELECT role, COUNT(*) as total 
FROM users 
GROUP BY role;
```

### Conversas

#### Listar todas as conversas
```sql
SELECT c.id, c.type, c.name, COUNT(cm."userId") as member_count
FROM chats c
LEFT JOIN chat_members cm ON c.id = cm."chatId"
GROUP BY c.id
ORDER BY c."createdAt" DESC;
```

#### Buscar conversas de um usuário
```sql
SELECT c.id, c.type, c.name
FROM chats c
INNER JOIN chat_members cm ON c.id = cm."chatId"
WHERE cm."userId" = 'SEU_USER_ID';
```

### Mensagens

#### Listar mensagens recentes
```sql
SELECT 
    m.id,
    m.content,
    u.username as sender,
    c.name as chat,
    m."createdAt"
FROM messages m
INNER JOIN users u ON m."senderId" = u.id
INNER JOIN chats c ON m."chatId" = c.id
WHERE m."isDeleted" = false
ORDER BY m."createdAt" DESC
LIMIT 20;
```

#### Contar mensagens por chat
```sql
SELECT 
    c.name,
    c.type,
    COUNT(m.id) as message_count
FROM chats c
LEFT JOIN messages m ON c.id = m."chatId"
WHERE m."isDeleted" = false
GROUP BY c.id
ORDER BY message_count DESC;
```

### Amizades

#### Listar amigos de um usuário
```sql
SELECT 
    u1.username as user,
    u2.username as friend
FROM friendships f
INNER JOIN users u1 ON f."userId" = u1.id
INNER JOIN users u2 ON f."friendId" = u2.id
WHERE u1.username = 'SEU_USERNAME';
```

#### Contar amigos por usuário
```sql
SELECT 
    u.username,
    COUNT(f."friendId") as friend_count
FROM users u
LEFT JOIN friendships f ON u.id = f."userId"
GROUP BY u.id
ORDER BY friend_count DESC;
```

---

## Comandos de Administração

### Promover usuário a moderador
```sql
UPDATE users 
SET role = 'moderator' 
WHERE username = 'nome_do_usuario';
```

### Promover usuário a admin
```sql
UPDATE users 
SET role = 'admin' 
WHERE username = 'nome_do_usuario';
```

### Rebaixar usuário para user
```sql
UPDATE users 
SET role = 'user' 
WHERE username = 'nome_do_usuario';
```

### Desativar conta de usuário
```sql
UPDATE users 
SET "isActive" = false 
WHERE username = 'nome_do_usuario';
```

### Reativar conta de usuário
```sql
UPDATE users 
SET "isActive" = true 
WHERE username = 'nome_do_usuario';
```

### Alterar senha de usuário (use bcrypt hash)
```sql
-- IMPORTANTE: Use a senha hasheada com bcrypt!
-- Você pode gerar um hash em: https://bcrypt-generator.com/
UPDATE users 
SET password = '$2b$10$HASH_GERADO_AQUI' 
WHERE username = 'nome_do_usuario';
```

---

## Comandos de Manutenção

### Deletar todas as mensagens de um chat
```sql
UPDATE messages 
SET "isDeleted" = true 
WHERE "chatId" = 'ID_DO_CHAT';
```

### Remover membro de um grupo
```sql
DELETE FROM chat_members 
WHERE "chatId" = 'ID_DO_CHAT' 
AND "userId" = 'ID_DO_USUARIO';
```

### Deletar chat completamente
```sql
-- Deletar mensagens
DELETE FROM messages WHERE "chatId" = 'ID_DO_CHAT';

-- Deletar membros
DELETE FROM chat_members WHERE "chatId" = 'ID_DO_CHAT';

-- Deletar chat
DELETE FROM chats WHERE id = 'ID_DO_CHAT';
```

### Remover amizade
```sql
DELETE FROM friendships 
WHERE ("userId" = 'USER_ID_1' AND "friendId" = 'USER_ID_2')
   OR ("userId" = 'USER_ID_2' AND "friendId" = 'USER_ID_1');
```

---

## Estatísticas do Sistema

### Dashboard geral
```sql
SELECT 
    (SELECT COUNT(*) FROM users WHERE "isActive" = true) as active_users,
    (SELECT COUNT(*) FROM chats) as total_chats,
    (SELECT COUNT(*) FROM messages WHERE "isDeleted" = false) as total_messages,
    (SELECT COUNT(*) FROM friendships) as total_friendships;
```

### Usuários mais ativos (por mensagens)
```sql
SELECT 
    u.username,
    COUNT(m.id) as message_count
FROM users u
INNER JOIN messages m ON u.id = m."senderId"
WHERE m."isDeleted" = false
GROUP BY u.id
ORDER BY message_count DESC
LIMIT 10;
```

### Chats mais ativos
```sql
SELECT 
    c.name,
    c.type,
    COUNT(m.id) as message_count
FROM chats c
LEFT JOIN messages m ON c.id = m."chatId"
WHERE m."isDeleted" = false
GROUP BY c.id
ORDER BY message_count DESC
LIMIT 10;
```

---

## Backup e Restore

### Fazer backup
```bash
docker exec icea-chat-postgres pg_dump -U postgres icea_chat > backup.sql
```

### Restaurar backup
```bash
docker exec -i icea-chat-postgres psql -U postgres icea_chat < backup.sql
```

---

## Resetar Banco de Dados (CUIDADO!)

### Deletar todos os dados mas manter estrutura
```sql
TRUNCATE users CASCADE;
TRUNCATE chats CASCADE;
TRUNCATE messages CASCADE;
TRUNCATE friendships CASCADE;
TRUNCATE chat_members CASCADE;
```

### Resetar completamente (via Docker)
```bash
docker-compose down -v
docker-compose up -d
```

---

## Dicas

1. **Sempre faça backup antes de modificar dados em produção**
2. **Use transações para operações múltiplas:**
   ```sql
   BEGIN;
   -- seus comandos aqui
   COMMIT; -- ou ROLLBACK; para desfazer
   ```
3. **Teste comandos complexos com SELECT antes de usar UPDATE/DELETE**
4. **Use WHERE clauses com muito cuidado em UPDATE/DELETE**

---

## Monitoramento em Tempo Real

### Ver atividade em tempo real (usuários online via logs do backend)
Monitore os logs do backend para ver conexões WebSocket:
```bash
cd backend
npm run start:dev
# Observe as mensagens de conexão/desconexão
```

### Ver últimas mensagens em tempo real
Execute este query repetidamente:
```sql
SELECT 
    u.username,
    m.content,
    m."createdAt"
FROM messages m
INNER JOIN users u ON m."senderId" = u.id
WHERE m."isDeleted" = false
ORDER BY m."createdAt" DESC
LIMIT 5;
```
