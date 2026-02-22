# Migração TypeORM → Prisma

## Passos para configurar o backend com Prisma

```bash
cd backend

# 1. Instalar dependências (Prisma substitui TypeORM)
npm install

# 2. Gerar o Prisma Client
npx prisma generate

# 3a. Se for banco de dados NOVO ou quiser apagar tudo:
npx prisma db push --force-reset

# 3b. Se quiser preservar dados existentes (pode falhar por conflito de enums TypeORM):
npx prisma db push

# 4. Iniciar o backend normalmente
npm run start:dev
```

## O que mudou

- TypeORM e @nestjs/typeorm removidos
- @prisma/client e prisma instalados
- Novo arquivo `prisma/schema.prisma` com o schema completo
- `PrismaService` injetado globalmente via `PrismaModule`
- Todos os services reescritos com Prisma
- Entity files (.entity.ts) mantidos mas não usados

## Bugs corrigidos

- **Apagar grupo**: `onDelete: Cascade` no schema garante que mensagens são 
  deletadas automaticamente ao deletar um chat
- **Apagar conta**: Soft-delete que libera username/email para reutilização 
  (renomeia para `deleted_{timestamp}`)
