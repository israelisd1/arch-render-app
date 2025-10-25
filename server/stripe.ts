import Stripe from "stripe";
import { ENV } from "./_core/env";

if (!ENV.stripeSecretKey) {
  console.warn("[Stripe] Secret key not configured. Stripe integration disabled.");
}

export const stripe = ENV.stripeSecretKey
  ? new Stripe(ENV.stripeSecretKey, {
      apiVersion: "2025-09-30.clover",
      typescript: true,
    })
  : null;

/**
 * Cria uma sessão de checkout do Stripe
 */
export async function createCheckoutSession({
  userId,
  packageId,
  packageName,
  tokenAmount,
  priceInCents,
  couponCode,
  successUrl,
  cancelUrl,
}: {
  userId: number;
  packageId: number;
  packageName: string;
  tokenAmount: number;
  priceInCents: number;
  couponCode?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  if (!stripe) {
    throw new Error("Stripe not configured");
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ["card"], // Cartão de crédito
    line_items: [
      {
        price_data: {
          currency: "brl",
          product_data: {
            name: packageName,
            description: `${tokenAmount} tokens para renderização arquitetônica`,
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: userId.toString(),
      packageId: packageId.toString(),
      tokenAmount: tokenAmount.toString(),
      couponCode: couponCode || "",
    },
    allow_promotion_codes: true, // Permite cupons do Stripe
  };

  // Adicionar Pix como método de pagamento (disponível no Brasil)
  if (ENV.isProduction) {
    sessionParams.payment_method_types?.push("boleto");
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  return session;
}

/**
 * Valida um cupom de desconto
 */
export function validateCoupon(coupon: {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  isActive: number;
}): { valid: boolean; reason?: string } {
  if (!coupon.isActive) {
    return { valid: false, reason: "Cupom inativo" };
  }

  if (coupon.expiresAt && new Date() > coupon.expiresAt) {
    return { valid: false, reason: "Cupom expirado" };
  }

  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, reason: "Cupom esgotado" };
  }

  return { valid: true };
}

/**
 * Calcula o desconto baseado no cupom
 */
export function calculateDiscount(
  priceInCents: number,
  coupon: {
    discountType: "percentage" | "fixed";
    discountValue: number;
  }
): number {
  if (coupon.discountType === "percentage") {
    return Math.floor((priceInCents * coupon.discountValue) / 100);
  } else {
    return Math.min(coupon.discountValue, priceInCents);
  }
}

/**
 * Verifica a assinatura do webhook do Stripe
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  if (!stripe) {
    throw new Error("Stripe not configured");
  }

  if (!ENV.stripeWebhookSecret) {
    throw new Error("Stripe webhook secret not configured");
  }

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    ENV.stripeWebhookSecret
  );
}

