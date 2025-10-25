# ⚡ Guia Rápido de Deploy

## Opção 1: Instalação Automática (Recomendado)

Para servidor Ubuntu 22.04 LTS novo:

```bash
# 1. Conectar ao servidor
ssh root@seu-servidor-ip

# 2. Clonar repositório
git clone https://github.com/israelisd1/arch-render-app.git
cd arch-render-app

# 3. Executar instalação automática
sudo ./install.sh
```

O script irá solicitar:
- Domínio (ex: meusite.com)
- Email para SSL
- Senha para banco de dados

**Tempo estimado**: 10-15 minutos

---

## Opção 2: Instalação Manual

Siga o guia completo em [DEPLOY.md](./DEPLOY.md)

---

## Após a Instalação

### 1. Configurar Variáveis de Ambiente

```bash
sudo nano /home/archrender/arch-render-app/.env
```

Adicione suas chaves de API:
- `RAPIDAPI_KEY` - Para renderização com IA
- `STRIPE_SECRET_KEY` - Para pagamentos
- `STRIPE_PUBLISHABLE_KEY` - Para checkout
- `STRIPE_WEBHOOK_SECRET` - Para webhooks
- `OAUTH_SERVER_URL` - Para autenticação
- `OWNER_OPEN_ID` - Seu ID de usuário
- `OWNER_NAME` - Seu nome

### 2. Reiniciar Aplicação

```bash
sudo -u archrender pm2 restart arch-render-app
```

### 3. Verificar Status

```bash
sudo -u archrender pm2 status
sudo -u archrender pm2 logs arch-render-app
```

---

## Custos Mensais Estimados

| Provedor | Plano | Custo/mês | Specs |
|----------|-------|-----------|-------|
| **Contabo** | Cloud VPS M | R$ 50 | 4 vCPUs, 8GB RAM, 200GB SSD |
| **Vultr** | Cloud Compute | R$ 60 | 2 vCPUs, 4GB RAM, 80GB SSD |
| **DigitalOcean** | Droplet Basic | R$ 60 | 2 vCPUs, 4GB RAM, 80GB SSD |
| **Locaweb** | Cloud Server M | R$ 149 | 2 vCPUs, 4GB RAM, 80GB SSD |

**Recomendação**: Contabo (melhor custo-benefício) ou Vultr (datacenter no Brasil)

---

## Comandos Úteis

```bash
# Ver logs em tempo real
sudo -u archrender pm2 logs arch-render-app

# Reiniciar aplicação
sudo -u archrender pm2 restart arch-render-app

# Ver status
sudo -u archrender pm2 status

# Monitorar recursos
sudo -u archrender pm2 monit

# Atualizar aplicação
cd /home/archrender/arch-render-app
sudo -u archrender ./deploy.sh

# Backup manual do banco
sudo -u postgres pg_dump archrender > backup.sql
```

---

## Troubleshooting

### Aplicação não inicia
```bash
sudo -u archrender pm2 logs arch-render-app --lines 50
```

### Erro 502 Bad Gateway
```bash
sudo -u archrender pm2 status
sudo systemctl status nginx
```

### Erro de conexão com banco
```bash
sudo systemctl status postgresql
sudo -u postgres psql -l
```

---

## Suporte

- **Documentação completa**: [DEPLOY.md](./DEPLOY.md)
- **Issues**: https://github.com/israelisd1/arch-render-app/issues
- **Email**: Seu email aqui

---

**Boa sorte com o deploy! 🚀**

