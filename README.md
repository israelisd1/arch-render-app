# 🏗️ Arqrender

Aplicação web de renderização arquitetônica com IA que transforma desenhos 2D em renderizações fotorrealistas de alta qualidade em segundos.

## ✨ Funcionalidades

### Renderização Principal
- **Upload de imagens 2D** (plantas baixas, esboços, renders básicos)
- **Renderização com IA** em 10-30 segundos
- **Tipos de cena**: Interior e Exterior
- **Formatos de saída**: JPG e PNG
- **Prompts personalizados** para controle criativo

### Sistema de Ajustes Visuais
- **4 controles de ajuste** com sliders interativos:
  - 🎨 Saturação (Cor): -50% a +50%
  - 🔆 Brilho: -50% a +50%
  - ⚖️ Contraste: -50% a +50%
  - 💡 Iluminação: -30% a +30%
- **Preview em tempo real** com CSS filters
- **Valores numéricos visíveis** ao lado de cada slider
- **Botões de controle**: Cancelar, Resetar, Aplicar Ajustes

### Sistema de Tokens
- **Sistema de créditos**: 1 token = 1 renderização
- **Pacotes de tokens** com descontos progressivos
- **Pagamento via Stripe** (cartão de crédito e Pix)
- **Sistema de cupons** de desconto
- **3 tokens gratuitos** no cadastro

### Histórico e Gerenciamento
- **Histórico completo** de renderizações
- **Status em tempo real**: Processando, Concluído, Falhou
- **Download de imagens** em alta resolução
- **Ajustes pós-renderização** com preview

### Painel Administrativo
- **Dashboard de estatísticas**
- **Gerenciamento de usuários**
- **Controle de tokens**
- **Histórico de transações**
- **Análise de receita**

### Internacionalização
- **Suporte completo** a Português (PT-BR) e Inglês (EN)
- **Troca de idioma** em tempo real
- **Todas as interfaces traduzidas**

## 🛠️ Tecnologias

### Frontend
- **React 18** com TypeScript
- **Vite** para build otimizado
- **TailwindCSS** para estilização
- **shadcn/ui** para componentes
- **Wouter** para roteamento
- **tRPC** para comunicação type-safe com backend

### Backend
- **Node.js** com Express
- **tRPC** para API type-safe
- **Drizzle ORM** para banco de dados
- **PostgreSQL** como banco de dados
- **JWT** para autenticação

### Integrações
- **RapidAPI** para renderização com IA
- **Stripe** para pagamentos
- **OAuth Manus** para autenticação
- **S3** para armazenamento de imagens

## 📦 Instalação

### Pré-requisitos
- Node.js 22.x
- PostgreSQL
- Conta RapidAPI (para renderização)
- Conta Stripe (para pagamentos)

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/archrender

# JWT
JWT_SECRET=seu_jwt_secret_aqui

# OAuth Manus
OAUTH_SERVER_URL=https://api.manus.im
OWNER_OPEN_ID=seu_owner_open_id
OWNER_NAME=seu_nome

# RapidAPI
RAPIDAPI_KEY=sua_chave_rapidapi

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Config
VITE_APP_TITLE=Arqrender
VITE_APP_LOGO=/logo.png
VITE_APP_ID=seu_app_id
```

### Instalação de Dependências

```bash
# Instalar dependências
pnpm install

# Gerar schema do banco de dados
pnpm db:push

# Iniciar servidor de desenvolvimento
pnpm dev
```

## 🚀 Deploy

O projeto está configurado para deploy na plataforma Manus:

```bash
# Criar checkpoint
pnpm build

# Publicar via interface Manus
# Clique em "Publish" no painel de gerenciamento
```

## 📁 Estrutura do Projeto

```
arch-render-app/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── contexts/      # Contextos (Language, Auth)
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── lib/           # Utilitários e configurações
│   │   └── _core/         # Core hooks e componentes
│   └── index.html
├── server/                # Backend Node.js
│   ├── routers.ts        # Rotas tRPC
│   ├── index.ts          # Servidor Express
│   └── middleware/       # Middlewares
├── drizzle/              # Schema do banco de dados
│   └── schema.ts
└── shared/               # Código compartilhado
    └── const.ts
```

## 🎨 Capturas de Tela

### Página Principal
Interface limpa e intuitiva com call-to-action destacado.

### Sistema de Ajustes
Modal com controles visuais para ajuste fino das renderizações.

### Histórico
Visualização de todas as renderizações com status em tempo real.

### Painel Admin
Dashboard completo com estatísticas e gerenciamento.

## 📝 Licença

Este projeto foi desenvolvido para uso comercial. Todos os direitos reservados.

## 🤝 Contribuição

Para reportar bugs ou solicitar funcionalidades, entre em contato através de https://help.manus.im

## 📧 Contato

- **Desenvolvedor**: Israel Dias
- **GitHub**: [@israelisd1](https://github.com/israelisd1)
- **Repositório**: [arch-render-app](https://github.com/israelisd1/arch-render-app)

---

**Desenvolvido com ❤️ usando React, TypeScript e IA**
