import { ShipmentStatus } from '@prisma/client';

/**
 * Centralized shipment state machine.
 * Defines all valid state transitions for shipments.
 */

// Map each status to the set of valid next statuses
const VALID_TRANSITIONS: Record<ShipmentStatus, ShipmentStatus[]> = {
  [ShipmentStatus.CREATED]: [ShipmentStatus.ASSIGNED, ShipmentStatus.CANCELLED],
  [ShipmentStatus.ASSIGNED]: [ShipmentStatus.PICKUP_CONFIRMED, ShipmentStatus.CANCELLED],
  [ShipmentStatus.PICKUP_CONFIRMED]: [ShipmentStatus.IN_TRANSIT],
  [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.OUT_FOR_DELIVERY],
  [ShipmentStatus.OUT_FOR_DELIVERY]: [ShipmentStatus.DELIVERED, ShipmentStatus.DELIVERY_FAILED],
  [ShipmentStatus.DELIVERED]: [], // Terminal state
  [ShipmentStatus.DELIVERY_FAILED]: [ShipmentStatus.RESCHEDULED, ShipmentStatus.CANCELLED],
  [ShipmentStatus.RESCHEDULED]: [ShipmentStatus.ASSIGNED],
  [ShipmentStatus.CANCELLED]: [], // Terminal state
};

/**
 * Check if a transition from currentStatus to newStatus is valid.
 */
export function isValidTransition(
  currentStatus: ShipmentStatus,
  newStatus: ShipmentStatus
): boolean {
  const allowedNextStatuses = VALID_TRANSITIONS[currentStatus];
  if (!allowedNextStatuses) return false;
  return allowedNextStatuses.includes(newStatus);
}

/**
 * Get all valid next states from the current status.
 */
export function getValidNextStatuses(currentStatus: ShipmentStatus): ShipmentStatus[] {
  return VALID_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if a shipment can be cancelled from its current status.
 */
export function canCancel(currentStatus: ShipmentStatus): boolean {
  return isValidTransition(currentStatus, ShipmentStatus.CANCELLED);
}

/**
 * Check if the status is a terminal state (no further transitions allowed).
 */
export function isTerminalState(status: ShipmentStatus): boolean {
  const nextStatuses = VALID_TRANSITIONS[status];
  return !nextStatuses || nextStatuses.length === 0;
}

/**
 * Statuses that require a driver to be assigned.
 */
export const DRIVER_REQUIRED_STATUSES: ShipmentStatus[] = [
  ShipmentStatus.PICKUP_CONFIRMED,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.OUT_FOR_DELIVERY,
  ShipmentStatus.DELIVERED,
  ShipmentStatus.DELIVERY_FAILED,
];

/**
 * Statuses that indicate active delivery (driver/vehicle should not be reassigned).
 */
export const ACTIVE_DELIVERY_STATUSES: ShipmentStatus[] = [
  ShipmentStatus.ASSIGNED,
  ShipmentStatus.PICKUP_CONFIRMED,
  ShipmentStatus.IN_TRANSIT,
  ShipmentStatus.OUT_FOR_DELIVERY,
];

/**
 * Statuses from which a shipment can be cancelled.
 */
export const CANCELLABLE_STATUSES: ShipmentStatus[] = [
  ShipmentStatus.CREATED,
  ShipmentStatus.ASSIGNED,
  ShipmentStatus.DELIVERY_FAILED,
];

/**
 * Map shipment status to corresponding delivery event type name.
 */
export function statusToEventType(status: ShipmentStatus): string {
  return status; // They use the same enum values
}
