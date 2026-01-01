import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Please provide the USER email as an argument.");
    console.log("Usage: node scripts/set_vault_inheritable.js <user_email>");
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { vault: true },
    });

    if (!user || !user.vault) {
      console.error("User or vault not found.");
      process.exit(1);
    }

    const updatedVault = await prisma.vault.update({
      where: { id: user.vault.id },
      data: {
        state: "INHERITABLE",
        graceStartedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
    });

    console.log(`Vault for user ${email} is now INHERITABLE.`);
    console.log("State:", updatedVault.state);
  } catch (error) {
    console.error("Error updating vault:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
