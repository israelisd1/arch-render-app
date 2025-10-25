import { drizzle } from "drizzle-orm/mysql2";
import { coupons } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function seedCoupons() {
  console.log("🎫 Criando cupons de exemplo...");

  const sampleCoupons = [
    {
      code: "BEMVINDO10",
      discountType: "percentage" as const,
      discountValue: 10, // 10%
      maxUses: null, // Ilimitado
      expiresAt: null, // Sem expiração
      isActive: 1,
    },
    {
      code: "PRIMEIRACOMPRA",
      discountType: "percentage" as const,
      discountValue: 15, // 15%
      maxUses: 100,
      expiresAt: new Date("2025-12-31"),
      isActive: 1,
    },
    {
      code: "DESCONTO50",
      discountType: "fixed" as const,
      discountValue: 5000, // R$ 50,00 em centavos
      maxUses: 50,
      expiresAt: new Date("2025-12-31"),
      isActive: 1,
    },
  ];

  for (const coupon of sampleCoupons) {
    try {
      await db.insert(coupons).values(coupon);
      console.log(`✅ Cupom criado: ${coupon.code}`);
    } catch (error: any) {
      if (error.code === "ER_DUP_ENTRY") {
        console.log(`⚠️  Cupom já existe: ${coupon.code}`);
      } else {
        console.error(`❌ Erro ao criar cupom ${coupon.code}:`, error);
      }
    }
  }

  console.log("\n✨ Cupons de exemplo criados!");
  console.log("\nCupons disponíveis:");
  console.log("- BEMVINDO10: 10% de desconto (ilimitado)");
  console.log("- PRIMEIRACOMPRA: 15% de desconto (100 usos)");
  console.log("- DESCONTO50: R$ 50,00 de desconto (50 usos)");

  process.exit(0);
}

seedCoupons().catch((error) => {
  console.error("Erro ao criar cupons:", error);
  process.exit(1);
});

