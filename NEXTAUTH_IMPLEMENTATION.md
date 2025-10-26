# 🔐 Implementação NextAuth.js - Guia Completo

Sistema de autenticação com **Google OAuth** e **Email/Senha** (sem Apple).

## 📦 Dependências Necessárias

Adicione ao `package.json`:

```json
{
  "dependencies": {
    "next-auth": "^5.0.0-beta.25",
    "@auth/drizzle-adapter": "^1.7.2",
    "bcryptjs": "^2.4.3",
    "nodemailer": "^6.9.16"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/nodemailer": "^6.4.16"
  }
}
```

Instalar:
```bash
pnpm add next-auth@beta @auth/drizzle-adapter bcryptjs nodemailer
pnpm add -D @types/bcryptjs @types/nodemailer
```

---

## 🗄️ Atualizar Schema do Banco de Dados

Edite `drizzle/schema.ts` e adicione as tabelas de autenticação:

```typescript
import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

// ===== TABELAS EXISTENTES =====
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: text("open_id").unique(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  password: text("password"), // Para login com email/senha
  provider: text("provider").default("email"), // 'google', 'email'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isAdmin: boolean("is_admin").default(false),
});

// ===== NOVAS TABELAS NEXTAUTH =====

// Tabela de contas OAuth
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(), // 'oauth', 'email', 'credentials'
  provider: text("provider").notNull(), // 'google', 'credentials'
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

// Tabela de sessões
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expires: timestamp("expires").notNull(),
});

// Tabela de tokens de verificação
export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
});

// Tabela de tokens de reset de senha
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
  used: boolean("used").default(false),
});

// ===== MANTER TABELAS EXISTENTES =====
export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const renders = pgTable("renders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  originalImageUrl: text("original_image_url").notNull(),
  renderedImageUrl: text("rendered_image_url"),
  prompt: text("prompt"),
  sceneType: text("scene_type").notNull(), // 'interior', 'exterior'
  outputFormat: text("output_format").notNull(), // 'jpg', 'png'
  status: text("status").notNull().default("processing"), // 'processing', 'completed', 'failed'
  adjustSaturation: integer("adjust_saturation").default(0),
  adjustBrightness: integer("adjust_brightness").default(0),
  adjustContrast: integer("adjust_contrast").default(0),
  adjustLighting: integer("adjust_lighting").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // 'purchase', 'usage', 'refund'
  stripePaymentId: text("stripe_payment_id"),
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discount: integer("discount").notNull(), // Percentual de desconto
  expiresAt: timestamp("expires_at"),
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").default(0),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
```

Aplicar migrations:
```bash
pnpm db:push
```

---

## ⚙️ Configurar NextAuth

Crie `server/lib/auth.ts`:

```typescript
import NextAuth, { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "../db";
import bcrypt from "bcryptjs";
import { users, tokens } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(db),
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),

    // Email/Senha
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios");
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user || !user.password) {
          throw new Error("Credenciais inválidas");
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) {
          throw new Error("Credenciais inválidas");
        }

        return {
          id: user.id.toString(),
          email: user.email!,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // Criar saldo inicial de tokens para novos usuários
      if (account?.provider === "google" && user.id) {
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, parseInt(user.id)))
          .limit(1);

        if (existingUser) {
          const [existingTokens] = await db
            .select()
            .from(tokens)
            .where(eq(tokens.userId, existingUser.id))
            .limit(1);

          if (!existingTokens) {
            await db.insert(tokens).values({
              userId: existingUser.id,
              amount: 3, // 3 tokens gratuitos
            });
          }
        }
      }
      return true;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },

    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

---

## 🛣️ Criar Rotas de Autenticação

Crie `server/routers/auth.ts`:

```typescript
import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "../db";
import { users, tokens, passwordResetTokens } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import nodemailer from "nodemailer";

