import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Updating user inactivity periods...");

  try {
    const result = await prisma.user.updateMany({
      data: {
        inactivityPeriod: 30,
      },
    });

    console.log(`Updated ${result.count} users to 30 days inactivity period.`);
  } catch (error) {
    console.error("Error updating users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
