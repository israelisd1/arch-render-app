# 🔐 Guia de Configuração de Autenticação

Este guia explica como substituir o OAuth da Manus por um sistema de autenticação próprio com suporte a **Google**, **Apple** e **Email/Senha**.

## 📋 Opções de Autenticação

Você tem 3 opções principais:

### Opção 1: **NextAuth.js** (Recomendado)
- ✅ Mais popular e maduro
- ✅ Suporta 50+ provedores (Google, Apple, Facebook, etc.)
- ✅ Fácil configuração
- ✅ Gratuito
- ✅ Documentação excelente

### Opção 2: **Clerk**
- ✅ Interface pronta (UI completa)
- ✅ Muito fácil de usar
- ✅ Suporte a MFA, SSO
- ⚠️ Pago após 10.000 usuários ativos/mês
- 💰 Plano gratuito: 10.000 usuários

### Opção 3: **Auth0**
- ✅ Muito robusto e seguro
- ✅ Usado por grandes empresas
- ✅ Suporte a tudo
- ⚠️ Pago após 7.000 usuários ativos/mês
- 💰 Plano gratuito: 7.000 usuários

### Opção 4: **Supabase Auth**
- ✅ Gratuito até 50.000 usuários
- ✅ Backend completo (banco + auth + storage)
- ✅ Muito fácil de usar
- ⚠️ Requer migração de banco de dados

---

## 🎯 Recomendação: NextAuth.js

Vou focar no **NextAuth.js** por ser gratuito, open-source e mais flexível.

---

## 🚀 Parte 1: Configurar Provedores OAuth

### 1.1 Google OAuth

#### Criar Projeto no Google Cloud

1. Acesse: https://console.cloud.google.com
2. Crie um novo projeto: **"Architecture Render App"**
3. Vá em **"APIs & Services"** → **"Credentials"**
4. Clique em **"Create Credentials"** → **"OAuth 2.0 Client ID"**

**Configurar OAuth Consent Screen**:
- User Type: **External**
- App name: **Architecture Rendering App**
- User support email: Seu email
- Developer contact: Seu email
- Scopes: `email`, `profile`

**Criar OAuth Client ID**:
- Application type: **Web application**
- Name: **Architecture Render Web**
- Authorized JavaScript origins:
  ```
  https://seudominio.com.br
  http://localhost:3000
  ```
- Authorized redirect URIs:
  ```
  https://seudominio.com.br/api/auth/callback/google
  http://localhost:3000/api/auth/callback/google
  ```

**Anote**:
- ✅ Client ID: `123456789-abc.apps.googleusercontent.com`
- ✅ Client Secret: `GOCSPX-abc123def456`

### 1.2 Apple Sign In

#### Criar App ID na Apple

1. Acesse: https://developer.apple.com/account
2. Vá em **"Certificates, IDs & Profiles"**
3. Clique em **"Identifiers"** → **"+"**

**Registrar App ID**:
- Select a type: **App IDs**
- Description: **Architecture Render App**
- Bundle ID: `com.seudominio.archrender`
- Capabilities: Marque **"Sign in with Apple"**

**Criar Service ID**:
1. Clique em **"Identifiers"** → **"+"**
2. Select a type: **Services IDs**
3. Description: **Architecture Render Web**
4. Identifier: `com.seudominio.archrender.web`
5. Marque **"Sign in with Apple"**
6. Configure:
   - Domains: `seudominio.com.br`
   - Return URLs: `https://seudominio.com.br/api/auth/callback/apple`

**Criar Key**:
1. Vá em **"Keys"** → **"+"**
2. Key Name: **Architecture Render Auth Key**
3. Marque **"Sign in with Apple"**
4. Configure: Selecione o App ID criado
5. **Baixe o arquivo .p8** (só pode baixar uma vez!)

**Anote**:
- ✅ Service ID: `com.seudominio.archrender.web`
- ✅ Team ID: `ABC123DEF4` (no canto superior direito)
- ✅ Key ID: `XYZ987WVU6`
- ✅ Arquivo .p8 salvo

---

## 🔧 Parte 2: Implementar NextAuth.js

### 2.1 Instalar Dependências

