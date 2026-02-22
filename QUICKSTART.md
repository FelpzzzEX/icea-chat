# ICEA Chat - Guia Rápido de Execução

## 🚀 Setup Automático (Recomendado)

```bash
cd icea-chat
chmod +x setup.sh
./setup.sh
```

Depois, abra dois terminais:

**Terminal 1 - Backend:**
```bash
cd icea-chat/backend
npm run start:dev
```

**Terminal 2 - Frontend:**
```bash
cd icea-chat/frontend
npm run dev
```

Acesse: http://localhost:3000

---

## 📝 Setup Manual

### 1. Iniciar PostgreSQL
```bash
cd icea-chat
docker-compose up -d
```

### 2. Backend
```bash
cd backend
npm install
npm run start:dev
```

### 3. Frontend (novo terminal)
```bash
cd frontend
npm install
npm run dev
```

---

## ✅ Verificar se está funcionando

- Backend: http://localhost:3001 (deve retornar 404 - é esperado)
- Frontend: http://localhost:3000 (deve abrir a página de login)
- PostgreSQL: `docker ps` (deve mostrar o container icea-chat-postgres)

---

## 🔧 Problemas Comuns

**Backend não inicia:**
```bash
docker-compose up -d
```

**Porta ocupada:**
```bash
# Backend (3001)
lsof -i :3001
kill -9 <PID>

# Frontend (3000)
lsof -i :3000
kill -9 <PID>
```

**Resetar banco de dados:**
```bash
docker-compose down -v
docker-compose up -d
```

---

## 📖 Documentação Completa

Leia o README.md para documentação detalhada.
