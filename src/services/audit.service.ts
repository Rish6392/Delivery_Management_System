import prisma from '@/lib/db';
import { generateId } from '@/lib/utils';
import { Prisma } from '@prisma/client';

/**
 * Create an audit log entry.
 * Can be used within a transaction by passing a tx client.
 */
export async function createAuditLog(
  data: {
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
  },
  tx?: Prisma.TransactionClient
) {
  const client = tx || prisma;
  return client.auditLog.create({
    data: {
      auditId: generateId('AUD'),
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      metadata: (data.metadata || {}) as Prisma.InputJsonValue,
    },
  });
}

/**
 * Get audit logs with pagination.
 */
export async function getAuditLogs(params: {
  page?: number;
  limit?: number;
  entityType?: string;
  entityId?: string;
  userId?: string;
}) {
  const { page = 1, limit = 20, entityType, entityId, userId } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.AuditLogWhereInput = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (userId) where.userId = userId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
