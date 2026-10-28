import prisma from '@/lib/db';
import { createAuditLog } from './audit.service';
import { generateId } from '@/lib/utils';
import { BusinessError } from '@/lib/auth-helpers';
import path from 'path';
import fs from 'fs/promises';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || '10')) * 1024 * 1024; // Default 10MB

/**
 * Upload proof of delivery (Challenge 5).
 * Only the assigned driver can upload proof for their delivery.
 */
export async function uploadProofOfDelivery(data: {
  shipmentId: string;
  driverId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileBuffer: Buffer;
  userId: string;
}) {
  // Validate file type
  if (!ALLOWED_FILE_TYPES.includes(data.fileType)) {
    throw new BusinessError(
      `Invalid file type. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`,
      400
    );
  }

  // Validate file size
  if (data.fileSize > MAX_FILE_SIZE) {
    throw new BusinessError(
      `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      400
    );
  }

  // Verify shipment exists and is delivered or out for delivery
  const shipment = await prisma.shipment.findUnique({
    where: { shipmentId: data.shipmentId },
  });

  if (!shipment) {
    throw new BusinessError('Shipment not found', 404);
  }

  if (!['DELIVERED', 'OUT_FOR_DELIVERY'].includes(shipment.status)) {
    throw new BusinessError(
      'Proof of delivery can only be uploaded for delivered or out-for-delivery shipments',
      409
    );
  }

  // Verify driver is assigned to this shipment
  const assignment = await prisma.driverAssignment.findFirst({
    where: {
      shipmentId: data.shipmentId,
      driverId: data.driverId,
      status: { in: ['ACTIVE', 'COMPLETED'] },
    },
  });

  if (!assignment) {
    throw new BusinessError(
      'You are not assigned to this shipment',
      403
    );
  }

  // Save file to local storage
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  const proofDir = path.join(uploadDir, 'proofs');
  await fs.mkdir(proofDir, { recursive: true });

  const ext = path.extname(data.fileName) || '.jpg';
  const safeFileName = `${data.shipmentId}-${data.driverId}-${Date.now()}${ext}`;
  const filePath = path.join(proofDir, safeFileName);
  
  await fs.writeFile(filePath, data.fileBuffer);

  const fileUrl = `/api/proofs/${safeFileName}`;

  // Create proof record
  const proof = await prisma.proofOfDelivery.create({
    data: {
      proofId: generateId('PRD'),
      shipmentId: data.shipmentId,
      driverId: data.driverId,
      fileName: safeFileName,
      fileUrl,
      fileType: data.fileType,
      fileSize: data.fileSize,
      status: 'PENDING',
    },
  });

  // Audit log
  await createAuditLog({
    userId: data.userId,
    action: 'PROOF_UPLOADED',
    entityType: 'PROOF_OF_DELIVERY',
    entityId: proof.proofId,
    metadata: {
      shipment: data.shipmentId,
      driver: data.driverId,
    },
  });

  return proof;
}

/**
 * Get proof of delivery with authorization.
 */
export async function getProofOfDelivery(
  proofId: string,
  role: string,
  customerId?: string,
  driverId?: string
) {
  const proof = await prisma.proofOfDelivery.findUnique({
    where: { proofId },
    include: {
      shipment: { select: { customerId: true, shipmentId: true } },
      driver: { select: { name: true, driverId: true } },
    },
  });

  if (!proof) {
    throw new BusinessError('Proof of delivery not found', 404);
  }

  // Customers can only see proofs for their own shipments
  if (role === 'CUSTOMER' && customerId && proof.shipment.customerId !== customerId) {
    throw new BusinessError('Proof of delivery not found', 404);
  }

  // Drivers can only see their own proofs
  if (role === 'DRIVER' && driverId && proof.driverId !== driverId) {
    throw new BusinessError('Proof of delivery not found', 404);
  }

  return proof;
}

/**
 * Get proofs for a specific shipment.
 */
export async function getShipmentProofs(
  shipmentId: string,
  role: string,
  customerId?: string,
  driverId?: string
) {
  // Verify shipment exists and user has access
  const shipment = await prisma.shipment.findUnique({
    where: { shipmentId },
  });

  if (!shipment) {
    throw new BusinessError('Shipment not found', 404);
  }

  if (role === 'CUSTOMER' && customerId && shipment.customerId !== customerId) {
    throw new BusinessError('Shipment not found', 404);
  }

  if (role === 'DRIVER') {
    const assignment = await prisma.driverAssignment.findFirst({
      where: { shipmentId, driverId: driverId || '' },
    });
    if (!assignment) {
      throw new BusinessError('Shipment not found', 404);
    }
  }

  return prisma.proofOfDelivery.findMany({
    where: { shipmentId },
    include: {
      driver: { select: { name: true } },
    },
    orderBy: { uploadedAt: 'desc' },
  });
}
