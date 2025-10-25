# 🚀 Guia de Deploy - Architecture Rendering App

Este guia detalha como fazer o deploy da aplicação em servidores externos (VPS/Cloud).

## 📋 Requisitos do Servidor

### Especificações Mínimas
- **CPU**: 2 cores
- **RAM**: 4GB
- **Armazenamento**: 20GB SSD
- **Sistema Operacional**: Ubuntu 22.04 LTS (recomendado)
- **Largura de banda**: Ilimitada ou mínimo 1TB/mês

### Software Necessário
- Node.js 22.x
- PostgreSQL 14+
- Nginx (para proxy reverso)
- PM2 (para gerenciamento de processos)
- Certbot (para SSL/HTTPS)

## 💰 Provedores Recomendados (Custo-Benefício)

### 1. **DigitalOcean** (Recomendado)
- **Plano**: Droplet Basic - $12/mês
- **Specs**: 2 vCPUs, 4GB RAM, 80GB SSD
- **Vantagens**: Interface simples, backups automáticos, boa documentação
- **Link**: https://www.digitalocean.com/

### 2. **Vultr**
- **Plano**: Cloud Compute - $12/mês
- **Specs**: 2 vCPUs, 4GB RAM, 80GB SSD
- **Vantagens**: Datacenters no Brasil, preço competitivo
- **Link**: https://www.vultr.com/

### 3. **Contabo**
- **Plano**: Cloud VPS M - €8.99/mês (~R$50)
- **Specs**: 4 vCPUs, 8GB RAM, 200GB SSD
- **Vantagens**: Melhor custo-benefício, muito espaço
- **Link**: https://contabo.com/

### 4. **Locaweb** (Nacional)
- **Plano**: Cloud Server M - R$149/mês
- **Specs**: 2 vCPUs, 4GB RAM, 80GB SSD
- **Vantagens**: Suporte em português, infraestrutura no Brasil
- **Desvantagens**: Mais caro que opções internacionais
- **Link**: https://www.locaweb.com.br/

### 5. **AWS Lightsail**
- **Plano**: $20/mês
- **Specs**: 2 vCPUs, 4GB RAM, 80GB SSD
- **Vantagens**: Integração com AWS, escalável
- **Link**: https://aws.amazon.com/lightsail/

## 🔧 Instalação Passo a Passo

### 1. Preparar o Servidor

```bash
# Conectar via SSH
ssh root@seu-servidor-ip

# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências básicas
apt install -y curl git build-essential nginx certbot python3-certbot-nginx
```

### 2. Instalar Node.js 22.x

```bash
# Adicionar repositório NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -

# Instalar Node.js
apt install -y nodejs

# Verificar instalação
node --version  # Deve mostrar v22.x.x
npm --version

# Instalar pnpm globalmente
npm install -g pnpm pm2
```

### 3. Instalar PostgreSQL

```bash
# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Iniciar serviço
systemctl start postgresql
systemctl enable postgresql

# Criar banco de dados e usuário
sudo -u postgres psql << EOF
CREATE DATABASE archrender;
CREATE USER archrender_user WITH ENCRYPTED PASSWORD 'sua_senha_segura_aqui';
GRANT ALL PRIVILEGES ON DATABASE archrender TO archrender_user;
\q
EOF
```

### 4. Configurar Usuário da Aplicação

```bash
# Criar usuário não-root
adduser archrender
usermod -aG sudo archrender

# Trocar para o novo usuário
su - archrender
```

### 5. Clonar e Configurar Aplicação

```bash
# Clonar repositório
cd ~
git clone https://github.com/israelisd1/arch-render-app.git
cd arch-render-app

# Instalar dependências
pnpm install

# Criar arquivo .env
nano .env
```

### 6. Configurar Variáveis de Ambiente (.env)

```env
# Database
DATABASE_URL=postgresql://archrender_user:sua_senha_segura_aqui@localhost:5432/archrender

# JWT
JWT_SECRET=gere_uma_string_aleatoria_segura_aqui

# OAuth Manus (ou configure seu próprio sistema de auth)
OAUTH_SERVER_URL=https://api.manus.im
OWNER_OPEN_ID=seu_owner_open_id
OWNER_NAME=Israel Dias

# RapidAPI
RAPIDAPI_KEY=sua_chave_rapidapi

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Config
VITE_APP_TITLE=Architecture Rendering App
VITE_APP_LOGO=/logo.png
VITE_APP_ID=archrender-prod
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=

# Server
PORT=3000
NODE_ENV=production
```

### 7. Preparar Banco de Dados

```bash
# Gerar e aplicar migrations
pnpm db:push
```

### 8. Build da Aplicação