export const authRouter = router({
  // Registrar novo usuário
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
        email: z.string().email("Email inválido"),
        password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
      })
    )
    .mutation(async ({ input }) => {
      // Verificar se email já existe
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser) {
        throw new Error("Este email já está cadastrado");
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
        message: "Cadastro realizado com sucesso! Faça login para continuar.",
      };
    }),

  // Solicitar reset de senha
  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!user) {
        // Não revelar se email existe ou não (segurança)
        return {
          success: true,
          message: "Se o email existir, você receberá instruções para redefinir sua senha.",
        };
      }

      // Gerar token único
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

      // Salvar token no banco (válido por 1 hora)
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: hashedToken,
        expires: new Date(Date.now() + 3600000), // 1 hora
      });

      // Enviar email (configurar SMTP)
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

      await transporter.sendMail({
        from: process.env.SMTP_FROM || "noreply@archrender.com",
        to: user.email!,
        subject: "Redefinir senha - Arqrender",
        html: `
          <h2>Redefinir senha</h2>
          <p>Você solicitou a redefinição de senha. Clique no link abaixo:</p>
          <a href="${resetUrl}">Redefinir senha</a>
          <p>Este link expira em 1 hora.</p>
          <p>Se você não solicitou, ignore este email.</p>
        `,
      });

      return {
        success: true,
        message: "Se o email existir, você receberá instruções para redefinir sua senha.",
      };
    }),

  // Redefinir senha
  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ input }) => {
      const hashedToken = crypto.createHash("sha256").update(input.token).digest("hex");

      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, hashedToken))
        .limit(1);

      if (!resetToken || resetToken.used || resetToken.expires < new Date()) {
        throw new Error("Token inválido ou expirado");
      }

      // Atualizar senha
      const hashedPassword = await bcrypt.hash(input.newPassword, 10);
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, resetToken.userId));

      // Marcar token como usado
      await db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.id, resetToken.id));

      return {
        success: true,
        message: "Senha redefinida com sucesso!",
      };
    }),
});
```

Adicione ao `server/routers.ts`:

```typescript
import { authRouter } from "./routers/auth";

