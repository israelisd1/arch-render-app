#!/bin/bash

# Script de Instalação Rápida - Architecture Rendering App
# Para Ubuntu 22.04 LTS
# Uso: sudo ./install.sh

set -e

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Por favor, execute como root (sudo ./install.sh)"
    exit 1
fi

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

echo "╔════════════════════════════════════════════════════════╗"
echo "║  Architecture Rendering App - Instalação Automática   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Solicitar informações
read -p "Digite o domínio (ex: meusite.com): " DOMAIN
read -p "Digite o email para SSL (Let's Encrypt): " EMAIL
read -sp "Digite uma senha para o banco de dados: " DB_PASSWORD
echo ""

print_info "Iniciando instalação..."

# 1. Atualizar sistema
print_info "Atualizando sistema..."
apt update && apt upgrade -y
print_success "Sistema atualizado"

# 2. Instalar dependências básicas
print_info "Instalando dependências básicas..."
apt install -y curl git build-essential nginx certbot python3-certbot-nginx ufw
print_success "Dependências instaladas"

# 3. Instalar Node.js 22.x
print_info "Instalando Node.js 22.x..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
npm install -g pnpm pm2
print_success "Node.js $(node --version) instalado"

# 4. Instalar PostgreSQL
print_info "Instalando PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Criar banco de dados
sudo -u postgres psql << EOF
CREATE DATABASE archrender;
CREATE USER archrender_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE archrender TO archrender_user;
ALTER DATABASE archrender OWNER TO archrender_user;
\q
EOF
print_success "PostgreSQL configurado"

# 5. Criar usuário da aplicação
print_info "Criando usuário da aplicação..."
if id "archrender" &>/dev/null; then
    print_warning "Usuário archrender já existe"
else
    adduser --disabled-password --gecos "" archrender
    print_success "Usuário archrender criado"
fi

# 6. Clonar repositório
print_info "Clonando repositório..."
cd /home/archrender
if [ -d "arch-render-app" ]; then
    print_warning "Diretório já existe, atualizando..."
    cd arch-render-app
    sudo -u archrender git pull
else
    sudo -u archrender git clone https://github.com/israelisd1/arch-render-app.git
    cd arch-render-app
fi
print_success "Repositório clonado"

# 7. Criar arquivo .env
print_info "Configurando variáveis de ambiente..."
cat > .env << EOF
DATABASE_URL=postgresql://archrender_user:$DB_PASSWORD@localhost:5432/archrender
JWT_SECRET=$(openssl rand -hex 32)
PORT=3000
NODE_ENV=production
VITE_APP_TITLE=Architecture Rendering App
VITE_APP_LOGO=/logo.png
VITE_APP_ID=archrender-prod

# IMPORTANTE: Configure estas variáveis manualmente:
# OAUTH_SERVER_URL=
# OWNER_OPEN_ID=
# OWNER_NAME=
# RAPIDAPI_KEY=
# STRIPE_SECRET_KEY=
# STRIPE_PUBLISHABLE_KEY=
# STRIPE_WEBHOOK_SECRET=
EOF
chown archrender:archrender .env
print_success "Arquivo .env criado"

# 8. Instalar dependências e build
print_info "Instalando dependências..."
sudo -u archrender pnpm install
print_success "Dependências instaladas"

print_info "Aplicando migrations..."
sudo -u archrender pnpm db:push
print_success "Migrations aplicadas"

print_info "Compilando aplicação..."
sudo -u archrender pnpm build
print_success "Build concluído"

# 9. Configurar PM2
print_info "Configurando PM2..."
sudo -u archrender mkdir -p logs
sudo -u archrender pm2 start ecosystem.config.js
sudo -u archrender pm2 save
env PATH=$PATH:/usr/bin pm2 startup systemd -u archrender --hp /home/archrender
print_success "PM2 configurado"

# 10. Configurar Nginx
print_info "Configurando Nginx..."
cat > /etc/nginx/sites-available/archrender << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    access_log /var/log/nginx/archrender-access.log;
    error_log /var/log/nginx/archrender-error.log;
    
    client_max_body_size 50M;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }
}
EOF

ln -sf /etc/nginx/sites-available/archrender /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
print_success "Nginx configurado"

# 11. Configurar SSL
print_info "Configurando SSL com Let's Encrypt..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL
print_success "SSL configurado"

# 12. Configurar Firewall
print_info "Configurando firewall..."
ufw --force enable
ufw allow OpenSSH
ufw allow 'Nginx Full'
print_success "Firewall configurado"

# 13. Configurar backup automático
print_info "Configurando backup automático..."
cat > /etc/cron.daily/archrender-backup << 'EOF'
#!/bin/bash
sudo -u postgres pg_dump archrender | gzip > /home/archrender/backups/db_$(date +%Y%m%d).sql.gz
find /home/archrender/backups -name "db_*.sql.gz" -mtime +7 -delete
EOF
chmod +x /etc/cron.daily/archrender-backup
sudo -u archrender mkdir -p /home/archrender/backups
print_success "Backup automático configurado"

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║           ✓ Instalação Concluída com Sucesso!         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
print_success "Aplicação instalada e rodando!"
echo ""
print_info "Próximos passos:"
echo "  1. Edite /home/archrender/arch-render-app/.env"
echo "  2. Configure as chaves da API (RapidAPI, Stripe, OAuth)"
echo "  3. Reinicie a aplicação: sudo -u archrender pm2 restart arch-render-app"
echo ""
print_info "Acesse sua aplicação em: https://$DOMAIN"
echo ""
print_info "Comandos úteis:"
echo "  sudo -u archrender pm2 logs arch-render-app  # Ver logs"
echo "  sudo -u archrender pm2 status                # Ver status"
echo "  sudo -u archrender pm2 restart arch-render-app  # Reiniciar"
echo ""

