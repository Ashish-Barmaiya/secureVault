import prisma from "../db/prisma.js";

/**
 * Audit Service
 * Handles transactional logging of audit intent and async processing.
 */
class AuditService {
  /**
   * Logs an audit intent within a transaction.
   * @param {Object} tx - The Prisma transaction client.
   * @param {Object} event - The audit event details.
   * @param {string} event.actorType - USER, HEIR, SYSTEM
   * @param {string} event.actorId - ID of the actor
   * @param {string} event.targetType - ACCOUNT, VAULT, ASSET, HEIR_LINK
   * @param {string} event.targetId - ID of the target
   * @param {string} event.eventType - Event type string (e.g., USER_REGISTERED)
   * @param {number} event.eventVersion - Version of the event schema
   * @param {Object} event.payload - JSON payload details
   */
  static async logAuditIntent(tx, event) {
    if (!tx) {
      throw new Error("Transaction client (tx) is required for audit logging.");
    }

    const {
      actorType,
      actorId,
      targetType,
      targetId,
      eventType,
      eventVersion,
      payload,
    } = event;

    // Validate required fields
    if (!eventType || !eventVersion || !payload) {
      throw new Error("Missing required audit event fields.");
    }

    await tx.auditOutbox.create({
      data: {
        actorType,
        actorId,
        targetType,
        targetId,
        eventType,
        eventVersion,
        payload,
      },
    });
  }

  /**
   * Processes unprocessed outbox items.
   * Fetches items, converts them to AuditLog, and marks them as processed.
   * Should be called by a background worker.
   */
  static async processOutbox(batchSize = 50) {
    try {
      // Fetch unprocessed items
      const items = await prisma.auditOutbox.findMany({
        where: {
          processedAt: null,
          retryCount: { lt: 5 }, // Max 5 retries
        },
        orderBy: { occurredAt: "asc" },
        take: batchSize,
      });

      if (items.length === 0) return;

      console.log(`Processing ${items.length} audit outbox items...`);

      for (const item of items) {
        try {
          await this.processItem(item);
        } catch (error) {
          console.error(`Failed to process audit item ${item.id}:`, error);
          await prisma.auditOutbox.update({
            where: { id: item.id },
            data: {
              retryCount: { increment: 1 },
              error: error.message,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error in processOutbox:", error);
    }
  }

  /**
   * Processes a single outbox item.
   * Converts to AuditLog and marks as processed.
   */
  static async processItem(item) {
    // 1. Create AuditLog entry
    // In a real system, we might enrich this data or format the summary based on event type
    const summary = this.generateSummary(item);

    await prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          actorType: item.actorType,
          actorId: item.actorId,
          targetType: item.targetType,
          targetId: item.targetId,
          eventType: item.eventType,
          summary: summary,
          occurredAt: item.occurredAt,
          metadata: item.payload, // Use payload as metadata for now
        },
      });

      // 2. Mark outbox item as processed
      await tx.auditOutbox.update({
        where: { id: item.id },
        data: {
          processedAt: new Date(),
          error: null,
        },
      });
    });
  }

  /**
   * Generates a human-readable summary for the audit log.
   */
  static generateSummary(item) {
    // This can be expanded with a switch case or a template engine
    return `${item.eventType} performed by ${item.actorType} ${
      item.actorId || "Unknown"
    } on ${item.targetType} ${item.targetId || "Unknown"}`;
  }
}

export default AuditService;
