# 🚀 Guia Completo de Instalação - Architecture Rendering App

**Guia passo a passo para instalar a aplicação completa do zero.**

Tempo estimado: **2-3 horas**

---

## 📋 Índice

1. [Pré-requisitos e Contas Necessárias](#1-pré-requisitos-e-contas-necessárias)
2. [Registrar Domínio](#2-registrar-domínio-opcional-mas-recomendado)
3. [Configurar DigitalOcean VPS](#3-configurar-digitalocean-vps)
4. [Configurar DigitalOcean Spaces (S3)](#4-configurar-digitalocean-spaces-s3)
5. [Configurar Google OAuth](#5-configurar-google-oauth)
6. [Configurar Stripe](#6-configurar-stripe)
7. [Configurar RapidAPI](#7-configurar-rapidapi)
8. [Configurar SMTP para Emails](#8-configurar-smtp-para-emails)
9. [Instalar Aplicação no Servidor](#9-instalar-aplicação-no-servidor)
10. [Configurar Variáveis de Ambiente](#10-configurar-variáveis-de-ambiente)
11. [Configurar DNS e SSL](#11-configurar-dns-e-ssl)
12. [Testes Finais](#12-testes-finais)
13. [Manutenção e Monitoramento](#13-manutenção-e-monitoramento)

---

## 1. Pré-requisitos e Contas Necessárias

### ✅ Checklist de Contas

Crie contas nos seguintes serviços (todos têm planos gratuitos ou trial):

- [ ] **DigitalOcean** - VPS e S3 (https://www.digitalocean.com)
- [ ] **Registro.br** - Domínio .com.br (https://registro.br) - Opcional
- [ ] **Google Cloud** - OAuth para login (https://console.cloud.google.com)
- [ ] **Stripe** - Pagamentos (https://stripe.com)
- [ ] **RapidAPI** - Renderização com IA (https://rapidapi.com)
- [ ] **Gmail** - SMTP para emails (ou outro provedor)

### 💰 Custos Estimados

| Item | Custo/mês | Obrigatório |
|------|-----------|-------------|
| DigitalOcean Droplet (VPS) | $12-18 (~R$60-90) | ✅ Sim |
| DigitalOcean Spaces (S3) | $5 (~R$25) | ✅ Sim |
| Domínio .com.br | R$40/ano (~R$3/mês) | ⚠️ Recomendado |
| RapidAPI | Variável por uso | ✅ Sim |
| Stripe | 2.9% + $0.30 por venda | ✅ Sim |
| Google OAuth | Gratuito | ✅ Sim |
| Gmail SMTP | Gratuito | ✅ Sim |
| **TOTAL** | **~R$88-118/mês + uso** | |

---

## 2. Registrar Domínio (Opcional mas Recomendado)

### Opção A: Registro.br (Recomendado para .com.br)

1. Acesse https://registro.br
2. Clique em **"Registrar Domínio"**
3. Pesquise o domínio desejado (ex: `renderarq.com.br`)
4. Adicione ao carrinho e finalize compra
5. **Custo**: ~R$40/ano

### Opção B: Namecheap (Para .com)

1. Acesse https://www.namecheap.com
2. Pesquise o domínio desejado
3. Adicione ao carrinho e finalize
4. **Custo**: ~$10/ano

⏱️ **Aguarde**: Domínio fica disponível em minutos

---

## 3. Configurar DigitalOcean VPS

### 3.1 Criar Conta DigitalOcean

1. Acesse https://www.digitalocean.com
2. Clique em **"Sign Up"**
3. Preencha dados e verifique email
4. Adicione método de pagamento (cartão de crédito)

### 3.2 Criar Droplet (Servidor VPS)

1. No painel, clique em **"Create"** → **"Droplets"**

2. **Choose an image**:
   - Selecione: **Ubuntu 22.04 (LTS) x64**

3. **Choose Size**:
   - Tipo: **Basic** (Shared CPU)
   - CPU: **Regular**
   - Plano recomendado: **$18/mo** (2 vCPUs, 4GB RAM, 80GB SSD)
   - Plano mínimo: **$12/mo** (2 vCPUs, 2GB RAM, 50GB SSD)

4. **Choose a datacenter region**:
   - **Recomendado**: São Paulo 1 (menor latência para Brasil)
   - **Alternativa**: New York 1 (mais barato)

5. **Authentication**:
   - Escolha: **Password**
   - Crie uma senha forte (ex: `Arch@2024!Secure#VPS`)
   - ⚠️ **ANOTE A SENHA EM LOCAL SEGURO**

6. **Finalize Details**:
   - Hostname: `archrender-app`
   - Tags: `production` (opcional)

7. Clique em **"Create Droplet"**

⏱️ **Aguarde**: 1-2 minutos para criação

### 3.3 Anotar Informações do Droplet

Após criação, anote:
- ✅ **IP do Droplet**: Ex: `164.90.123.45`
- ✅ **Senha root**: A que você criou
- ✅ **Região**: Ex: São Paulo 1

---

## 4. Configurar DigitalOcean Spaces (S3)

### 4.1 Criar Space

1. No painel DigitalOcean, vá em **"Manage"** → **"Spaces"**
2. Clique em **"Create Space"**

**Configurações**:
- **Datacenter**: Escolha a **mesma região do Droplet** (ex: São Paulo 1)
- **Enable CDN**: ✅ **Marque** (acelera carregamento)
- **Space Name**: `archrender-images` (ou nome de sua preferência)
- **File Listing**: **Restrict File Listing** (recomendado)

3. Clique em **"Create Space"**

### 4.2 Obter Credenciais do Space

1. Vá em **"API"** → **"Spaces Keys"**
2. Clique em **"Generate New Key"**
3. Nome: `archrender-app`
4. Clique em **"Generate Key"**

⚠️ **IMPORTANTE**: Anote IMEDIATAMENTE (só aparece uma vez):
- ✅ **Access Key**: Ex: `DO00ABCDEFGHIJKLMNOP`
- ✅ **Secret Key**: Ex: `abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`

### 4.3 Anotar Endpoint do Space

O endpoint será:
```
https://archrender-images.sao1.digitaloceanspaces.com
```

Formato: `https://[SPACE_NAME].[REGION].digitaloceanspaces.com`

**CDN URL** (para servir imagens):
```
https://archrender-images.sao1.cdn.digitaloceanspaces.com
```

---

## 5. Configurar Google OAuth

### 5.1 Criar Projeto no Google Cloud

1. Acesse https://console.cloud.google.com
2. Clique em **"Select a project"** → **"New Project"**
3. Nome: **"Architecture Render App"**
4. Clique em **"Create"**
5. Selecione o projeto criado

### 5.2 Configurar OAuth Consent Screen

1. No menu lateral, vá em **"APIs & Services"** → **"OAuth consent screen"**
2. User Type: Selecione **"External"**
3. Clique em **"Create"**

**Preencha**:
- App name: `Architecture Rendering App`
- User support email: Seu email
- App logo: (opcional)
- Application home page: `https://seudominio.com.br`
- Authorized domains: `seudominio.com.br`
- Developer contact: Seu email

4. Clique em **"Save and Continue"**

**Scopes**:
- Clique em **"Add or Remove Scopes"**
- Selecione: `email`, `profile`, `openid`
- Clique em **"Update"** → **"Save and Continue"**

**Test users** (se app não publicado):
- Adicione seu email para testes
- Clique em **"Save and Continue"**

### 5.3 Criar OAuth Client ID

1. Vá em **"Credentials"** → **"Create Credentials"** → **"OAuth 2.0 Client ID"**

**Configurações**:
- Application type: **Web application**
- Name: **Architecture Render Web**

**Authorized JavaScript origins**:
```
https://seudominio.com.br
http://localhost:3000
```

**Authorized redirect URIs**:
```
https://seudominio.com.br/api/auth/callback/google
http://localhost:3000/api/auth/callback/google
```

2. Clique em **"Create"**

**Anote**:
- ✅ **Client ID**: Ex: `123456789-abc.apps.googleusercontent.com`
- ✅ **Client Secret**: Ex: `GOCSPX-abc123def456`

---

## 6. Configurar Stripe

### 6.1 Criar Conta Stripe

1. Acesse https://stripe.com
2. Clique em **"Sign up"**
3. Preencha dados e verifique email
4. Complete o cadastro da empresa

### 6.2 Ativar Modo de Teste

1. No painel, certifique-se que está em **"Test mode"** (canto superior direito)

### 6.3 Obter Chaves de API

1. Vá em **"Developers"** → **"API keys"**

**Anote**:
- ✅ **Publishable key**: Ex: `pk_test_51abc...`
- ✅ **Secret key**: Ex: `sk_test_51abc...` (clique em "Reveal")

### 6.4 Configurar Webhook

1. Vá em **"Developers"** → **"Webhooks"**
2. Clique em **"Add endpoint"**
3. Endpoint URL: `https://seudominio.com.br/api/stripe/webhook`
4. Selecione eventos:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Clique em **"Add endpoint"**

**Anote**:
- ✅ **Webhook Secret**: Ex: `whsec_abc123...` (clique em "Reveal")

### 6.5 Criar Produtos

1. Vá em **"Products"** → **"Add product"**

Crie os seguintes produtos:

**Produto 1: 10 Tokens**
- Name: `10 Tokens`
- Price: `R$ 29,90` (ou valor desejado)
- Recurring: **One time**

**Produto 2: 50 Tokens**
- Name: `50 Tokens`
- Price: `R$ 129,90`
- Recurring: **One time**

**Produto 3: 100 Tokens**
- Name: `100 Tokens`
- Price: `R$ 229,90`
- Recurring: **One time**

---

## 7. Configurar RapidAPI

### 7.1 Criar Conta RapidAPI

1. Acesse https://rapidapi.com
2. Clique em **"Sign Up"**
3. Preencha dados e verifique email

### 7.2 Encontrar API de Renderização

1. Na busca, procure por: **"AI Image Generation"** ou **"Architectural Rendering"**
2. Escolha uma API (ex: Stability AI, Midjourney, etc.)
3. Clique em **"Subscribe to Test"**
4. Escolha um plano (geralmente tem plano gratuito para testes)

### 7.3 Obter Chave da API

1. Na página da API, vá em **"Code Snippets"**
2. No header `X-RapidAPI-Key`, copie a chave

**Anote**:
- ✅ **RapidAPI Key**: Ex: `abc123def456ghi789...`

---

## 8. Configurar SMTP para Emails

### Opção A: Gmail (Recomendado para testes)

1. Acesse https://myaccount.google.com/security
2. Ative **"2-Step Verification"**
3. Vá em **"App passwords"**
4. Selecione app: **Mail**, device: **Other** (digite "ArchRender")
5. Clique em **"Generate"**

**Anote**:
- ✅ **SMTP Host**: `smtp.gmail.com`
- ✅ **SMTP Port**: `587`
- ✅ **SMTP User**: Seu email Gmail
- ✅ **SMTP Pass**: A senha de app gerada (ex: `abcd efgh ijkl mnop`)

### Opção B: SendGrid (Recomendado para produção)

1. Acesse https://sendgrid.com
2. Crie conta gratuita (100 emails/dia)
3. Vá em **"Settings"** → **"API Keys"**
4. Crie uma API Key

**Anote**:
- ✅ **SMTP Host**: `smtp.sendgrid.net`
- ✅ **SMTP Port**: `587`
- ✅ **SMTP User**: `apikey`
- ✅ **SMTP Pass**: A API Key gerada

---

## 9. Instalar Aplicação no Servidor

### 9.1 Conectar ao Servidor via SSH

**No Windows (PowerShell ou CMD)**:
```bash
ssh root@164.90.123.45
```

**No Mac/Linux (Terminal)**:
```bash
ssh root@164.90.123.45
```

Digite `yes` quando perguntado sobre fingerprint.
Digite a senha do Droplet que você criou.

### 9.2 Clonar Repositório

```bash
git clone https://github.com/israelisd1/arch-render-app.git
cd arch-render-app
```

### 9.3 Executar Script de Instalação Automática

```bash
sudo ./install.sh
```

O script irá solicitar:

1. **Domínio**: Digite `seudominio.com.br` (ou pressione Enter se não tiver)
2. **Email**: Digite seu email para certificado SSL
3. **Senha do banco**: Crie uma senha forte (ex: `Postgres@2024!Secure`)

⏱️ **Aguarde**: 10-15 minutos para instalação completa

O script irá:
- ✅ Instalar Node.js 22.x
- ✅ Instalar PostgreSQL
- ✅ Instalar Nginx
- ✅ Instalar PM2
- ✅ Criar banco de dados
- ✅ Instalar dependências
- ✅ Fazer build da aplicação
- ✅ Configurar SSL/HTTPS
- ✅ Configurar firewall
- ✅ Configurar backup automático

---

## 10. Configurar Variáveis de Ambiente

### 10.1 Editar Arquivo .env

```bash
sudo nano /home/archrender/arch-render-app/.env
```

### 10.2 Preencher Todas as Variáveis

Cole o seguinte conteúdo e **substitua os valores** pelos que você anotou:

```env
# ===== DATABASE =====
DATABASE_URL=postgresql://archrender_user:SUA_SENHA_DO_BANCO@localhost:5432/archrender

# ===== JWT =====
JWT_SECRET=chave_gerada_automaticamente_pelo_script

# ===== NEXTAUTH =====
NEXTAUTH_URL=https://seudominio.com.br
NEXTAUTH_SECRET=gere_com_openssl_rand_base64_32

# ===== GOOGLE OAUTH =====
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456

# ===== DIGITALOCEAN SPACES (S3) =====
AWS_ACCESS_KEY_ID=DO00ABCDEFGHIJKLMNOP
AWS_SECRET_ACCESS_KEY=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
AWS_REGION=sao1
AWS_BUCKET_NAME=archrender-images
AWS_ENDPOINT=https://sao1.digitaloceanspaces.com
S3_PUBLIC_URL=https://archrender-images.sao1.cdn.digitaloceanspaces.com

# ===== RAPIDAPI =====
RAPIDAPI_KEY=abc123def456ghi789

# ===== STRIPE =====
STRIPE_SECRET_KEY=sk_test_51abc...
STRIPE_PUBLISHABLE_KEY=pk_test_51abc...
STRIPE_WEBHOOK_SECRET=whsec_abc123...

# ===== SMTP (EMAIL) =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_FROM=noreply@seudominio.com.br

# ===== APP CONFIG =====
VITE_APP_TITLE=Architecture Rendering App
VITE_APP_LOGO=/logo.png
VITE_APP_ID=archrender-prod
PORT=3000
NODE_ENV=production
```

**Salvar**: `Ctrl + O` → `Enter` → `Ctrl + X`

### 10.3 Gerar NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copie o resultado e cole no `.env` na variável `NEXTAUTH_SECRET`

### 10.4 Aplicar Migrations do Banco

```bash
cd /home/archrender/arch-render-app
sudo -u archrender pnpm db:push
```

### 10.5 Rebuild e Reiniciar Aplicação

```bash
sudo -u archrender pnpm build
sudo -u archrender pm2 restart arch-render-app
```

---

## 11. Configurar DNS e SSL

### 11.1 Configurar DNS

#### Opção A: DNS da DigitalOcean (Recomendado)

1. No painel DigitalOcean, vá em **"Networking"** → **"Domains"**
2. Clique em **"Add Domain"**
3. Digite: `seudominio.com.br`
4. Clique em **"Add Domain"**

**Criar registros**:

**Registro A (Principal)**:
- Type: `A`
- Hostname: `@`
- Will Direct To: Selecione seu Droplet
- TTL: `3600`

**Registro A (WWW)**:
- Type: `A`
- Hostname: `www`
- Will Direct To: Selecione seu Droplet
- TTL: `3600`

**Atualizar nameservers no Registro.br**:
1. Acesse https://registro.br
2. Vá em **"Meus Domínios"** → Selecione seu domínio
3. Clique em **"Alterar Servidores DNS"**
4. Adicione:
   ```
   ns1.digitalocean.com
   ns2.digitalocean.com
   ns3.digitalocean.com
   ```

⏱️ **Aguarde**: 1-24h para propagação DNS

#### Opção B: DNS do Registro.br

1. Acesse o painel do Registro.br
2. Configure registro A:
   - Tipo: `A`
   - Nome: `@`
   - Valor: `164.90.123.45` (IP do seu Droplet)
3. Configure registro A para www:
   - Tipo: `A`
   - Nome: `www`
   - Valor: `164.90.123.45`

### 11.2 Verificar Propagação DNS

```bash
nslookup seudominio.com.br
```

Deve retornar o IP do seu Droplet.

### 11.3 Configurar SSL/HTTPS

Se o script `install.sh` já configurou SSL, pule esta etapa.

Caso contrário:

```bash
sudo certbot --nginx -d seudominio.com.br -d www.seudominio.com.br
```

Digite seu email quando solicitado.
Aceite os termos.
Escolha: **2** (Redirect HTTP to HTTPS)

---

## 12. Testes Finais

### 12.1 Verificar Status dos Serviços

```bash
# Status da aplicação
sudo -u archrender pm2 status

# Status do Nginx
sudo systemctl status nginx

# Status do PostgreSQL
sudo systemctl status postgresql

# Ver logs da aplicação
sudo -u archrender pm2 logs arch-render-app --lines 50
```

### 12.2 Acessar Aplicação

**Com domínio**:
```
https://seudominio.com.br
```

**Sem domínio** (temporário):
```
http://164.90.123.45
```

### 12.3 Testar Funcionalidades

- [ ] **Página inicial carrega**
- [ ] **Cadastro com email/senha funciona**
- [ ] **Login com email/senha funciona**
- [ ] **Login com Google funciona**
- [ ] **Upload de imagem funciona**
- [ ] **Renderização com IA funciona**
- [ ] **Sistema de tokens funciona**
- [ ] **Compra de tokens funciona (Stripe)**
- [ ] **Histórico de renderizações exibe**
- [ ] **Sistema de ajustes visuais funciona**
- [ ] **Download de imagens funciona**
- [ ] **Recuperação de senha funciona**
- [ ] **Troca de idioma PT/EN funciona**
- [ ] **HTTPS funcionando (cadeado verde)**

---

## 13. Manutenção e Monitoramento

### 13.1 Comandos Úteis

```bash
# Ver logs em tempo real
sudo -u archrender pm2 logs arch-render-app

# Reiniciar aplicação
sudo -u archrender pm2 restart arch-render-app

# Ver uso de recursos
sudo -u archrender pm2 monit

# Ver espaço em disco
df -h

# Ver uso de memória
free -h

# Backup manual do banco
sudo -u postgres pg_dump archrender > backup_$(date +%Y%m%d).sql
```

### 13.2 Atualizar Aplicação

```bash
cd /home/archrender/arch-render-app
sudo -u archrender ./deploy.sh
```

### 13.3 Configurar Backups Automáticos

Já configurado pelo script `install.sh`:
- Backup diário do banco de dados
- Mantém últimos 7 dias
- Localização: `/home/archrender/backups/`

### 13.4 Monitoramento

**Instalar agente de monitoramento DigitalOcean**:
```bash
curl -sSL https://repos.insights.digitalocean.com/install.sh | sudo bash
```

**Configurar alertas**:
1. No painel DigitalOcean, vá em **"Monitoring"**
2. Configure alertas para:
   - CPU > 80%
   - RAM > 90%
   - Disco > 85%

### 13.5 Segurança

**Configurar firewall na DigitalOcean**:
1. Vá em **"Networking"** → **"Firewalls"**
2. Crie firewall com regras:
   - SSH (22) - Apenas seu IP
   - HTTP (80) - All
   - HTTPS (443) - All

**Habilitar backups do Droplet**:
1. No painel do Droplet, clique em **"Backups"**
2. Clique em **"Enable Backups"**
3. Custo adicional: 20% do valor do Droplet

---

## 🎉 Parabéns! Instalação Completa!

Sua aplicação está no ar em: `https://seudominio.com.br`

### 📊 Resumo de Custos Mensais

```
DigitalOcean Droplet:    $12-18/mês  (~R$60-90)
DigitalOcean Spaces:     $5/mês      (~R$25)
Domínio:                 ~R$3/mês
RapidAPI:                Variável    (por uso)
Stripe:                  2.9% + $0.30 (por venda)
────────────────────────────────────────────────
TOTAL BASE:              ~R$88-118/mês + uso
```

### 📞 Suporte

- **GitHub Issues**: https://github.com/israelisd1/arch-render-app/issues
- **Documentação DigitalOcean**: https://docs.digitalocean.com
- **Documentação NextAuth**: https://next-auth.js.org
- **Documentação Stripe**: https://stripe.com/docs

### 📚 Documentos Adicionais

- `README.md` - Visão geral do projeto
- `DEPLOY.md` - Deploy em qualquer VPS
- `DIGITALOCEAN_SETUP.md` - Setup específico DigitalOcean
- `NEXTAUTH_IMPLEMENTATION.md` - Implementação NextAuth
- `AUTH_SETUP.md` - Configuração de autenticação
- `QUICKSTART.md` - Instalação rápida
- `DEPLOY_CHECKLIST.md` - Checklist de verificação

---

**Desenvolvido com ❤️ por Israel Dias**