export const appRouter = router({
  // ... rotas existentes
  auth: authRouter,
});
```

---

## 🎨 Criar Páginas de Autenticação

### Página de Login

Crie `client/src/pages/LoginPage.tsx`:

```typescript
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { t } = useLanguage();
  const [, navigate] = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: t("login.error"),
          description: t("login.invalidCredentials"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("login.success"),
          description: t("login.welcomeBack"),
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        title: t("login.error"),
        description: t("login.somethingWrong"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Logo" className="h-16" />
        </div>

        <h1 className="text-3xl font-bold text-center mb-2 text-amber-900">
          {t("login.title")}
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {t("login.subtitle")}
        </p>

        {/* Login com Google */}
        <Button
          onClick={handleGoogleLogin}
          variant="outline"
          className="w-full mb-6 border-2 h-12 text-base font-medium"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {t("login.continueWithGoogle")}
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
              placeholder="seu@email.com"
              required
              className="h-12"
            />
          </div>

          <div>
            <Label htmlFor="password">{t("login.password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-12"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 h-12 text-base font-semibold"
            disabled={isLoading}
          >
            {isLoading ? t("login.loading") : t("login.signIn")}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <a
            href="/forgot-password"
            className="text-amber-600 hover:text-amber-700 hover:underline font-medium"
          >
            {t("login.forgotPassword")}
          </a>
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          {t("login.noAccount")}{" "}
          <a
            href="/register"
            className="text-amber-600 hover:text-amber-700 hover:underline font-semibold"
          >
            {t("login.signUp")}
          </a>
        </div>
      </div>
    </div>
  );
}
```

### Página de Registro

Crie `client/src/pages/RegisterPage.tsx`:

```typescript
import { useState } from "react";
import { useNavigate } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const { t } = useLanguage();
  const [, navigate] = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const registerMutation = trpc.auth.register.useMutation();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: t("register.error"),
        description: t("register.passwordsDontMatch"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await registerMutation.mutateAsync({
        name,
        email,
        password,
      });

      toast({
        title: t("register.success"),
        description: t("register.accountCreated"),
      });

      // Fazer login automático
      await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: t("register.error"),
        description: error.message || t("register.somethingWrong"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Logo" className="h-16" />
        </div>

        <h1 className="text-3xl font-bold text-center mb-2 text-amber-900">
          {t("register.title")}
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {t("register.subtitle")}
        </p>

        {/* Cadastro com Google */}
        <Button
          onClick={handleGoogleSignup}
          variant="outline"
          className="w-full mb-6 border-2 h-12 text-base font-medium"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            {/* SVG do Google */}
          </svg>
          {t("register.continueWithGoogle")}
        </Button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">
              {t("register.orRegisterWith")}
            </span>
          </div>
        </div>

        {/* Formulário de Cadastro */}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <Label htmlFor="name">{t("register.name")}</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("register.namePlaceholder")}
              required
              className="h-12"
            />
          </div>

          <div>
            <Label htmlFor="email">{t("register.email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="h-12"
            />
          </div>

          <div>
            <Label htmlFor="password">{t("register.password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="h-12"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t("register.passwordHint")}
            </p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">
              {t("register.confirmPassword")}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="h-12"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 h-12 text-base font-semibold"
            disabled={isLoading}
          >
            {isLoading ? t("register.loading") : t("register.signUp")}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {t("register.alreadyHaveAccount")}{" "}
          <a
            href="/login"
            className="text-amber-600 hover:text-amber-700 hover:underline font-semibold"
          >
            {t("register.signIn")}
          </a>
        </div>
      </div>
    </div>
  );
}
```

---

## 🌐 Adicionar Traduções

Adicione ao `client/src/contexts/LanguageContext.tsx`:

```typescript
// PT-BR
"login.title": "Entrar",
"login.subtitle": "Acesse sua conta para continuar",
"login.continueWithGoogle": "Continuar com Google",
"login.orContinueWith": "ou continue com",
"login.email": "Email",
"login.password": "Senha",
"login.signIn": "Entrar",
"login.loading": "Entrando...",
"login.forgotPassword": "Esqueceu a senha?",
"login.noAccount": "Não tem uma conta?",
"login.signUp": "Cadastre-se",
"login.error": "Erro ao entrar",
"login.invalidCredentials": "Email ou senha inválidos",
"login.success": "Login realizado!",
"login.welcomeBack": "Bem-vindo de volta!",
"login.somethingWrong": "Algo deu errado. Tente novamente.",

"register.title": "Criar Conta",
"register.subtitle": "Comece com 3 tokens gratuitos",
"register.continueWithGoogle": "Cadastrar com Google",
"register.orRegisterWith": "ou cadastre-se com",
"register.name": "Nome completo",
"register.namePlaceholder": "João Silva",
"register.email": "Email",
"register.password": "Senha",
"register.confirmPassword": "Confirmar senha",
"register.passwordHint": "Mínimo 8 caracteres",
"register.signUp": "Criar conta",
"register.loading": "Criando conta...",
"register.alreadyHaveAccount": "Já tem uma conta?",
"register.signIn": "Entrar",
"register.error": "Erro ao criar conta",
"register.passwordsDontMatch": "As senhas não coincidem",
"register.success": "Conta criada!",
"register.accountCreated": "Sua conta foi criada com sucesso. Você ganhou 3 tokens gratuitos!",
"register.somethingWrong": "Algo deu errado. Tente novamente.",

// EN
"login.title": "Sign In",
"login.subtitle": "Access your account to continue",
"login.continueWithGoogle": "Continue with Google",
"login.orContinueWith": "or continue with",
"login.email": "Email",
"login.password": "Password",
"login.signIn": "Sign In",
"login.loading": "Signing in...",
"login.forgotPassword": "Forgot password?",
"login.noAccount": "Don't have an account?",
"login.signUp": "Sign up",
"login.error": "Login error",
"login.invalidCredentials": "Invalid email or password",
"login.success": "Logged in!",
"login.welcomeBack": "Welcome back!",
"login.somethingWrong": "Something went wrong. Please try again.",

"register.title": "Create Account",
"register.subtitle": "Start with 3 free tokens",
"register.continueWithGoogle": "Sign up with Google",
"register.orRegisterWith": "or sign up with",
"register.name": "Full name",
"register.namePlaceholder": "John Doe",
"register.email": "Email",
"register.password": "Password",
"register.confirmPassword": "Confirm password",
"register.passwordHint": "Minimum 8 characters",
"register.signUp": "Create account",
"register.loading": "Creating account...",
"register.alreadyHaveAccount": "Already have an account?",
"register.signIn": "Sign in",
"register.error": "Registration error",
"register.passwordsDontMatch": "Passwords don't match",
"register.success": "Account created!",
"register.accountCreated": "Your account has been created successfully. You got 3 free tokens!",
"register.somethingWrong": "Something went wrong. Please try again.",
```

---

## 🔐 Variáveis de Ambiente

Adicione ao `.env`:

```env
# NextAuth
NEXTAUTH_URL=https://seudominio.com.br
NEXTAUTH_SECRET=gere_uma_string_aleatoria_segura_aqui_com_openssl_rand_base64_32

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456

# SMTP (para recuperação de senha)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
SMTP_FROM=noreply@archrender.com
```

**Gerar NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

---

## ✅ Checklist de Implementação

- [ ] Instalar dependências NextAuth
- [ ] Atualizar schema do banco de dados
- [ ] Aplicar migrations (`pnpm db:push`)
- [ ] Criar arquivo `server/lib/auth.ts`
- [ ] Criar router `server/routers/auth.ts`
- [ ] Criar página `LoginPage.tsx`
- [ ] Criar página `RegisterPage.tsx`
- [ ] Adicionar traduções PT-BR/EN
- [ ] Configurar Google OAuth no Google Cloud Console
- [ ] Adicionar variáveis de ambiente
- [ ] Configurar SMTP para recuperação de senha
- [ ] Testar login com Google
- [ ] Testar cadastro com email/senha
- [ ] Testar login com email/senha
- [ ] Testar recuperação de senha

---

**Pronto! Sistema de autenticação completo com Google e Email/Senha! 🎉**