```bash
# Build do frontend e backend
pnpm build
```

### 9. Configurar PM2

```bash
# Criar arquivo de configuração PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'arch-render-app',
    script: './dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOF

# Criar diretório de logs
mkdir -p logs

# Iniciar aplicação com PM2
pm2 start ecosystem.config.js

# Configurar PM2 para iniciar no boot
pm2 startup
pm2 save
```

### 10. Configurar Nginx

```bash
# Voltar para root
exit

# Criar configuração Nginx
cat > /etc/nginx/sites-available/archrender << 'EOF'
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Logs
    access_log /var/log/nginx/archrender-access.log;
    error_log /var/log/nginx/archrender-error.log;

    # Proxy para aplicação Node.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts para upload de imagens
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    # Aumentar limite de upload
    client_max_body_size 50M;
}
EOF

# Ativar site
ln -s /etc/nginx/sites-available/archrender /etc/nginx/sites-enabled/

# Remover site padrão
rm /etc/nginx/sites-enabled/default

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

### 11. Configurar SSL/HTTPS com Let's Encrypt

```bash
# Obter certificado SSL (substitua seu-dominio.com)
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática já está configurada
# Testar renovação
certbot renew --dry-run
```

### 12. Configurar Firewall

```bash
# Configurar UFW
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

## 🔄 Atualizações e Manutenção

### Atualizar Aplicação

```bash
# Como usuário archrender
su - archrender
cd ~/arch-render-app

# Baixar atualizações
git pull origin master

# Instalar novas dependências
pnpm install

# Rebuild
pnpm build

# Aplicar migrations (se houver)
pnpm db:push

# Reiniciar aplicação
pm2 restart arch-render-app
```

### Monitoramento

```bash
# Ver logs em tempo real
pm2 logs arch-render-app

# Ver status
pm2 status

# Ver métricas
pm2 monit

# Ver logs do Nginx
tail -f /var/log/nginx/archrender-access.log
tail -f /var/log/nginx/archrender-error.log
```

### Backup do Banco de Dados

```bash
# Criar backup manual
sudo -u postgres pg_dump archrender > backup_$(date +%Y%m%d).sql

# Restaurar backup
sudo -u postgres psql archrender < backup_20240101.sql

# Configurar backup automático diário
cat > /etc/cron.daily/archrender-backup << 'EOF'
#!/bin/bash
sudo -u postgres pg_dump archrender | gzip > /home/archrender/backups/db_$(date +%Y%m%d).sql.gz
find /home/archrender/backups -name "db_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /etc/cron.daily/archrender-backup
mkdir -p /home/archrender/backups
```

## 🔒 Segurança

### Recomendações de Segurança

1. **Firewall**: Mantenha UFW ativo com apenas portas necessárias abertas
2. **SSH**: Configure autenticação por chave SSH e desabilite login root
3. **Atualizações**: Configure atualizações automáticas de segurança
4. **Backups**: Mantenha backups regulares do banco de dados
5. **Monitoramento**: Configure alertas para uso de recursos
6. **Secrets**: NUNCA commite arquivos .env no Git
7. **Rate Limiting**: Configure rate limiting no Nginx para prevenir abuso

### Configurar Atualizações Automáticas

```bash
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

## 📊 Custos Estimados Mensais

### Opção Econômica (Contabo)
- **Servidor**: €8.99 (~R$50)
- **Domínio**: R$40/ano (~R$3/mês)
- **Total**: ~R$53/mês

### Opção Balanceada (Vultr/DigitalOcean)
- **Servidor**: $12 (~R$60)
- **Domínio**: R$40/ano (~R$3/mês)
- **Total**: ~R$63/mês

### Opção Nacional (Locaweb)
- **Servidor**: R$149/mês
- **Domínio**: R$40/ano (~R$3/mês)
- **Total**: ~R$152/mês

## 🆘 Troubleshooting

### Aplicação não inicia
```bash
# Verificar logs
pm2 logs arch-render-app --lines 100

# Verificar variáveis de ambiente
pm2 env 0

# Reiniciar
pm2 restart arch-render-app
```

### Erro de conexão com banco de dados
```bash
# Verificar se PostgreSQL está rodando
systemctl status postgresql

# Testar conexão
psql -U archrender_user -d archrender -h localhost
```

### Nginx retorna 502 Bad Gateway
```bash
# Verificar se aplicação está rodando
pm2 status

# Verificar logs do Nginx
tail -f /var/log/nginx/archrender-error.log
```

## 📞 Suporte

Para dúvidas sobre o deploy, abra uma issue no GitHub:
https://github.com/israelisd1/arch-render-app/issues

---

**Boa sorte com o deploy! 🚀**

