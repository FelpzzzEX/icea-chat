#!/bin/bash

echo "🚀 ICEA Chat - Setup Automático"
echo "================================"
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar Node.js
echo -e "${BLUE}[1/6]${NC} Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado!${NC}"
    echo "Instale o Node.js v18 ou superior: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) encontrado${NC}"
echo ""

# Verificar Docker
echo -e "${BLUE}[2/6]${NC} Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker não encontrado!${NC}"
    echo "Instale o Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✓ Docker encontrado${NC}"
echo ""

# Iniciar PostgreSQL
echo -e "${BLUE}[3/6]${NC} Iniciando PostgreSQL com Docker..."
docker-compose up -d
sleep 3
echo -e "${GREEN}✓ PostgreSQL iniciado${NC}"
echo ""

# Instalar dependências do backend
echo -e "${BLUE}[4/6]${NC} Instalando dependências do backend..."
cd backend
npm install
echo -e "${GREEN}✓ Dependências do backend instaladas${NC}"
echo ""

# Instalar dependências do frontend
echo -e "${BLUE}[5/6]${NC} Instalando dependências do frontend..."
cd ../frontend
npm install
echo -e "${GREEN}✓ Dependências do frontend instaladas${NC}"
echo ""

# Finalizar
echo -e "${BLUE}[6/6]${NC} Setup concluído!"
echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✅ ICEA Chat está pronto!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "📝 Próximos passos:"
echo ""
echo "1️⃣  Terminal 1 - Iniciar o Backend:"
echo "   cd backend"
echo "   npm run start:dev"
echo ""
echo "2️⃣  Terminal 2 - Iniciar o Frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3️⃣  Acesse: http://localhost:3000"
echo ""
echo "📖 Leia o README.md para mais informações"
echo ""
