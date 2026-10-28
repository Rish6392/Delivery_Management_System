export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleApiError, BusinessError } from '@/lib/auth-helpers';
import { uploadProofOfDelivery, getShipmentProofs } from '@/services/proof.service';

// GET /api/proofs?shipmentId=xxx
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const shipmentId = request.nextUrl.searchParams.get('shipmentId');

    if (!shipmentId) {
      throw new BusinessError('Shipment ID is required', 400);
    }

    const proofs = await getShipmentProofs(
      shipmentId,
      user.role,
      user.customerId || undefined,
      user.driverId || undefined
    );

    return NextResponse.json({ data: proofs });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/proofs - Upload proof of delivery
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (user.role !== 'DRIVER') {
      throw new BusinessError('Only drivers can upload proof of delivery', 403);
    }

    if (!user.driverId) {
      throw new BusinessError('Driver profile not found', 400);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const shipmentId = formData.get('shipmentId') as string;

    if (!file) {
      throw new BusinessError('File is required', 400);
    }

    if (!shipmentId) {
      throw new BusinessError('Shipment ID is required', 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const proof = await uploadProofOfDelivery({
      shipmentId,
      driverId: user.driverId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileBuffer: buffer,
      userId: user.userId,
    });

    return NextResponse.json(proof, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
