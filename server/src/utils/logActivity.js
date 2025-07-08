import { PrismaClient, ActionType } from "@prisma/client";
const prisma = new PrismaClient();

const logActivity = async (req, userId, action) => {
  try {
    const ipAddress =
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const userAgent = req.headers["user-agent"] || "Unknown";

    await prisma.activityLog.create({
      data: {
        action: ActionType[action],
        ipAddress,
        userAgent,
        user: {
          connect: { id: userId },
        },
      },
    });
    return true;
  } catch (error) {
    console.error("Failed to log activity:", error);
    return false;
  }
};

export { logActivity };
