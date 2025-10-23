import { drizzle } from "drizzle-orm/mysql2";
import { tokenPackages } from "../drizzle/schema";

async function seedTokenPackages() {
  const db = drizzle(process.env.DATABASE_URL!);

  const packages = [
    {
      name: "Pacote Inicial",
      tokenAmount: 5,
      priceInCents: 5000, // R$ 50,00
      pricePerToken: 1000, // R$ 10,00 por token
      displayOrder: 1,
      isActive: 1,
    },
    {
      name: "Pacote Básico",
      tokenAmount: 10,
      priceInCents: 9000, // R$ 90,00
      pricePerToken: 900, // R$ 9,00 por token
      displayOrder: 2,
      isActive: 1,
    },
    {
      name: "Pacote Popular",
      tokenAmount: 25,
      priceInCents: 20000, // R$ 200,00
      pricePerToken: 800, // R$ 8,00 por token
      displayOrder: 3,
      isActive: 1,
    },
    {
      name: "Pacote Profissional",
      tokenAmount: 50,
      priceInCents: 35000, // R$ 350,00
      pricePerToken: 700, // R$ 7,00 por token
      displayOrder: 4,
      isActive: 1,
    },
    {
      name: "Pacote Premium",
      tokenAmount: 70,
      priceInCents: 42000, // R$ 420,00
      pricePerToken: 600, // R$ 6,00 por token
      displayOrder: 5,
      isActive: 1,
    },
  ];

  console.log("Inserindo pacotes de tokens...");
  
  for (const pkg of packages) {
    await db.insert(tokenPackages).values(pkg);
    console.log(`✓ ${pkg.name}: ${pkg.tokenAmount} tokens por R$ ${(pkg.priceInCents / 100).toFixed(2)}`);
  }

  console.log("\n✅ Pacotes de tokens inseridos com sucesso!");
  process.exit(0);
}

seedTokenPackages().catch((error) => {
  console.error("❌ Erro ao inserir pacotes:", error);
  process.exit(1);
});

