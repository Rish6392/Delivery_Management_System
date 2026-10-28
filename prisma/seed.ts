import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Load mock data
  const mockDataPath = path.join(process.cwd(), 'mock_data.json');
  const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf-8'));

  // Default password for all seeded users
  const defaultPassword = await bcrypt.hash('password123', 12);

  // ─── Seed Users ────────────────────────────────────────────────
  console.log('👤 Seeding users...');
  for (const user of mockData.users) {
    await prisma.user.upsert({
      where: { userId: user.user_id },
      update: {},
      create: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        passwordHash: defaultPassword,
        role: user.role,
        status: user.status,
      },
    });
  }

  // ─── Seed Customers ────────────────────────────────────────────
  console.log('🏢 Seeding customers...');
  for (const customer of mockData.customers) {
    await prisma.customer.upsert({
      where: { customerId: customer.customer_id },
      update: {},
      create: {
        customerId: customer.customer_id,
        customerNumber: customer.customer_number,
        userId: customer.user_id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        status: customer.status,
        createdAt: new Date(customer.created_at),
      },
    });
  }

  // ─── Seed Drivers ──────────────────────────────────────────────
  console.log('🚗 Seeding drivers...');
  for (const driver of mockData.drivers) {
    await prisma.driver.upsert({
      where: { driverId: driver.driver_id },
      update: {},
      create: {
        driverId: driver.driver_id,
        employeeNumber: driver.employee_number,
        userId: driver.user_id,
        name: driver.name,
        phone: driver.phone,
        licenseNumber: driver.license_number,
        licenseExpiry: new Date(driver.license_expiry),
        status: driver.status,
        currentStatus: driver.current_status,
      },
    });
  }

  // ─── Seed Vehicles ─────────────────────────────────────────────
  console.log('🚛 Seeding vehicles...');
  for (const vehicle of mockData.vehicles) {
    await prisma.vehicle.upsert({
      where: { vehicleId: vehicle.vehicle_id },
      update: {},
      create: {
        vehicleId: vehicle.vehicle_id,
        registrationNumber: vehicle.registration_number,
        vehicleType: vehicle.vehicle_type,
        capacityKg: vehicle.capacity_kg,
        status: vehicle.status,
        currentStatus: vehicle.current_status,
        currentDriverId: vehicle.driver_id,
        lastServiceDate: vehicle.last_service_date ? new Date(vehicle.last_service_date) : null,
      },
    });
  }

  // ─── Seed Shipments ────────────────────────────────────────────
  console.log('📦 Seeding shipments...');
  for (const shipment of mockData.shipments) {
    await prisma.shipment.upsert({
      where: { shipmentId: shipment.shipment_id },
      update: {},
      create: {
        shipmentId: shipment.shipment_id,
        shipmentNumber: shipment.shipment_number,
        customerId: shipment.customer_id,
        pickupAddress: shipment.pickup_address,
        deliveryAddress: shipment.delivery_address,
        packageDescription: shipment.package_description,
        packageWeightKg: shipment.package_weight_kg,
        priority: shipment.priority,
        scheduledPickupDate: shipment.scheduled_pickup_date ? new Date(shipment.scheduled_pickup_date) : null,
        scheduledDeliveryDate: shipment.scheduled_delivery_date ? new Date(shipment.scheduled_delivery_date) : null,
        status: shipment.status,
        createdAt: new Date(shipment.created_at),
        updatedAt: new Date(shipment.updated_at),
      },
    });
  }

  // ─── Seed Driver Assignments ───────────────────────────────────
  console.log('📋 Seeding driver assignments...');
  for (const assignment of mockData.driver_assignments) {
    await prisma.driverAssignment.upsert({
      where: { assignmentId: assignment.assignment_id },
      update: {},
      create: {
        assignmentId: assignment.assignment_id,
        shipmentId: assignment.shipment_id,
        driverId: assignment.driver_id,
        vehicleId: assignment.vehicle_id,
        assignedById: assignment.assigned_by,
        assignedAt: new Date(assignment.assigned_at),
        startedAt: assignment.started_at ? new Date(assignment.started_at) : null,
        endedAt: assignment.ended_at ? new Date(assignment.ended_at) : null,
        status: assignment.status,
      },
    });
  }

  // ─── Seed Delivery Events ─────────────────────────────────────
  console.log('📝 Seeding delivery events...');
  for (const event of mockData.delivery_events) {
    await prisma.deliveryEvent.upsert({
      where: { eventId: event.event_id },
      update: {},
      create: {
        eventId: event.event_id,
        shipmentId: event.shipment_id,
        driverId: event.driver_id,
        eventType: event.event_type,
        location: event.location,
        notes: event.notes,
        idempotencyKey: event.idempotency_key,
        createdAt: new Date(event.created_at),
      },
    });
  }

  // ─── Seed Proof of Delivery ────────────────────────────────────
  console.log('📸 Seeding proof of delivery...');
  for (const proof of mockData.proof_of_delivery) {
    await prisma.proofOfDelivery.upsert({
      where: { proofId: proof.proof_id },
      update: {},
      create: {
        proofId: proof.proof_id,
        shipmentId: proof.shipment_id,
        driverId: proof.driver_id,
        fileName: proof.file_name,
        fileUrl: proof.file_url,
        fileType: proof.file_type,
        status: proof.status,
        uploadedAt: new Date(proof.uploaded_at),
      },
    });
  }

  // ─── Seed Audit Logs ──────────────────────────────────────────
  console.log('📊 Seeding audit logs...');
  for (const audit of mockData.audit_logs) {
    await prisma.auditLog.upsert({
      where: { auditId: audit.audit_id },
      update: {},
      create: {
        auditId: audit.audit_id,
        userId: audit.user_id,
        action: audit.action,
        entityType: audit.entity_type,
        entityId: audit.entity_id,
        metadata: audit.metadata,
        createdAt: new Date(audit.created_at),
      },
    });
  }

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('Demo login credentials (all users):');
  console.log('  Password: password123');
  console.log('');
  console.log('Available users:');
  for (const user of mockData.users) {
    console.log(`  ${user.role.padEnd(12)} | ${user.email}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