```bash
cd /home/ubuntu/arch-render-app
pnpm add next-auth @auth/core bcryptjs
pnpm add -D @types/bcryptjs
```

### 2.2 Criar Schema de Usuários

Edite `drizzle/schema.ts`:

```typescript
import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

// Tabela de usuários
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  password: text("password"), // Para login com email/senha
  provider: text("provider"), // 'google', 'apple', 'email'
  providerId: text("provider_id"), // ID do provedor OAuth
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de sessões
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sessionToken: text("session_token").notNull().unique(),
  expires: timestamp("expires").notNull(),
});

// Tabela de contas OAuth
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'oauth', 'email'
  provider: text("provider").notNull(), // 'google', 'apple'
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
});

// Tabela de tokens de verificação
export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
});
```

### 2.3 Aplicar Migrations

```bash
pnpm db:push
```

### 2.4 Criar Arquivo de Configuração NextAuth

Crie `server/auth.ts`:

```typescript
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import bcrypt from "bcryptjs";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const authOptions = {
  adapter: DrizzleAdapter(db),
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    // Apple Sign In
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: {
        appleId: process.env.APPLE_CLIENT_ID!,
        teamId: process.env.APPLE_TEAM_ID!,
        privateKey: process.env.APPLE_PRIVATE_KEY!,
        keyId: process.env.APPLE_KEY_ID!,
      },
    }),
    
    // Email/Senha
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        if (!user[0] || !user[0].password) {
          throw new Error("Credenciais inválidas");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user[0].password
        );

        if (!isValid) {
          throw new Error("Credenciais inválidas");
        }

        return {
          id: user[0].id.toString(),
          email: user[0].email,
          name: user[0].name,
          image: user[0].image,
        };
      },
    }),
  ],
  
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
      }
      return session;
    },
  },
  
  session: {
    strategy: "jwt",
  },
};

export const handler = NextAuth(authOptions);
```

### 2.5 Criar Rotas de Autenticação

Crie `server/routes/auth.ts`:

```typescript
import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const authRouter = router({
  // Registrar novo usuário
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ input }) => {
      // Verificar se email já existe
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new Error("Email já cadastrado");
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Criar usuário
      const [newUser] = await db
        .insert(users)
        .values({
          name: input.name,
          email: input.email,
          password: hashedPassword,
          provider: "email",
        })
        .returning();

      // Criar saldo inicial de tokens (3 tokens gratuitos)
      await db.insert(tokens).values({
        userId: newUser.id,
        amount: 3,
      });

      return {
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      };
    }),

  // Solicitar reset de senha
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!user[0]) {
        // Não revelar se email existe ou não (segurança)
        return { success: true };
      }

      // TODO: Gerar token e enviar email
      // Implementar com nodemailer ou SendGrid

      return { success: true };
    }),
});
```

### 2.6 Atualizar Variáveis de Ambiente

Adicione ao `.env`:

```env
# NextAuth
NEXTAUTH_URL=https://seudominio.com.br
NEXTAUTH_SECRET=gere_uma_string_aleatoria_segura_aqui

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456

# Apple Sign In
APPLE_CLIENT_ID=com.seudominio.archrender.web
APPLE_TEAM_ID=ABC123DEF4
APPLE_KEY_ID=XYZ987WVU6
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
-----END PRIVATE KEY-----"
```

**Gerar NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

---

## 🎨 Parte 3: Criar Interface de Login

### 3.1 Criar Página de Login

Crie `client/src/pages/LoginPage.tsx`:

