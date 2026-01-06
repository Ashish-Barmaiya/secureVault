import prisma from "../db/prisma.js";

// GET AUDIT LOGS
const getAuditLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, eventType, startDate, endDate } = req.query;

    // Build filter
    const where = {
      OR: [
        { actorId: userId }, // Actions by user
        { targetId: userId }, // Actions targeting user
        // Also include actions on user's vault or assets if possible,
        // but for now, we rely on actorId/targetId being the user or their resources.
        // If we want to show Heir actions on User's vault, we need to check targetId = vaultId.
        // But we don't have vaultId easily here without querying.
        // For simplicity, we assume actorId or targetId matches userId.
      ],
    };

    if (eventType) {
      where.eventType = eventType;
    }

    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) where.occurredAt.gte = new Date(startDate);
      if (endDate) where.occurredAt.lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch logs
    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: { occurredAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export { getAuditLogs };
