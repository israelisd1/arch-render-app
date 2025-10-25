import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertRender, InsertUser, renders, tokenPackages, tokenTransactions, users, stripeTransactions, InsertStripeTransaction, coupons, Coupon } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Cria um novo registro de renderização
 */
export async function createRender(render: InsertRender) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(renders).values(render);
  return result;
}

/**
 * Atualiza o status de uma renderização
 */
export async function updateRenderStatus(
  id: number,
  status: "pending" | "processing" | "completed" | "failed",
  data?: { renderedImageUrl?: string; errorMessage?: string; completedAt?: Date }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (data?.renderedImageUrl) updateData.renderedImageUrl = data.renderedImageUrl;
  if (data?.errorMessage) updateData.errorMessage = data.errorMessage;
  if (data?.completedAt) updateData.completedAt = data.completedAt;
  
  await db.update(renders).set(updateData).where(eq(renders.id, id));
}

/**
 * Busca renderizações de um usuário
 */
export async function getUserRenders(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(renders).where(eq(renders.userId, userId)).orderBy(desc(renders.createdAt));
}

/**
 * Busca uma renderização por ID
 */
export async function getRenderById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(renders).where(eq(renders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}


/**
 * Busca todos os pacotes de tokens ativos
 */
export async function getActiveTokenPackages() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(tokenPackages).where(eq(tokenPackages.isActive, 1)).orderBy(tokenPackages.displayOrder);
}

/**
 * Deduz tokens do saldo do usuário e registra transação
 */
export async function deductTokens(userId: number, amount: number, renderId?: number, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar saldo atual
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.length === 0) throw new Error("User not found");

  const balanceBefore = user[0].tokenBalance;
  const balanceAfter = balanceBefore - amount;

  if (balanceAfter < 0) {
    throw new Error("Insufficient token balance");
  }

  // Atualizar saldo
  await db.update(users).set({ tokenBalance: balanceAfter }).where(eq(users.id, userId));

  // Registrar transação
  await db.insert(tokenTransactions).values({
    userId,
    type: "usage",
    amount: -amount,
    balanceBefore,
    balanceAfter,
    renderId,
    description: description || `Renderização #${renderId}`,
    paymentStatus: "completed",
  });

  return balanceAfter;
}

/**
 * Adiciona tokens ao saldo do usuário e registra transação
 */
export async function addTokens(userId: number, amount: number, packageId?: number, priceInCents?: number, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Buscar saldo atual
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.length === 0) throw new Error("User not found");

  const balanceBefore = user[0].tokenBalance;
  const balanceAfter = balanceBefore + amount;

  // Atualizar saldo
  await db.update(users).set({ tokenBalance: balanceAfter }).where(eq(users.id, userId));

  // Registrar transação
  await db.insert(tokenTransactions).values({
    userId,
    type: "purchase",
    amount,
    balanceBefore,
    balanceAfter,
    packageId,
    priceInCents,
    description: description || `Compra de ${amount} tokens`,
    paymentStatus: "completed",
  });

  return balanceAfter;
}

/**
 * Busca histórico de transações do usuário
 */
export async function getUserTokenTransactions(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return await db.select().from(tokenTransactions).where(eq(tokenTransactions.userId, userId)).orderBy(desc(tokenTransactions.createdAt));
}




// ============================================
// STRIPE TRANSACTIONS
// ============================================

export async function createStripeTransaction(transaction: InsertStripeTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(stripeTransactions).values(transaction);
  return result.insertId;
}

export async function getStripeTransactionBySessionId(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(stripeTransactions)
    .where(eq(stripeTransactions.sessionId, sessionId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function updateStripeTransaction(
  sessionId: string,
  updates: {
    status?: "pending" | "completed" | "failed" | "refunded";
    paymentIntentId?: string;
    paymentMethod?: string;
    completedAt?: Date;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(stripeTransactions)
    .set(updates)
    .where(eq(stripeTransactions.sessionId, sessionId));
}

export async function getUserStripeTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(stripeTransactions)
    .where(eq(stripeTransactions.userId, userId))
    .orderBy(desc(stripeTransactions.createdAt));
}

// ============================================
// COUPONS
// ============================================

export async function getCouponByCode(code: string): Promise<Coupon | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(coupons)
    .where(eq(coupons.code, code))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function incrementCouponUsage(code: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(coupons)
    .set({ usedCount: eq(coupons.usedCount, coupons.usedCount) })
    .where(eq(coupons.code, code));
}

export async function createCoupon(coupon: {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxUses?: number;
  expiresAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(coupons).values(coupon);
  return result.insertId;
}

