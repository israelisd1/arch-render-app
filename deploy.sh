#!/bin/bash

# Script de Deploy Automatizado - Architecture Rendering App
# Uso: ./deploy.sh

set -e  # Parar em caso de erro

echo "🚀 Iniciando processo de deploy..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para printar mensagens coloridas
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Verificar se está na raiz do projeto
if [ ! -f "package.json" ]; then
    print_error "Erro: Execute este script na raiz do projeto!"
    exit 1
fi

# Verificar se arquivo .env existe
if [ ! -f ".env" ]; then
    print_error "Erro: Arquivo .env não encontrado!"
    print_warning "Crie um arquivo .env baseado no .env.example"
    exit 1
fi

# Fazer backup do banco de dados
echo "📦 Fazendo backup do banco de dados..."
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR
BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"

# Extrair dados de conexão do .env
DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2)
if [ ! -z "$DB_URL" ]; then
    # Fazer backup usando pg_dump (ajuste conforme necessário)
    print_warning "Backup do banco de dados deve ser feito manualmente"
    # pg_dump $DB_URL > $BACKUP_FILE
    # print_success "Backup salvo em $BACKUP_FILE"
fi

# Atualizar código do repositório
echo "📥 Atualizando código do repositório..."
git pull origin master
print_success "Código atualizado"

# Instalar/atualizar dependências
echo "📦 Instalando dependências..."
pnpm install --frozen-lockfile
print_success "Dependências instaladas"

# Aplicar migrations do banco de dados
echo "🗄️  Aplicando migrations do banco de dados..."
pnpm db:push
print_success "Migrations aplicadas"

# Build da aplicação
echo "🔨 Compilando aplicação..."
pnpm build
print_success "Build concluído"

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 não encontrado. Instalando..."
    npm install -g pm2
    print_success "PM2 instalado"
fi

# Reiniciar aplicação com PM2
echo "🔄 Reiniciando aplicação..."
if pm2 list | grep -q "arch-render-app"; then
    pm2 restart arch-render-app
    print_success "Aplicação reiniciada"
else
    pm2 start ecosystem.config.js
    pm2 save
    print_success "Aplicação iniciada"
fi

# Verificar status
echo "📊 Status da aplicação:"
pm2 status arch-render-app

# Mostrar logs recentes
echo ""
echo "📝 Últimas 20 linhas de log:"
pm2 logs arch-render-app --lines 20 --nostream

echo ""
print_success "Deploy concluído com sucesso! 🎉"
echo ""
echo "Comandos úteis:"
echo "  pm2 logs arch-render-app    # Ver logs em tempo real"
echo "  pm2 monit                   # Monitorar recursos"
echo "  pm2 restart arch-render-app # Reiniciar aplicação"
echo "  pm2 stop arch-render-app    # Parar aplicação"

