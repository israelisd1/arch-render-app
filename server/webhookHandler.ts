import { Request, Response } from "express";
import Stripe from "stripe";
import { constructWebhookEvent } from "./stripe";
import {
  getStripeTransactionBySessionId,
  updateStripeTransaction,
  addTokens,
} from "./db";

/**
 * Handler para webhooks do Stripe
 * Processa eventos de pagamento e atualiza saldo de tokens
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"];

  if (!signature || Array.isArray(signature)) {
    console.error("[Stripe Webhook] Missing signature");
    return res.status(400).send("Missing signature");
  }

  let event: Stripe.Event;

  try {
    // Verificar assinatura do webhook
    event = constructWebhookEvent(req.body, signature);
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  // Processar eventos relevantes
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case "checkout.session.async_payment_succeeded":
      await handleAsyncPaymentSucceeded(event.data.object as Stripe.Checkout.Session);
      break;

    case "checkout.session.async_payment_failed":
      await handleAsyncPaymentFailed(event.data.object as Stripe.Checkout.Session);
      break;

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}

/**
 * Processa checkout concluído (pagamento imediato com cartão)
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`[Stripe Webhook] Checkout completed: ${session.id}`);

  // Verificar se o pagamento foi concluído
  if (session.payment_status !== "paid") {
    console.log(`[Stripe Webhook] Payment not paid yet: ${session.payment_status}`);
    return;
  }

  await processSuccessfulPayment(session);
}

/**
 * Processa pagamento assíncrono bem-sucedido (Pix, boleto)
 */
async function handleAsyncPaymentSucceeded(session: Stripe.Checkout.Session) {
  console.log(`[Stripe Webhook] Async payment succeeded: ${session.id}`);
  await processSuccessfulPayment(session);
}

/**
 * Processa pagamento assíncrono que falhou
 */
async function handleAsyncPaymentFailed(session: Stripe.Checkout.Session) {
  console.log(`[Stripe Webhook] Async payment failed: ${session.id}`);

  const transaction = await getStripeTransactionBySessionId(session.id);

  if (!transaction) {
    console.error(`[Stripe Webhook] Transaction not found: ${session.id}`);
    return;
  }

  await updateStripeTransaction(session.id, {
    status: "failed",
    completedAt: new Date(),
  });

  console.log(`[Stripe Webhook] Transaction ${session.id} marked as failed`);
}

/**
 * Processa pagamento bem-sucedido e adiciona tokens
 */
async function processSuccessfulPayment(session: Stripe.Checkout.Session) {
  const transaction = await getStripeTransactionBySessionId(session.id);

  if (!transaction) {
    console.error(`[Stripe Webhook] Transaction not found: ${session.id}`);
    return;
  }

  // Verificar se já foi processado
  if (transaction.status === "completed") {
    console.log(`[Stripe Webhook] Transaction already processed: ${session.id}`);
    return;
  }

  // Extrair metadata
  const userId = parseInt(session.metadata?.userId || "0");
  const packageId = parseInt(session.metadata?.packageId || "0");
  const tokenAmount = parseInt(session.metadata?.tokenAmount || "0");

  if (!userId || !tokenAmount) {
    console.error(`[Stripe Webhook] Invalid metadata:`, session.metadata);
    return;
  }

  try {
    // Adicionar tokens ao usuário
    const newBalance = await addTokens(
      userId,
      tokenAmount,
      packageId,
      transaction.amount,
      `Compra via Stripe - ${tokenAmount} tokens`
    );

    // Atualizar transação
    await updateStripeTransaction(session.id, {
      status: "completed",
      paymentIntentId: session.payment_intent as string,
      paymentMethod: session.payment_method_types?.[0],
      completedAt: new Date(),
    });

    console.log(
      `[Stripe Webhook] Payment processed successfully. User ${userId} received ${tokenAmount} tokens. New balance: ${newBalance}`
    );
  } catch (error: any) {
    console.error(`[Stripe Webhook] Error processing payment:`, error);

    await updateStripeTransaction(session.id, {
      status: "failed",
      completedAt: new Date(),
    });
  }
}

