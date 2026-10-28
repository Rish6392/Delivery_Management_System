import { z } from 'zod';

// ─── User Validation ─────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Shipment Validation ─────────────────────────────────────────

export const createShipmentSchema = z.object({
  pickupAddress: z.string().min(5, 'Pickup address must be at least 5 characters'),
  deliveryAddress: z.string().min(5, 'Delivery address must be at least 5 characters'),
  packageDescription: z.string().min(1, 'Package description is required'),
  packageWeightKg: z.number().positive('Package weight must be positive').max(50000, 'Weight too large'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  scheduledPickupDate: z.string().datetime().optional(),
  scheduledDeliveryDate: z.string().datetime().optional(),
});

export const cancelShipmentSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required').max(500),
});

// ─── Assignment Validation ───────────────────────────────────────

export const createAssignmentSchema = z.object({
  shipmentId: z.string().min(1, 'Shipment ID is required'),
  driverId: z.string().min(1, 'Driver ID is required'),
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
});

// ─── Delivery Status Update Validation ───────────────────────────

export const updateDeliveryStatusSchema = z.object({
  status: z.enum([
    'PICKUP_CONFIRMED',
    'IN_TRANSIT',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'DELIVERY_FAILED',
  ]),
  location: z.string().optional(),
  notes: z.string().optional(),
  failureReason: z.string().optional(),
  idempotencyKey: z.string().min(1, 'Idempotency key is required'),
});

// ─── Driver Validation ───────────────────────────────────────────

export const createDriverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  licenseNumber: z.string().min(5, 'License number is required'),
  licenseExpiry: z.string().datetime('Valid expiry date is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateDriverSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(10).optional(),
  licenseNumber: z.string().min(5).optional(),
  licenseExpiry: z.string().datetime().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  currentStatus: z.enum(['AVAILABLE', 'ASSIGNED', 'ON_DELIVERY', 'OFF_DUTY']).optional(),
});

// ─── Vehicle Validation ──────────────────────────────────────────

export const createVehicleSchema = z.object({
  registrationNumber: z.string().min(1, 'Registration number is required'),
  vehicleType: z.enum(['VAN', 'TRUCK', 'MINI_TRUCK', 'BIKE']),
  capacityKg: z.number().positive('Capacity must be positive'),
});

export const updateVehicleSchema = z.object({
  registrationNumber: z.string().min(1).optional(),
  vehicleType: z.enum(['VAN', 'TRUCK', 'MINI_TRUCK', 'BIKE']).optional(),
  capacityKg: z.number().positive().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  currentStatus: z.enum(['AVAILABLE', 'ASSIGNED', 'IN_TRANSIT', 'MAINTENANCE']).optional(),
});

// ─── Customer Validation ─────────────────────────────────────────

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().min(5, 'Address is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(10).optional(),
  address: z.string().min(5).optional(),
});

// ─── Proof of Delivery Validation ────────────────────────────────

export const proofOfDeliverySchema = z.object({
  shipmentId: z.string().min(1, 'Shipment ID is required'),
});

// ─── Query Validation ────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ─── Reschedule Validation ───────────────────────────────────────

export const rescheduleShipmentSchema = z.object({
  scheduledPickupDate: z.string().datetime('Valid pickup date is required'),
  scheduledDeliveryDate: z.string().datetime('Valid delivery date is required'),
  notes: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export type CancelShipmentInput = z.infer<typeof cancelShipmentSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateDeliveryStatusInput = z.infer<typeof updateDeliveryStatusSchema>;
export type CreateDriverInput = z.infer<typeof createDriverSchema>;
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type RescheduleShipmentInput = z.infer<typeof rescheduleShipmentSchema>;