```typescript
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";

export default function LoginPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/",
    });
    
    setIsLoading(false);
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/" });
  };

  const handleAppleLogin = () => {
    signIn("apple", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-8 text-amber-900">
          {t("login.title")}
        </h1>

        {/* Login com Google */}
        <Button
          onClick={handleGoogleLogin}
          variant="outline"
          className="w-full mb-3 border-2"
        >
          <img src="/google-icon.svg" className="w-5 h-5 mr-2" />
          {t("login.continueWithGoogle")}
        </Button>

        {/* Login com Apple */}
        <Button
          onClick={handleAppleLogin}
          variant="outline"
          className="w-full mb-6 border-2"
        >
          <img src="/apple-icon.svg" className="w-5 h-5 mr-2" />
          {t("login.continueWithApple")}
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">
              {t("login.orContinueWith")}
            </span>
          </div>
        </div>

        {/* Login com Email/Senha */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <Label htmlFor="email">{t("login.email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">{t("login.password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600"
            disabled={isLoading}
          >
            {isLoading ? t("login.loading") : t("login.signIn")}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <a href="/forgot-password" className="text-amber-600 hover:underline">
            {t("login.forgotPassword")}
          </a>
        </div>

        <div className="mt-4 text-center text-sm">
          {t("login.noAccount")}{" "}
          <a href="/register" className="text-amber-600 hover:underline font-semibold">
            {t("login.signUp")}
          </a>
        </div>
      </div>
    </div>
  );
}
```

### 3.2 Adicionar Traduções

Adicione ao `LanguageContext.tsx`:

```typescript
// PT-BR
"login.title": "Entrar",
"login.continueWithGoogle": "Continuar com Google",
"login.continueWithApple": "Continuar com Apple",
"login.orContinueWith": "ou continue com",
"login.email": "Email",
"login.password": "Senha",
"login.signIn": "Entrar",
"login.loading": "Entrando...",
"login.forgotPassword": "Esqueceu a senha?",
"login.noAccount": "Não tem uma conta?",
"login.signUp": "Cadastre-se",

// EN
"login.title": "Sign In",
"login.continueWithGoogle": "Continue with Google",
"login.continueWithApple": "Continue with Apple",
"login.orContinueWith": "or continue with",
"login.email": "Email",
"login.password": "Password",
"login.signIn": "Sign In",
"login.loading": "Signing in...",
"login.forgotPassword": "Forgot password?",
"login.noAccount": "Don't have an account?",
"login.signUp": "Sign up",
```

---

## 📊 Comparação de Custos

| Solução | Gratuito até | Custo após | Recursos |
|---------|--------------|------------|----------|
| **NextAuth.js** | ∞ (ilimitado) | Sempre gratuito | Básico, requer implementação |
| **Clerk** | 10.000 usuários/mês | $25/mês | UI pronta, MFA, SSO |
| **Auth0** | 7.000 usuários/mês | $35/mês | Enterprise, muito robusto |
| **Supabase** | 50.000 usuários/mês | $25/mês | Backend completo |

---

## ✅ Checklist de Implementação

- [ ] Criar projeto no Google Cloud Console
- [ ] Obter Google Client ID e Secret
- [ ] Criar App ID e Service ID na Apple Developer
- [ ] Baixar arquivo .p8 da Apple
- [ ] Instalar dependências NextAuth.js
- [ ] Atualizar schema do banco de dados
- [ ] Aplicar migrations
- [ ] Criar arquivo de configuração NextAuth
- [ ] Criar rotas de autenticação
- [ ] Atualizar variáveis de ambiente
- [ ] Criar página de login
- [ ] Criar página de registro
- [ ] Adicionar traduções
- [ ] Testar login com Google
- [ ] Testar login com Apple
- [ ] Testar login com email/senha
- [ ] Implementar recuperação de senha
- [ ] Implementar verificação de email

---

## 🆘 Troubleshooting

### Erro: "redirect_uri_mismatch" (Google)
- Verifique se a URL de callback está correta no Google Cloud Console
- Deve ser exatamente: `https://seudominio.com.br/api/auth/callback/google`

### Erro: "invalid_client" (Apple)
- Verifique se o arquivo .p8 está correto
- Confirme Team ID, Key ID e Client ID

### Erro: "Invalid credentials"
- Verifique se a senha está sendo hasheada corretamente
- Confirme que o usuário existe no banco de dados

---

## 📞 Suporte

- **NextAuth.js Docs**: https://next-auth.js.org
- **Google OAuth Setup**: https://developers.google.com/identity/protocols/oauth2
- **Apple Sign In Setup**: https://developer.apple.com/sign-in-with-apple/

---

**Pronto! Agora você tem autenticação completa com Google, Apple e Email/Senha! 🎉**

