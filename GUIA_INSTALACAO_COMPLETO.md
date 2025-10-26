# 🚀 Guia Completo de Instalação - Arqrender
## Deploy usando DigitalOcean App Platform

**Última atualização**: 26 de outubro de 2025

Este guia consolida **todos os passos necessários** para colocar o Arqrender no ar usando o **DigitalOcean App Platform**, uma solução PaaS (Platform-as-a-Service) que simplifica drasticamente o deploy e gerenciamento da aplicação.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Parte 1: Preparação de Contas e Serviços](#parte-1-preparação-de-contas-e-serviços)
4. [Parte 2: Configuração do Repositório GitHub](#parte-2-configuração-do-repositório-github)
5. [Parte 3: Configuração do Google OAuth](#parte-3-configuração-do-google-oauth)
6. [Parte 4: Configuração do Stripe](#parte-4-configuração-do-stripe)
7. [Parte 5: Configuração do RapidAPI](#parte-5-configuração-do-rapidapi)
8. [Parte 6: Configuração do DigitalOcean Spaces (S3)](#parte-6-configuração-do-digitalocean-spaces-s3)
9. [Parte 7: Configuração do Banco de Dados PostgreSQL](#parte-7-configuração-do-banco-de-dados-postgresql)
10. [Parte 8: Deploy no App Platform](#parte-8-deploy-no-app-platform)
11. [Parte 9: Configuração de Variáveis de Ambiente](#parte-9-configuração-de-variáveis-de-ambiente)
12. [Parte 10: Configuração de Domínio Customizado](#parte-10-configuração-de-domínio-customizado)
13. [Parte 11: Testes Finais](#parte-11-testes-finais)
14. [Manutenção e Monitoramento](#manutenção-e-monitoramento)
15. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

### O que é o App Platform?

O **DigitalOcean App Platform** é uma solução PaaS que permite fazer deploy de aplicações diretamente do GitHub sem se preocupar com servidores, configuração de Nginx, PM2, SSL ou infraestrutura. Tudo é gerenciado automaticamente.

### Vantagens sobre VPS tradicional:

| Aspecto | VPS Tradicional | App Platform |
|---------|----------------|--------------|
| **Configuração inicial** | 2-3 horas (manual) | 15-30 minutos (automático) |
| **SSL/HTTPS** | Manual (Let's Encrypt) | Automático |
| **Escalabilidade** | Manual (requer reconfiguração) | Automático (sliders) |
| **Monitoramento** | Instalar ferramentas | Integrado |
| **Deploy** | SSH + Git pull + restart | Git push (automático) |
| **Backup** | Manual | Automático |
| **Custo inicial** | ~R$50-60/mês | ~R$70-100/mês |

### Arquitetura da Solução:

```
┌─────────────────────────────────────────────────────────┐
│           DIGITALOCEAN APP PLATFORM                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────┐      ┌──────────────────┐       │
│  │   Web Service    │      │   PostgreSQL     │       │
│  │  (Node.js App)   │◄────►│  (Managed DB)    │       │
│  │  - Frontend      │      │                  │       │
│  │  - Backend API   │      └──────────────────┘       │
│  └──────────────────┘                                  │
│         │                                              │
│         ▼                                              │
│  ┌──────────────────┐                                  │
│  │   Spaces (S3)    │                                  │
│  │  - Imagens       │                                  │
│  │  - Uploads       │                                  │
│  └──────────────────┘                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│              SERVIÇOS EXTERNOS                          │
├─────────────────────────────────────────────────────────┤
│  • Google OAuth (Login)                                 │
│  • Stripe (Pagamentos)                                  │
│  • RapidAPI (Renderização IA)                           │
└─────────────────────────────────────────────────────────┘
```

### Tempo estimado total: **1h30 - 2h**

### Custo mensal estimado:

| Serviço | Custo/mês |
|---------|-----------|
| App Platform (Basic) | $12 (~R$60) |
| PostgreSQL Managed DB (Basic) | $15 (~R$75) |
| Spaces (250GB) | $5 (~R$25) |
| Domínio .com.br | ~R$3 |
| **TOTAL** | **~R$163/mês** |

**+ Custos variáveis:**
- Stripe: 4.99% + R$0.49 por transação
- RapidAPI: Conforme uso (plano gratuito disponível)

---

## 📝 Pré-requisitos

Antes de começar, você precisará criar contas nos seguintes serviços:

### ✅ Contas Necessárias:

- [ ] **GitHub** - https://github.com (gratuito)
- [ ] **DigitalOcean** - https://www.digitalocean.com
- [ ] **Google Cloud Console** - https://console.cloud.google.com (gratuito)
- [ ] **Stripe** - https://stripe.com
- [ ] **RapidAPI** - https://rapidapi.com (plano gratuito disponível)
- [ ] **Registrador de Domínio** (opcional) - Registro.br, Namecheap, etc.

### 🛠️ Ferramentas Necessárias:

- [ ] Navegador web moderno (Chrome, Firefox, Edge)
- [ ] Editor de texto para anotações (Bloco de Notas, Notion, etc.)
- [ ] Acesso ao email (para verificações)

### 📄 Informações que você precisará anotar:

Prepare um documento para anotar as seguintes informações durante o processo:

```
=== CREDENCIAIS E CONFIGURAÇÕES ===

GITHUB:
- Repository URL: _______________________
- Branch: _______________________

GOOGLE OAUTH:
- Client ID: _______________________
- Client Secret: _______________________

STRIPE:
- Publishable Key: _______________________
- Secret Key: _______________________
- Webhook Secret: _______________________
- Product ID (1 token): _______________________
- Product ID (10 tokens): _______________________
- Product ID (50 tokens): _______________________

RAPIDAPI:
- API Key: _______________________

DIGITALOCEAN SPACES:
- Space Name: _______________________
- Region: _______________________
- Access Key: _______________________
- Secret Key: _______________________
- Endpoint: _______________________
- CDN Endpoint: _______________________

DIGITALOCEAN DATABASE:
- Connection String: _______________________
- Host: _______________________
- Port: _______________________
- Database: _______________________
- User: _______________________
- Password: _______________________

DOMÍNIO (se aplicável):
- Domínio: _______________________
- Registrador: _______________________
```

---

## 🔧 Parte 1: Preparação de Contas e Serviços

### 1.1 Criar Conta no DigitalOcean

**Tempo estimado**: 5 minutos

1. Acesse https://www.digitalocean.com
2. Clique em **Sign Up**
3. Preencha seus dados ou use login social (Google/GitHub)
4. **Verificação de email**: Acesse seu email e clique no link de verificação
5. **Adicionar método de pagamento**: 
   - Cartão de crédito internacional **OU**
   - PayPal
6. **Crédito inicial**: DigitalOcean frequentemente oferece $200 de crédito para novos usuários (válido por 60 dias)

### 1.2 Criar Conta no GitHub (se ainda não tiver)

**Tempo estimado**: 3 minutos

1. Acesse https://github.com
2. Clique em **Sign up**
3. Preencha email, senha e username
4. Verifique seu email
5. **Importante**: Anote seu username do GitHub

### 1.3 Criar Conta no Google Cloud Console

**Tempo estimado**: 3 minutos

1. Acesse https://console.cloud.google.com
2. Faça login com sua conta Google
3. Aceite os termos de serviço
4. (Não é necessário adicionar método de pagamento para OAuth)

### 1.4 Criar Conta no Stripe

**Tempo estimado**: 10 minutos

1. Acesse https://stripe.com
2. Clique em **Start now** ou **Sign up**
3. Preencha seus dados pessoais
4. **Verificação de identidade**: Stripe pode solicitar documentos (CPF, RG, comprovante de endereço)
5. **Modo Test**: Você pode começar em modo test e ativar produção depois
6. Anote se está em **Test Mode** ou **Live Mode**

### 1.5 Criar Conta no RapidAPI

**Tempo estimado**: 3 minutos

1. Acesse https://rapidapi.com
2. Clique em **Sign Up**
3. Use login social (Google/GitHub) ou email
4. Verifique seu email
5. Complete seu perfil

---

## 📦 Parte 2: Configuração do Repositório GitHub

**Tempo estimado**: 10 minutos

### 2.1 Fork ou Clone do Repositório

**Opção A: Se você já tem o código localmente**

1. Acesse https://github.com
2. Clique no ícone **+** no canto superior direito → **New repository**
3. Preencha:
   - **Repository name**: `arqrender` (ou nome de sua preferência)
   - **Description**: `Aplicação de renderização arquitetônica com IA`
   - **Visibility**: Private (recomendado) ou Public
4. **NÃO** marque "Initialize this repository with a README"
5. Clique em **Create repository**

6. No seu terminal/Git Bash local:
```bash
cd /caminho/para/arch-render-app
git remote add origin https://github.com/SEU_USERNAME/arqrender.git
git branch -M main
git push -u origin main
```

**Opção B: Se você vai clonar o repositório existente**

1. Acesse https://github.com/israelisd1/arch-render-app
2. Clique em **Fork** no canto superior direito
3. Selecione sua conta
4. Aguarde o fork ser criado

### 2.2 Verificar Estrutura do Repositório

Certifique-se de que seu repositório contém:

```
arqrender/
├── client/           # Frontend (React + Vite)
├── server/           # Backend (Express + tRPC)
├── drizzle/          # Schema do banco de dados
├── package.json      # Dependências
├── tsconfig.json     # Configuração TypeScript
└── README.md         # Documentação
```

### 2.3 Anotar Informações

Anote no seu documento de credenciais:
- **Repository URL**: `https://github.com/SEU_USERNAME/arqrender`
- **Branch**: `main` (ou `master`)

---

## 🔐 Parte 3: Configuração do Google OAuth

**Tempo estimado**: 15 minutos

O Google OAuth permite que usuários façam login usando suas contas Google.

### 3.1 Criar Projeto no Google Cloud Console

1. Acesse https://console.cloud.google.com
2. No topo da página, clique no seletor de projetos
3. Clique em **NEW PROJECT**
4. Preencha:
   - **Project name**: `Arqrender`
   - **Organization**: (deixe como está)
5. Clique em **CREATE**
6. Aguarde o projeto ser criado (15-30 segundos)
7. **Selecione o projeto** no seletor de projetos

### 3.2 Configurar Tela de Consentimento OAuth

1. No menu lateral, vá em **APIs & Services** → **OAuth consent screen**
2. Selecione **External** (para permitir qualquer usuário Google fazer login)
3. Clique em **CREATE**

4. **Preencha a tela de consentimento**:
   - **App name**: `Arqrender`
   - **User support email**: seu-email@gmail.com
   - **App logo**: (opcional, pode adicionar depois)
   - **App domain** → **Application home page**: `https://arqrender.com` (ou seu domínio)
   - **Authorized domains**: `digitaloceanapp.com` (adicione aqui)
   - **Developer contact information**: seu-email@gmail.com
5. Clique em **SAVE AND CONTINUE**

6. **Scopes** (Escopos):
   - Clique em **ADD OR REMOVE SCOPES**
   - Selecione:
     - `userinfo.email`
     - `userinfo.profile`
     - `openid`
   - Clique em **UPDATE**
   - Clique em **SAVE AND CONTINUE**

7. **Test users** (opcional em External):
   - Clique em **SAVE AND CONTINUE**

8. **Summary**:
   - Revise as informações
   - Clique em **BACK TO DASHBOARD**

### 3.3 Criar Credenciais OAuth

1. No menu lateral, vá em **APIs & Services** → **Credentials**
2. Clique em **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Selecione **Application type**: **Web application**
4. Preencha:
   - **Name**: `Arqrender Web Client`
   
5. **Authorized JavaScript origins**:
   - Clique em **+ ADD URI**
   - Adicione: `https://arqrender-xxxxx.ondigitalocean.app` (você vai atualizar isso depois com a URL real do App Platform)
   - Adicione: `http://localhost:3000` (para testes locais)

6. **Authorized redirect URIs**:
   - Clique em **+ ADD URI**
   - Adicione: `https://arqrender-xxxxx.ondigitalocean.app/api/auth/callback/google`
   - Adicione: `http://localhost:3000/api/auth/callback/google`

7. Clique em **CREATE**

8. **Copie as credenciais**:
   - Uma janela popup aparecerá com:
     - **Client ID**: `123456789-xxxxxxxxxxxxxxxx.apps.googleusercontent.com`
     - **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxx`
   - **IMPORTANTE**: Anote essas credenciais no seu documento!

### 3.4 Anotar Informações

```
GOOGLE OAUTH:
- Client ID: 123456789-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
- Client Secret: GOCSPX-xxxxxxxxxxxxxxxxxxxxx
```

⚠️ **IMPORTANTE**: Você precisará atualizar as URLs autorizadas depois que o App Platform gerar a URL do seu app.

---

## 💳 Parte 4: Configuração do Stripe

**Tempo estimado**: 20 minutos

O Stripe processa os pagamentos de tokens na aplicação.

### 4.1 Ativar Modo Test (se ainda não estiver)

1. Acesse https://dashboard.stripe.com
2. No canto superior direito, verifique se está em **Test mode** (toggle deve estar ativado)
3. **Recomendação**: Configure tudo em Test mode primeiro, depois ative Live mode

### 4.2 Obter API Keys

1. No menu lateral, vá em **Developers** → **API keys**
2. Você verá duas chaves:
   - **Publishable key**: `pk_test_xxxxxxxxxxxxxxxxxxxxx`
   - **Secret key**: Clique em **Reveal test key** → `sk_test_xxxxxxxxxxxxxxxxxxxxx`
3. **Anote ambas as chaves** no seu documento

### 4.3 Criar Produtos (Tokens)

O Arqrender vende tokens em 3 pacotes: 1, 10 e 50 tokens.

#### 4.3.1 Criar Produto: 1 Token

1. No menu lateral, vá em **Product catalog** → **Products**
2. Clique em **+ Add product**
3. Preencha:
   - **Name**: `1 Token`
   - **Description**: `Crédito para 1 renderização arquitetônica`
   - **Image**: (opcional)
4. Em **Pricing**:
   - **Pricing model**: **Standard pricing**
   - **Price**: `5.00` BRL (ou valor desejado)
   - **Billing period**: **One time**
5. Clique em **Save product**
6. **Anote o Product ID**: `prod_xxxxxxxxxxxxx` (aparece na URL ou na lista)
7. **Anote o Price ID**: `price_xxxxxxxxxxxxx` (clique no produto para ver)

#### 4.3.2 Criar Produto: 10 Tokens

Repita o processo acima com:
- **Name**: `10 Tokens`
- **Description**: `Crédito para 10 renderizações arquitetônicas`
- **Price**: `40.00` BRL (20% de desconto)
- Anote Product ID e Price ID

#### 4.3.3 Criar Produto: 50 Tokens

Repita o processo acima com:
- **Name**: `50 Tokens`
- **Description**: `Crédito para 50 renderizações arquitetônicas`
- **Price**: `150.00` BRL (40% de desconto)
- Anote Product ID e Price ID

### 4.4 Configurar Webhook

Webhooks permitem que o Stripe notifique sua aplicação quando um pagamento é concluído.

1. No menu lateral, vá em **Developers** → **Webhooks**
2. Clique em **+ Add endpoint**
3. **Endpoint URL**: `https://arqrender-xxxxx.ondigitalocean.app/api/stripe/webhook`
   - ⚠️ Você vai atualizar isso depois com a URL real do App Platform
4. **Description**: `Arqrender Payment Webhook`
5. **Events to send**:
   - Clique em **Select events**
   - Procure e selecione:
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Clique em **Add events**
6. Clique em **Add endpoint**
7. **Copie o Signing secret**: `whsec_xxxxxxxxxxxxxxxxxxxxx`
8. **Anote no seu documento**

### 4.5 Anotar Informações

```
STRIPE (Test Mode):
- Publishable Key: pk_test_xxxxxxxxxxxxxxxxxxxxx
- Secret Key: sk_test_xxxxxxxxxxxxxxxxxxxxx
- Webhook Secret: whsec_xxxxxxxxxxxxxxxxxxxxx
- Price ID (1 token): price_xxxxxxxxxxxxx
- Price ID (10 tokens): price_xxxxxxxxxxxxx
- Price ID (50 tokens): price_xxxxxxxxxxxxx
```

⚠️ **IMPORTANTE**: Quando for para produção, repita esses passos em **Live mode** e atualize as variáveis de ambiente.

---

## 🤖 Parte 5: Configuração do RapidAPI

**Tempo estimado**: 10 minutos

O RapidAPI fornece acesso à API de renderização arquitetônica com IA.

### 5.1 Encontrar a API de Renderização

1. Acesse https://rapidapi.com
2. Faça login
3. Na barra de busca, procure por: **"architecture rendering"** ou **"MyArchitectAI"**
4. Selecione a API **Architecture Rendering API** (ou similar)

### 5.2 Assinar a API

1. Na página da API, clique na aba **Pricing**
2. Escolha um plano:
   - **Basic** (gratuito): 10-50 requests/mês
   - **Pro** ($X/mês): XXX requests/mês
   - **Ultra** ($X/mês): Ilimitado
3. Clique em **Subscribe**
4. Confirme a assinatura

### 5.3 Obter API Key

1. Após assinar, vá para a aba **Endpoints**
2. No lado direito, você verá um código de exemplo
3. Procure por `X-RapidAPI-Key` no header do exemplo
4. **Copie a API Key**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
5. **Anote no seu documento**

### 5.4 Testar a API (Opcional)

1. Na aba **Endpoints**, selecione o endpoint `/render`
2. Preencha os parâmetros de teste (se disponível)
3. Clique em **Test Endpoint**
4. Verifique se retorna sucesso (status 200)

### 5.5 Anotar Informações

```
RAPIDAPI:
- API Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
- API URL: https://architecture-rendering-api.p.rapidapi.com (ou similar)
- Plano: Basic/Pro/Ultra
```

---

## 📦 Parte 6: Configuração do DigitalOcean Spaces (S3)

**Tempo estimado**: 10 minutos

O Spaces é o serviço de armazenamento de objetos da DigitalOcean (compatível com S3) onde ficarão armazenadas as imagens.

### 6.1 Criar um Space

1. Acesse https://cloud.digitalocean.com
2. No menu lateral, clique em **Spaces Object Storage**
3. Clique em **Create a Space**
4. Preencha:
   - **Choose a datacenter region**: 
     - **Recomendado**: `NYC3` (New York) ou `SFO3` (San Francisco)
     - Se quiser menor latência para Brasil: `NYC3`
   - **Enable CDN**: ✅ **Marque esta opção** (importante para performance)
   - **Choose a unique name**: `arqrender-images` (ou nome de sua preferência)
     - ⚠️ O nome deve ser único globalmente
     - Use apenas letras minúsculas, números e hífens
   - **Select a project**: Default (ou crie um projeto específico)
5. Clique em **Create a Space**

### 6.2 Configurar Permissões (CORS)

1. Dentro do Space criado, clique na aba **Settings**
2. Role até **CORS Configurations**
3. Clique em **Add**
4. Preencha:
   - **Allowed Origins**: `*` (ou `https://arqrender-xxxxx.ondigitalocean.app` para mais segurança)
   - **Allowed Methods**: Marque `GET`, `PUT`, `POST`, `DELETE`, `HEAD`
   - **Allowed Headers**: `*`
   - **Access-Control-Max-Age**: `3600`
5. Clique em **Save**

### 6.3 Criar Access Keys (Credenciais)

1. No menu lateral, clique em **API** (ou **Account** → **API**)
2. Role até a seção **Spaces access keys**
3. Clique em **Generate New Key**
4. Preencha:
   - **Name**: `Arqrender App`
5. Clique em **Generate Key**
6. **IMPORTANTE**: Uma janela aparecerá com:
   - **Access Key**: `DO00XXXXXXXXXXXXX`
   - **Secret Key**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ **Copie AGORA** - o Secret Key não será mostrado novamente!
7. **Anote ambas as chaves** no seu documento

### 6.4 Anotar Informações do Space

Volte ao seu Space e anote:

```
DIGITALOCEAN SPACES:
- Space Name: arqrender-images
- Region: nyc3 (ou a região escolhida)
- Endpoint: https://nyc3.digitaloceanspaces.com
- CDN Endpoint: https://arqrender-images.nyc3.cdn.digitaloceanspaces.com
- Access Key: DO00XXXXXXXXXXXXX
- Secret Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Como encontrar os endpoints**:
- **Endpoint**: `https://{region}.digitaloceanspaces.com`
- **CDN Endpoint**: Visível na página do Space, seção "Endpoint"

---

## 🗄️ Parte 7: Configuração do Banco de Dados PostgreSQL

**Tempo estimado**: 10 minutos

O App Platform pode usar um **Managed Database** da DigitalOcean para PostgreSQL.

### 7.1 Criar Managed Database

1. Acesse https://cloud.digitalocean.com
2. No menu lateral, clique em **Databases**
3. Clique em **Create Database Cluster**
4. Preencha:
   
   **Database Engine**:
   - Selecione **PostgreSQL**
   - Versão: **16** (ou a mais recente estável)
   
   **Choose a cluster configuration**:
   - **Basic**: Para começar (mais barato)
     - 1 node, 1 GB RAM, 10 GB disk
     - **Custo**: $15/mês (~R$75)
   - **Production**: Para produção (recomendado depois)
     - 2 nodes, standby, backups automáticos
   
   **Choose a datacenter region**:
   - **Recomendado**: Mesma região do App Platform
   - Sugestão: `NYC3` (New York)
   
   **Finalize Details**:
   - **Database cluster name**: `arqrender-db`
   - **Select a project**: Default (ou crie um específico)

5. Clique em **Create a Database Cluster**
6. Aguarde 3-5 minutos para o cluster ser provisionado

### 7.2 Configurar Trusted Sources

Por padrão, o banco só aceita conexões de IPs autorizados.

1. Dentro do database cluster, vá para a aba **Settings**
2. Role até **Trusted Sources**
3. Clique em **Edit**
4. **Adicione**:
   - **App Platform**: Selecione "All App Platform apps" (recomendado)
   - Ou adicione o app específico depois de criá-lo
5. Clique em **Save**

### 7.3 Criar Database e Usuário

1. Na aba **Users & Databases**, você verá:
   - **Default user**: `doadmin` (já criado)
   - **Default database**: `defaultdb` (já criado)

2. **Criar database específico** (recomendado):
   - Na seção **Databases**, clique em **Add new database**
   - **Database name**: `arqrender`
   - Clique em **Save**

3. **Criar usuário específico** (opcional, para mais segurança):
   - Na seção **Users**, clique em **Add new user**
   - **Username**: `arqrender_user`
   - Clique em **Save**
   - **Anote a senha gerada** (aparece uma única vez)

### 7.4 Obter Connection String

1. Na aba **Overview** do database cluster
2. Na seção **Connection Details**, você verá:
   - **Host**: `arqrender-db-do-user-XXXXX-0.x.db.ondigitalocean.com`
   - **Port**: `25060`
   - **User**: `doadmin` (ou `arqrender_user`)
   - **Password**: `xxxxxxxxxx`
   - **Database**: `arqrender`
   - **SSL Mode**: `require`

3. **Connection String** (formato completo):
   ```
   postgresql://doadmin:PASSWORD@arqrender-db-do-user-XXXXX-0.x.db.ondigitalocean.com:25060/arqrender?sslmode=require
   ```

4. **Copie a Connection String** (clique no ícone de copiar)

### 7.5 Anotar Informações

```
DIGITALOCEAN DATABASE:
- Cluster Name: arqrender-db
- Engine: PostgreSQL 16
- Host: arqrender-db-do-user-XXXXX-0.x.db.ondigitalocean.com
- Port: 25060
- Database: arqrender
- User: doadmin
- Password: xxxxxxxxxx
- Connection String: postgresql://doadmin:PASSWORD@HOST:25060/arqrender?sslmode=require
```

---

## 🚀 Parte 8: Deploy no App Platform

**Tempo estimado**: 15 minutos

Agora vamos fazer o deploy da aplicação no App Platform.

### 8.1 Criar App no App Platform

1. Acesse https://cloud.digitalocean.com/apps
2. Clique em **Create App**

### 8.2 Escolher Source (GitHub)

1. **Choose Source**:
   - Selecione **GitHub**
   - Clique em **Manage Access** (se for a primeira vez)
   - Autorize o DigitalOcean a acessar seus repositórios GitHub
   - Selecione **Only select repositories** → escolha `arqrender`
   - Clique em **Install & Authorize**

2. **Select Repository**:
   - **Repository**: `seu-username/arqrender`
   - **Branch**: `main` (ou `master`)
   - **Source Directory**: `/` (raiz)
   - **Autodeploy**: ✅ Marque (para deploy automático a cada push)

3. Clique em **Next**

### 8.3 Configurar Resources (Componentes)

O App Platform detectará automaticamente o tipo de aplicação.

1. **Web Service** (deve ser detectado automaticamente):
   - **Name**: `arqrender-web`
   - **Environment Variables**: (vamos configurar depois)
   - **Build Command**: `pnpm install && pnpm build`
   - **Run Command**: `pnpm start`
   - **HTTP Port**: `3000`
   - **HTTP Routes**: `/`
   - **Instance Size**: 
     - **Basic**: $12/mês (512 MB RAM, 1 vCPU) - Para começar
     - **Professional**: $24/mês (1 GB RAM, 1 vCPU) - Recomendado para produção
   - **Instance Count**: `1` (pode escalar depois)

2. **Adicionar Database** (se ainda não adicionou):
   - Clique em **Add Resource**
   - Selecione **Database**
   - Escolha **Previously Created DigitalOcean Database**
   - Selecione `arqrender-db`
   - Clique em **Attach Database**

3. Clique em **Next**

### 8.4 Configurar Environment Variables (Básico)

Por enquanto, vamos adicionar apenas as variáveis essenciais. Vamos adicionar o restante depois.

1. Na seção **Environment Variables**, clique em **Edit**
2. Adicione as seguintes variáveis (clique em **Add Variable** para cada uma):

```bash
# App
NODE_ENV=production
PORT=3000

# Database (será preenchida automaticamente pelo App Platform)
DATABASE_URL=${arqrender-db.DATABASE_URL}

# Placeholder (vamos preencher depois)
NEXTAUTH_SECRET=TEMPORARY_SECRET_CHANGE_LATER
NEXTAUTH_URL=https://CHANGE_AFTER_DEPLOY
```

3. Clique em **Save**
4. Clique em **Next**

### 8.5 Configurar App Info

1. **App name**: `arqrender`
2. **Project**: Default (ou crie um específico)
3. **Region**: `NYC` (ou mesma região do database)
4. Clique em **Next**

### 8.6 Review e Deploy

1. Revise todas as configurações:
   - **Resources**: 1 Web Service + 1 Database
   - **Estimated cost**: ~$27/mês (App $12 + Database $15)
2. Clique em **Create Resources**

3. **Aguarde o deploy** (5-10 minutos):
   - O App Platform vai:
     - Clonar o repositório
     - Instalar dependências
     - Fazer build
     - Iniciar a aplicação
   - Você pode acompanhar o progresso na aba **Activity**

### 8.7 Obter URL do App

1. Após o deploy ser concluído, vá para a aba **Overview**
2. No topo, você verá a URL do app:
   - **Exemplo**: `https://arqrender-xxxxx.ondigitalocean.app`
3. **Anote esta URL** - você vai precisar dela para configurar OAuth e Stripe

### 8.8 Verificar Deploy Inicial

1. Acesse a URL do app no navegador
2. **Esperado neste momento**:
   - ❌ A aplicação pode não funcionar completamente ainda
   - ❌ Login não funcionará (OAuth não configurado)
   - ❌ Renderizações não funcionarão (variáveis faltando)
   - ✅ Mas a página deve carregar sem erro 500

---

## ⚙️ Parte 9: Configuração de Variáveis de Ambiente

**Tempo estimado**: 15 minutos

Agora que temos a URL do app, vamos configurar TODAS as variáveis de ambiente necessárias.

### 9.1 Atualizar Google OAuth com URL Real

Antes de configurar as variáveis, precisamos atualizar o Google OAuth:

1. Volte ao **Google Cloud Console**: https://console.cloud.google.com
2. Vá em **APIs & Services** → **Credentials**
3. Clique no **OAuth 2.0 Client ID** que você criou
4. Em **Authorized JavaScript origins**:
   - Remova `https://arqrender-xxxxx.ondigitalocean.app` (placeholder)
   - Adicione a URL real: `https://arqrender-abcde.ondigitalocean.app` (substitua pela sua URL)
5. Em **Authorized redirect URIs**:
   - Remova o placeholder
   - Adicione: `https://arqrender-abcde.ondigitalocean.app/api/auth/callback/google`
6. Clique em **Save**

### 9.2 Atualizar Stripe Webhook com URL Real

1. Volte ao **Stripe Dashboard**: https://dashboard.stripe.com
2. Vá em **Developers** → **Webhooks**
3. Clique no webhook que você criou
4. Clique em **...** (três pontos) → **Update details**
5. Atualize **Endpoint URL**: `https://arqrender-abcde.ondigitalocean.app/api/stripe/webhook`
6. Clique em **Update endpoint**

### 9.3 Configurar Todas as Variáveis de Ambiente no App Platform

1. Volte ao **App Platform**: https://cloud.digitalocean.com/apps
2. Clique no seu app `arqrender`
3. Vá para a aba **Settings**
4. Role até **App-Level Environment Variables**
5. Clique em **Edit**

6. **Adicione TODAS as variáveis abaixo** (clique em **Add Variable** para cada uma):

```bash
# ============================================
# APP CONFIGURATION
# ============================================
NODE_ENV=production
PORT=3000
VITE_APP_TITLE=Arqrender
VITE_APP_LOGO=/logo.png

# ============================================
# DATABASE
# ============================================
DATABASE_URL=${arqrender-db.DATABASE_URL}

# ============================================
# NEXTAUTH (Autenticação)
# ============================================
# Gere um secret aleatório em: https://generate-secret.vercel.app/32
NEXTAUTH_SECRET=COLE_AQUI_UM_SECRET_ALEATORIO_DE_32_CARACTERES

# URL do seu app (substitua pela URL real)
NEXTAUTH_URL=https://arqrender-abcde.ondigitalocean.app

# ============================================
# GOOGLE OAUTH
# ============================================
GOOGLE_CLIENT_ID=123456789-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxx

# ============================================
# STRIPE
# ============================================
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# IDs dos produtos (Price IDs)
STRIPE_PRICE_1_TOKEN=price_xxxxxxxxxxxxx
STRIPE_PRICE_10_TOKENS=price_xxxxxxxxxxxxx
STRIPE_PRICE_50_TOKENS=price_xxxxxxxxxxxxx

# ============================================
# RAPIDAPI (Renderização IA)
# ============================================
RAPIDAPI_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RAPIDAPI_HOST=architecture-rendering-api.p.rapidapi.com

# ============================================
# DIGITALOCEAN SPACES (S3)
# ============================================
SPACES_REGION=nyc3
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
SPACES_BUCKET=arqrender-images
SPACES_ACCESS_KEY=DO00XXXXXXXXXXXXX
SPACES_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SPACES_CDN_ENDPOINT=https://arqrender-images.nyc3.cdn.digitaloceanspaces.com

# ============================================
# SMTP (Email - Opcional)
# ============================================
# Se você quiser enviar emails de recuperação de senha
# Opção 1: Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=sua-senha-de-app-do-gmail

# Opção 2: SendGrid (recomendado para produção)
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USER=apikey
# SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxx

# Email remetente
SMTP_FROM=noreply@arqrender.com
```

7. **Marque como "Encrypt"** as seguintes variáveis (clique no checkbox **Encrypt**):
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_SECRET`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `RAPIDAPI_KEY`
   - `SPACES_SECRET_KEY`
   - `SMTP_PASSWORD`

8. Clique em **Save**

### 9.4 Gerar NEXTAUTH_SECRET

O `NEXTAUTH_SECRET` deve ser uma string aleatória de 32 caracteres.

**Opção 1: Gerar online**
1. Acesse https://generate-secret.vercel.app/32
2. Copie o secret gerado
3. Cole na variável `NEXTAUTH_SECRET`

**Opção 2: Gerar no terminal**
```bash
openssl rand -base64 32
```

### 9.5 Fazer Redeploy

Após adicionar as variáveis:

1. O App Platform perguntará se deseja fazer redeploy
2. Clique em **Deploy** ou vá para a aba **Deployments** → **Deploy**
3. Aguarde o novo deploy (3-5 minutos)

---

## 🌐 Parte 10: Configuração de Domínio Customizado

**Tempo estimado**: 15 minutos (+ tempo de propagação DNS)

Se você quiser usar um domínio próprio (ex: `arqrender.com`) em vez da URL do DigitalOcean (`arqrender-xxxxx.ondigitalocean.app`):

### 10.1 Registrar Domínio (se ainda não tiver)

**Opções de registradores**:

| Registrador | Custo/ano | Link |
|-------------|-----------|------|
| **Registro.br** (.com.br) | ~R$40 | https://registro.br |
| **Namecheap** (.com) | ~$10 | https://www.namecheap.com |
| **Cloudflare** (.com) | ~$10 | https://www.cloudflare.com/products/registrar/ |

1. Escolha um registrador
2. Procure pelo domínio desejado (ex: `arqrender.com`)
3. Complete a compra
4. Aguarde confirmação (pode levar algumas horas)

### 10.2 Adicionar Domínio no App Platform

1. No **App Platform**, vá para o seu app
2. Clique na aba **Settings**
3. Role até **Domains**
4. Clique em **Add Domain**
5. Digite seu domínio: `arqrender.com`
6. Clique em **Add Domain**

7. O App Platform mostrará instruções de DNS:
   - **Tipo**: `CNAME`
   - **Nome**: `@` ou `arqrender.com`
   - **Valor**: `arqrender-xxxxx.ondigitalocean.app`
   - **TTL**: `3600`

### 10.3 Configurar DNS no Registrador

#### Opção A: Usar Nameservers da DigitalOcean (Recomendado)

1. No **DigitalOcean**, vá para **Networking** → **Domains**
2. Clique em **Add Domain**
3. Digite `arqrender.com` e clique em **Add Domain**
4. A DigitalOcean mostrará os nameservers:
   ```
   ns1.digitalocean.com
   ns2.digitalocean.com
   ns3.digitalocean.com
   ```

5. **No seu registrador** (Registro.br, Namecheap, etc.):
   - Vá para as configurações de DNS/Nameservers
   - Substitua os nameservers padrão pelos da DigitalOcean
   - Salve

6. **De volta à DigitalOcean** (Networking → Domains → seu domínio):
   - Clique em **Add Record**
   - **Type**: `CNAME`
   - **Hostname**: `@`
   - **Will Direct To**: `arqrender-xxxxx.ondigitalocean.app.`
   - **TTL**: `3600`
   - Clique em **Create Record**

7. **Adicionar www** (opcional):
   - Clique em **Add Record**
   - **Type**: `CNAME`
   - **Hostname**: `www`
   - **Will Direct To**: `arqrender.com.`
   - Clique em **Create Record**

#### Opção B: Configurar DNS no Registrador Diretamente

Se preferir manter o DNS no registrador:

1. Acesse o painel do seu registrador
2. Vá para configurações de DNS
3. Adicione um registro **CNAME**:
   - **Nome/Host**: `@` ou deixe em branco
   - **Tipo**: `CNAME`
   - **Valor/Target**: `arqrender-xxxxx.ondigitalocean.app`
   - **TTL**: `3600` (1 hora)
4. Adicione **www** (opcional):
   - **Nome/Host**: `www`
   - **Tipo**: `CNAME`
   - **Valor**: `arqrender.com`
5. Salve as alterações

### 10.4 Aguardar Propagação DNS

- **Tempo**: 5 minutos a 48 horas (geralmente 1-2 horas)
- **Verificar propagação**: https://dnschecker.org

### 10.5 Verificar SSL/HTTPS

1. Após a propagação, o App Platform automaticamente:
   - Provisiona certificado SSL (Let's Encrypt)
   - Configura HTTPS
   - Redireciona HTTP → HTTPS

2. Acesse `https://arqrender.com` e verifique o cadeado verde

### 10.6 Atualizar URLs nos Serviços

Agora que você tem domínio próprio, atualize:

#### Google OAuth:
1. Google Cloud Console → Credentials
2. Adicione:
   - **Authorized JavaScript origins**: `https://arqrender.com`
   - **Authorized redirect URIs**: `https://arqrender.com/api/auth/callback/google`

#### Stripe Webhook:
1. Stripe Dashboard → Webhooks
2. Atualize endpoint: `https://arqrender.com/api/stripe/webhook`

#### Variáveis de Ambiente:
1. App Platform → Settings → Environment Variables
2. Atualize `NEXTAUTH_URL=https://arqrender.com`
3. Faça redeploy

---

## ✅ Parte 11: Testes Finais

**Tempo estimado**: 15 minutos

Agora vamos testar se tudo está funcionando corretamente.

### 11.1 Checklist de Testes

#### ✅ 1. Acesso à Aplicação
- [ ] Acesse a URL do app (ou domínio customizado)
- [ ] A página inicial carrega sem erros
- [ ] O logo e título "Arqrender" aparecem corretamente

#### ✅ 2. Autenticação
- [ ] Clique em "Fazer Login" ou "Sign In"
- [ ] Botão "Login com Google" aparece
- [ ] Clique em "Login com Google"
- [ ] Popup do Google abre
- [ ] Faça login com sua conta Google
- [ ] Você é redirecionado de volta para o app
- [ ] Seu nome e email aparecem no header
- [ ] Você recebe **3 tokens gratuitos** (verifique no header)

#### ✅ 3. Cadastro com Email/Senha (se implementado)
- [ ] Clique em "Cadastrar" ou "Sign Up"
- [ ] Preencha email e senha
- [ ] Clique em "Criar Conta"
- [ ] Você é redirecionado para o app
- [ ] Você recebe 3 tokens gratuitos

#### ✅ 4. Upload e Renderização
- [ ] Clique em "Nova Renderização" ou "New Render"
- [ ] Faça upload de uma imagem (planta baixa ou esboço)
- [ ] Selecione tipo de cena: Interior ou Exterior
- [ ] Selecione formato: JPG ou PNG
- [ ] (Opcional) Adicione um prompt: "Estilo moderno, iluminação natural"
- [ ] Clique em "Iniciar Renderização"
- [ ] O saldo de tokens diminui de 3 para 2
- [ ] Status muda para "Processando"
- [ ] Aguarde 10-30 segundos
- [ ] Status muda para "Concluído"
- [ ] A imagem renderizada aparece
- [ ] Você pode fazer download da imagem

#### ✅ 5. Ajustes de Imagem
- [ ] Em uma renderização concluída, clique em "Ajustar Imagem"
- [ ] Modal abre com 4 sliders (Saturação, Brilho, Contraste, Iluminação)
- [ ] Ajuste os sliders
- [ ] Preview atualiza em tempo real
- [ ] Clique em "Aplicar Ajustes"
- [ ] Nova renderização é criada (custa 1 token)
- [ ] Saldo diminui de 2 para 1

#### ✅ 6. Compra de Tokens (Stripe)
- [ ] Clique em "Comprar Tokens" ou "Buy Tokens"
- [ ] 3 pacotes aparecem: 1, 10 e 50 tokens
- [ ] Clique em um pacote (ex: 10 tokens)
- [ ] Você é redirecionado para o Stripe Checkout
- [ ] **Se em Test Mode**: Use cartão de teste:
   - Número: `4242 4242 4242 4242`
   - Data: Qualquer data futura
   - CVC: Qualquer 3 dígitos
   - CEP: Qualquer CEP
- [ ] Complete o pagamento
- [ ] Você é redirecionado de volta para o app
- [ ] Mensagem de sucesso aparece
- [ ] Saldo de tokens aumenta (ex: de 1 para 11)

#### ✅ 7. Histórico
- [ ] Clique em "Histórico" ou "History"
- [ ] Todas as renderizações aparecem
- [ ] Você pode ver detalhes de cada renderização
- [ ] Você pode fazer download de imagens concluídas
- [ ] Você pode ajustar imagens concluídas

#### ✅ 8. Responsividade
- [ ] Abra o app no celular (ou use DevTools → Mobile view)
- [ ] A interface se adapta ao tamanho da tela
- [ ] Todos os botões são clicáveis
- [ ] Imagens se ajustam ao tamanho da tela

### 11.2 Testes de Integração

#### ✅ 9. Banco de Dados
- [ ] Acesse o DigitalOcean Database
- [ ] Vá para a aba **Users & Databases**
- [ ] Clique em **Connect**
- [ ] Use um cliente PostgreSQL (DBeaver, pgAdmin, ou linha de comando)
- [ ] Conecte ao banco
- [ ] Execute: `SELECT * FROM users;`
- [ ] Seu usuário aparece na lista
- [ ] Execute: `SELECT * FROM renders;`
- [ ] Suas renderizações aparecem na lista

#### ✅ 10. Spaces (S3)
- [ ] Acesse o DigitalOcean Spaces
- [ ] Abra o Space `arqrender-images`
- [ ] Você deve ver pastas/arquivos de imagens
- [ ] Clique em uma imagem
- [ ] A imagem abre (via CDN)

#### ✅ 11. Logs e Monitoramento
- [ ] No App Platform, vá para a aba **Runtime Logs**
- [ ] Você deve ver logs da aplicação
- [ ] Procure por erros (linhas em vermelho)
- [ ] Se houver erros, anote para troubleshooting

### 11.3 Testes de Performance

#### ✅ 12. Velocidade de Carregamento
- [ ] Use Google PageSpeed Insights: https://pagespeed.web.dev/
- [ ] Cole a URL do seu app
- [ ] Clique em "Analyze"
- [ ] **Meta**: Score > 70 (mobile e desktop)

#### ✅ 13. Uptime
- [ ] Configure monitoramento (opcional):
   - UptimeRobot: https://uptimerobot.com (gratuito)
   - Pingdom: https://www.pingdom.com
- [ ] Adicione a URL do seu app
- [ ] Configure alertas por email

---

## 🔧 Manutenção e Monitoramento

### Tarefas Diárias
- [ ] Verificar logs de erro no App Platform
- [ ] Monitorar uso de tokens/créditos RapidAPI
- [ ] Verificar transações no Stripe

### Tarefas Semanais
- [ ] Revisar métricas de uso (App Platform → Insights)
- [ ] Verificar espaço usado no Spaces
- [ ] Backup manual do banco de dados (opcional)

### Tarefas Mensais
- [ ] Revisar custos no DigitalOcean
- [ ] Atualizar dependências (`pnpm update`)
- [ ] Verificar logs de segurança

### Backups Automáticos

O App Platform e Managed Database fazem backups automáticos:
- **Database**: Backups diários (retidos por 7 dias no plano Basic)
- **App**: Cada deploy é um snapshot recuperável

### Escalabilidade

Quando seu app crescer:

1. **Escalar App Platform**:
   - Settings → Resources → Edit
   - Aumentar **Instance Size** (mais RAM/CPU)
   - Aumentar **Instance Count** (mais containers)

2. **Escalar Database**:
   - Database → Settings → Resize
   - Upgrade para plano Production (standby nodes)

3. **Escalar Spaces**:
   - Spaces escala automaticamente
   - Você paga apenas pelo que usa

---

## 🆘 Troubleshooting

### Problema: App não carrega (Erro 500)

**Possíveis causas**:
1. Variáveis de ambiente faltando ou incorretas
2. Erro no código
3. Banco de dados inacessível

**Solução**:
1. Verifique logs: App Platform → Runtime Logs
2. Verifique variáveis: Settings → Environment Variables
3. Verifique conexão com banco: Settings → Resources → Database

### Problema: Login com Google não funciona

**Possíveis causas**:
1. URLs não autorizadas no Google Cloud Console
2. Client ID/Secret incorretos
3. NEXTAUTH_URL incorreta

**Solução**:
1. Verifique Google Cloud Console → Credentials
2. Certifique-se de que a URL do app está em **Authorized JavaScript origins**
3. Certifique-se de que `{URL}/api/auth/callback/google` está em **Authorized redirect URIs**
4. Verifique variáveis `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL`

### Problema: Pagamento não funciona (Stripe)

**Possíveis causas**:
1. Webhook não configurado corretamente
2. Webhook Secret incorreto
3. Stripe em Test Mode mas usando cartão real

**Solução**:
1. Verifique Stripe Dashboard → Webhooks → Events
2. Verifique se o webhook está recebendo eventos
3. Verifique variável `STRIPE_WEBHOOK_SECRET`
4. Se em Test Mode, use cartão de teste: `4242 4242 4242 4242`

### Problema: Renderização falha

**Possíveis causas**:
1. RapidAPI Key inválida ou limite excedido
2. Imagem muito grande
3. Formato de imagem não suportado

**Solução**:
1. Verifique RapidAPI Dashboard → Usage
2. Verifique se não excedeu o limite do plano
3. Verifique logs da aplicação
4. Teste com imagem menor (< 5MB)

### Problema: Imagens não aparecem

**Possíveis causas**:
1. Spaces não configurado corretamente
2. CORS não configurado
3. Credenciais do Spaces incorretas

**Solução**:
1. Verifique Spaces → Settings → CORS
2. Verifique variáveis `SPACES_*`
3. Teste acesso direto à imagem no Spaces

### Problema: Deploy falha

**Possíveis causas**:
1. Erro de build (dependências faltando)
2. Erro de sintaxe no código
3. Timeout de build

**Solução**:
1. Verifique App Platform → Activity → Build Logs
2. Procure por erros de compilação
3. Teste build localmente: `pnpm install && pnpm build`

### Problema: Database connection refused

**Possíveis causas**:
1. Trusted Sources não configurado
2. Connection String incorreta
3. Database não provisionado

**Solução**:
1. Database → Settings → Trusted Sources → Adicione "All App Platform apps"
2. Verifique variável `DATABASE_URL`
3. Verifique se o database está "Active" (não "Provisioning")

---

## 📞 Suporte

### Documentação Oficial
- **DigitalOcean App Platform**: https://docs.digitalocean.com/products/app-platform/
- **Stripe**: https://stripe.com/docs
- **NextAuth.js**: https://next-auth.js.org/
- **RapidAPI**: https://docs.rapidapi.com/

### Comunidade
- **DigitalOcean Community**: https://www.digitalocean.com/community
- **Stack Overflow**: https://stackoverflow.com (tag: digitalocean, stripe, nextauth)

### Suporte Pago
- **DigitalOcean Support**: Planos a partir de $20/mês
- **Stripe Support**: Incluído em todos os planos

---

## 🎉 Conclusão

Parabéns! Você completou a instalação do **Arqrender** usando o DigitalOcean App Platform.

### Próximos Passos Recomendados:

1. **Ativar Stripe Live Mode**:
   - Quando estiver pronto para aceitar pagamentos reais
   - Repita a configuração do Stripe em Live Mode
   - Atualize as variáveis de ambiente

2. **Configurar Email Marketing** (opcional):
   - Mailchimp, SendGrid, ou similar
   - Coletar emails de usuários
   - Enviar newsletters

3. **Adicionar Analytics** (opcional):
   - Google Analytics
   - Plausible Analytics
   - Mixpanel

4. **Configurar Monitoramento de Erros** (opcional):
   - Sentry: https://sentry.io
   - Rollbar: https://rollbar.com

5. **Otimizar SEO**:
   - Adicionar meta tags
   - Criar sitemap.xml
   - Registrar no Google Search Console

6. **Marketing**:
   - Criar landing page
   - Anunciar em redes sociais
   - Parcerias com arquitetos/designers

---

## 📊 Resumo de Custos

### Custos Fixos Mensais:

| Serviço | Custo/mês (USD) | Custo/mês (BRL) |
|---------|-----------------|-----------------|
| App Platform (Basic) | $12 | ~R$60 |
| PostgreSQL (Basic) | $15 | ~R$75 |
| Spaces (250GB) | $5 | ~R$25 |
| Domínio .com.br | ~$0.80 | ~R$4 |
| **TOTAL** | **~$33** | **~R$164** |

### Custos Variáveis:

| Serviço | Modelo de Cobrança |
|---------|-------------------|
| **Stripe** | 4.99% + R$0.49 por transação |
| **RapidAPI** | Conforme plano escolhido |
| **Spaces (excedente)** | $0.02/GB acima de 250GB |
| **Database (excedente)** | Conforme uso de disco |

### Estimativa de Receita (Exemplo):

Se você vender:
- 10 pacotes de 10 tokens (R$40 cada) = R$400
- Custo Stripe (4.99%): ~R$20
- Custo infraestrutura: ~R$164
- **Lucro líquido**: ~R$216/mês

**Break-even**: ~5 vendas de 10 tokens por mês

---

## 📝 Checklist Final

Antes de considerar a instalação completa, verifique:

- [ ] App está acessível via URL ou domínio customizado
- [ ] SSL/HTTPS está ativo (cadeado verde)
- [ ] Login com Google funciona
- [ ] Cadastro com email/senha funciona (se implementado)
- [ ] Upload de imagem funciona
- [ ] Renderização funciona (teste com imagem real)
- [ ] Ajustes de imagem funcionam
- [ ] Compra de tokens funciona (teste em Test Mode)
- [ ] Download de imagens funciona
- [ ] Histórico mostra todas as renderizações
- [ ] Interface é responsiva (mobile + desktop)
- [ ] Todas as variáveis de ambiente estão configuradas
- [ ] Banco de dados está acessível
- [ ] Spaces está armazenando imagens
- [ ] Logs não mostram erros críticos
- [ ] Monitoramento está configurado (opcional)
- [ ] Backups automáticos estão ativos

---

**Última atualização**: 26 de outubro de 2025
**Versão do guia**: 1.0
**Autor**: Equipe Arqrender

Para dúvidas ou suporte, abra uma issue no GitHub: https://github.com/israelisd1/arch-render-app/issues

