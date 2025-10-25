import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  tokenBalance: int("tokenBalance").default(3).notNull(), // Saldo de tokens (inicia com 3)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela para armazenar histórico de renderizações
 */
export const renders = mysqlTable("renders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  originalImageUrl: text("originalImageUrl").notNull(),
  renderedImageUrl: text("renderedImageUrl"),
  sceneType: mysqlEnum("sceneType", ["interior", "exterior"]).notNull(),
  outputFormat: varchar("outputFormat", { length: 10 }).notNull(),
  prompt: text("prompt"),
  parentRenderId: int("parentRenderId"), // ID da renderização original (para refinamentos)
  // Parâmetros de ajuste visual (para refinamentos)
  adjustmentSaturation: int("adjustmentSaturation"), // -100 a +100
  adjustmentBrightness: int("adjustmentBrightness"), // -50 a +50
  adjustmentContrast: int("adjustmentContrast"), // -50 a +50
  adjustmentLighting: int("adjustmentLighting"), // -30 a +30
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Render = typeof renders.$inferSelect;
export type InsertRender = typeof renders.$inferInsert;

/**
 * Pacotes de tokens disponíveis para compra
 */
export const tokenPackages = mysqlTable("token_packages", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(), // Ex: "Pacote Inicial"
  tokenAmount: int("tokenAmount").notNull(), // Quantidade de tokens
  priceInCents: int("priceInCents").notNull(), // Preço em centavos (ex: 5000 = R$ 50,00)
  pricePerToken: int("pricePerToken").notNull(), // Preço por token em centavos
  isActive: int("isActive").default(1).notNull(), // 1 = ativo, 0 = inativo
  displayOrder: int("displayOrder").default(0).notNull(), // Ordem de exibição
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TokenPackage = typeof tokenPackages.$inferSelect;
export type InsertTokenPackage = typeof tokenPackages.$inferInsert;

/**
 * Histórico de transações de tokens
 */
export const tokenTransactions = mysqlTable("token_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["purchase", "usage", "refund", "bonus"]).notNull(),
  amount: int("amount").notNull(), // Positivo para crédito, negativo para débito
  balanceBefore: int("balanceBefore").notNull(),
  balanceAfter: int("balanceAfter").notNull(),
  packageId: int("packageId"), // Referência ao pacote comprado (se type = purchase)
  renderId: int("renderId"), // Referência à renderização (se type = usage)
  priceInCents: int("priceInCents"), // Valor pago (se type = purchase)
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "completed", "failed", "refunded"]),
  paymentMethod: varchar("paymentMethod", { length: 50 }), // Ex: "credit_card", "pix"
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type InsertTokenTransaction = typeof tokenTransactions.$inferInsert;

/**
 * Transações do Stripe para rastreamento de pagamentos
 */
export const stripeTransactions = mysqlTable("stripe_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionId: varchar("sessionId", { length: 255 }).unique(), // Stripe Checkout Session ID
  paymentIntentId: varchar("paymentIntentId", { length: 255 }), // Stripe Payment Intent ID
  amount: int("amount").notNull(), // Valor em centavos
  currency: varchar("currency", { length: 3 }).default("brl").notNull(),
  tokenPackageId: int("tokenPackageId"),
  tokensAmount: int("tokensAmount").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "refunded"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 50 }), // "card", "pix", etc
  couponCode: varchar("couponCode", { length: 100 }), // Cupom aplicado
  discountAmount: int("discountAmount").default(0), // Desconto em centavos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type StripeTransaction = typeof stripeTransactions.$inferSelect;
export type InsertStripeTransaction = typeof stripeTransactions.$inferInsert;

/**
 * Cupons de desconto
 */
export const coupons = mysqlTable("coupons", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).unique().notNull(),
  discountType: mysqlEnum("discountType", ["percentage", "fixed"]).notNull(),
  discountValue: int("discountValue").notNull(), // Porcentagem (ex: 10 = 10%) ou valor fixo em centavos
  maxUses: int("maxUses"), // Número máximo de usos (null = ilimitado)
  usedCount: int("usedCount").default(0).notNull(),
  expiresAt: timestamp("expiresAt"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = typeof coupons.$inferInsert;