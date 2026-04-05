/**
 * Seed script — populates Firestore with realistic dev data for a Bangalore car wash ops system.
 *
 * Run: npx tsx scripts/seed-firestore.ts
 *
 * Requires: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env.local
 */

import * as dotenv from 'dotenv'
import { resolve } from 'path'

dotenv.config({ path: resolve(process.cwd(), '.env.local') })

import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'

const app =
  getApps().length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      })
    : getApp()

const db = getFirestore(app)

const now = Timestamp.now()
const yesterday = Timestamp.fromDate(new Date(Date.now() - 86400000))
const lastWeek = Timestamp.fromDate(new Date(Date.now() - 7 * 86400000))

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function upsert(collection: string, id: string, data: object) {
  await db.collection(collection).doc(id).set(data)
  console.log(`  ✓ ${collection}/${id}`)
}

// ─── Lookup Collections ───────────────────────────────────────────────────────

async function seedAreas() {
  console.log('\nSeeding areas...')
  const areas = [
    { id: 'AREA-001', name: 'Koramangala', city: 'Bangalore' },
    { id: 'AREA-002', name: 'HSR Layout', city: 'Bangalore' },
    { id: 'AREA-003', name: 'Indiranagar', city: 'Bangalore' },
    { id: 'AREA-004', name: 'Whitefield', city: 'Bangalore' },
  ]
  for (const { id, ...rest } of areas) {
    await upsert('areas', id, { ...rest, isActive: true, createdAt: now, updatedAt: now })
  }
}

async function seedServices() {
  console.log('\nSeeding services...')
  const services = [
    {
      id: 'SVC-001',
      name: 'Basic Exterior Wash',
      category: 'one_time',
      pricing: { sedan: 299, suv: 399 },
      isSubscription: false,
      isActive: true,
    },
    {
      id: 'SVC-002',
      name: 'Premium Interior + Exterior',
      category: 'one_time',
      pricing: { sedan: 599, suv: 799 },
      isSubscription: false,
      isActive: true,
    },
    {
      id: 'SVC-003',
      name: 'Monthly Plan — 8 Washes',
      category: 'monthly_plan',
      pricing: { sedan: 1499, suv: 1999 },
      isSubscription: true,
      washesIncluded: 8,
      isActive: true,
    },
    {
      id: 'SVC-004',
      name: 'Engine Bay Clean',
      category: 'one_time',
      pricing: { sedan: 499, suv: 499 },
      isSubscription: false,
      isActive: true,
    },
  ]
  for (const { id, ...rest } of services) {
    await upsert('services', id, { ...rest, createdAt: now, updatedAt: now })
  }
}

async function seedVehicleTypes() {
  console.log('\nSeeding vehicleTypes...')
  const types = [
    { id: 'VT-001', name: 'Sedan' },
    { id: 'VT-002', name: 'SUV' },
    { id: 'VT-003', name: 'Hatchback' },
  ]
  for (const { id, ...rest } of types) {
    await upsert('vehicleTypes', id, { ...rest, isActive: true, createdAt: now, updatedAt: now })
  }
}

async function seedTimeSlots() {
  console.log('\nSeeding timeSlots...')
  const slots = [
    { id: 'TS-001', label: 'Morning (7–9 AM)', startTime: '07:00', endTime: '09:00' },
    { id: 'TS-002', label: 'Forenoon (9–11 AM)', startTime: '09:00', endTime: '11:00' },
    { id: 'TS-003', label: 'Afternoon (2–4 PM)', startTime: '14:00', endTime: '16:00' },
    { id: 'TS-004', label: 'Evening (4–6 PM)', startTime: '16:00', endTime: '18:00' },
  ]
  for (const { id, ...rest } of slots) {
    await upsert('timeSlots', id, { ...rest, isActive: true, createdAt: now, updatedAt: now })
  }
}

async function seedBookingStatuses() {
  console.log('\nSeeding bookingStatuses...')
  const statuses = [
    { id: 'BS-001', name: 'Scheduled', sortOrder: 1 },
    { id: 'BS-002', name: 'In Progress', sortOrder: 2 },
    { id: 'BS-003', name: 'Completed', sortOrder: 3 },
    { id: 'BS-004', name: 'Cancelled', sortOrder: 4 },
    { id: 'BS-005', name: 'No Show', sortOrder: 5 },
  ]
  for (const { id, ...rest } of statuses) {
    await upsert('bookingStatuses', id, { ...rest, isActive: true, createdAt: now, updatedAt: now })
  }
}

async function seedPaymentStatuses() {
  console.log('\nSeeding paymentStatuses...')
  const statuses = [
    { id: 'PS-001', name: 'Paid' },
    { id: 'PS-002', name: 'Partially Paid' },
    { id: 'PS-003', name: 'Unpaid' },
    { id: 'PS-004', name: 'Refunded' },
  ]
  for (const { id, ...rest } of statuses) {
    await upsert('paymentStatuses', id, { ...rest, isActive: true, createdAt: now, updatedAt: now })
  }
}

async function seedPaymentModes() {
  console.log('\nSeeding paymentModes...')
  const modes = [
    { id: 'PM-001', name: 'Cash' },
    { id: 'PM-002', name: 'UPI' },
    { id: 'PM-003', name: 'Bank Transfer' },
  ]
  for (const { id, ...rest } of modes) {
    await upsert('paymentModes', id, { ...rest, isActive: true, createdAt: now, updatedAt: now })
  }
}

async function seedLeadSources() {
  console.log('\nSeeding leadSources...')
  const sources = [
    { id: 'LS-001', name: 'WhatsApp' },
    { id: 'LS-002', name: 'Instagram' },
    { id: 'LS-003', name: 'Referral' },
    { id: 'LS-004', name: 'Door-to-Door Canvassing' },
    { id: 'LS-005', name: 'Google' },
  ]
  for (const { id, ...rest } of sources) {
    await upsert('leadSources', id, { ...rest, isActive: true, createdAt: now, updatedAt: now })
  }
}

async function seedComplaintTypes() {
  console.log('\nSeeding complaintTypes...')
  const types = [
    { id: 'CT-001', name: 'Missed Spot / Incomplete Wash' },
    { id: 'CT-002', name: 'Worker Did Not Show Up' },
    { id: 'CT-003', name: 'Minor Scratch / Damage' },
    { id: 'CT-004', name: 'Late Arrival' },
    { id: 'CT-005', name: 'Rude Behaviour' },
  ]
  for (const { id, ...rest } of types) {
    await upsert('complaintTypes', id, { ...rest, isActive: true, createdAt: now, updatedAt: now })
  }
}

// ─── Transactional Data ───────────────────────────────────────────────────────

async function seedCustomers() {
  console.log('\nSeeding customers...')

  await upsert('customers', 'CST-001', {
    fullName: 'Arjun Mehta',
    phone: '9845001122',
    secondaryPhone: null,
    areaId: 'AREA-001',
    areaName: 'Koramangala',
    fullAddress: '14B, 5th Cross, Koramangala 6th Block, Bangalore 560095',
    acquisitionSourceId: 'LS-003',
    acquisitionSourceName: 'Referral',
    notes: 'Prefers morning slots. Two cars.',
    status: 'active',
    createdAt: lastWeek,
    updatedAt: lastWeek,
  })

  await upsert('customers', 'CST-002', {
    fullName: 'Priya Nair',
    phone: '9901234567',
    secondaryPhone: '8099876543',
    areaId: 'AREA-002',
    areaName: 'HSR Layout',
    fullAddress: '22, Sector 2, HSR Layout, Bangalore 560102',
    acquisitionSourceId: 'LS-002',
    acquisitionSourceName: 'Instagram',
    notes: 'Gate code is 4521. Call before arriving.',
    status: 'active',
    createdAt: lastWeek,
    updatedAt: lastWeek,
  })

  await upsert('customers', 'CST-003', {
    fullName: 'Rohan Desai',
    phone: '9731234500',
    secondaryPhone: null,
    areaId: 'AREA-003',
    areaName: 'Indiranagar',
    fullAddress: '7, 100 Feet Road, Indiranagar, Bangalore 560038',
    acquisitionSourceId: 'LS-001',
    acquisitionSourceName: 'WhatsApp',
    notes: '',
    status: 'active',
    createdAt: yesterday,
    updatedAt: yesterday,
  })
}

async function seedVehicles() {
  console.log('\nSeeding vehicles...')

  await upsert('vehicles', 'VEH-001', {
    customerId: 'CST-001',
    registrationNumber: 'KA01AB1234',
    carModel: 'Creta',
    brand: 'Hyundai',
    vehicleTypeId: 'VT-002',
    vehicleTypeName: 'SUV',
    color: 'Pearl White',
    parkingNotes: 'B2 basement slot 14',
    isPrimaryVehicle: true,
    createdAt: lastWeek,
    updatedAt: lastWeek,
  })

  await upsert('vehicles', 'VEH-002', {
    customerId: 'CST-001',
    registrationNumber: 'KA01CD5678',
    carModel: 'City',
    brand: 'Honda',
    vehicleTypeId: 'VT-001',
    vehicleTypeName: 'Sedan',
    color: 'Lunar Silver',
    parkingNotes: 'Street parking in front of building',
    isPrimaryVehicle: false,
    createdAt: lastWeek,
    updatedAt: lastWeek,
  })

  await upsert('vehicles', 'VEH-003', {
    customerId: 'CST-002',
    registrationNumber: 'KA05EF9012',
    carModel: 'Nexon EV',
    brand: 'Tata',
    vehicleTypeId: 'VT-002',
    vehicleTypeName: 'SUV',
    color: 'Intensi-Teal',
    parkingNotes: 'Open terrace parking',
    isPrimaryVehicle: true,
    createdAt: lastWeek,
    updatedAt: lastWeek,
  })
}

async function seedWorkers() {
  console.log('\nSeeding workers...')

  await upsert('workers', 'WRK-001', {
    workerName: 'Suresh Kumar',
    phone: '9876540001',
    primaryAreaId: 'AREA-001',
    primaryAreaName: 'Koramangala',
    joiningDate: Timestamp.fromDate(new Date('2024-01-10')),
    status: 'active',
    payout: { type: 'per_job', rate: 80 },
    notes: 'Reliable. Handles premium cleans well.',
    createdAt: lastWeek,
    updatedAt: lastWeek,
  })

  await upsert('workers', 'WRK-002', {
    workerName: 'Ramesh Yadav',
    phone: '9876540002',
    primaryAreaId: 'AREA-002',
    primaryAreaName: 'HSR Layout',
    joiningDate: Timestamp.fromDate(new Date('2024-03-15')),
    status: 'active',
    payout: { type: 'per_job', rate: 75 },
    notes: 'Good speed. Needs reminder on mirrors.',
    createdAt: lastWeek,
    updatedAt: lastWeek,
  })
}

async function seedBookings() {
  console.log('\nSeeding bookings...')

  const today = new Date().toISOString().slice(0, 10)
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  await upsert('bookings', 'BKG-001', {
    customerId: 'CST-001',
    customerName: 'Arjun Mehta',
    customerPhone: '9845001122',
    vehicleId: 'VEH-001',
    vehicleLabel: 'Hyundai Creta (KA01AB1234)',
    serviceDate: today,
    timeSlotId: 'TS-001',
    timeSlotLabel: 'Morning (7–9 AM)',
    bookingStatusId: 'BS-001',
    bookingStatusName: 'Scheduled',
    sourceId: 'LS-003',
    sourceName: 'Referral',
    assignedWorkerId: 'WRK-001',
    assignedWorkerName: 'Suresh Kumar',
    areaId: 'AREA-001',
    areaName: 'Koramangala',
    pricing: { basePrice: 399, discountAmount: 0, addonTotal: 0, finalPrice: 399 },
    items: [
      {
        serviceId: 'SVC-001',
        serviceName: 'Basic Exterior Wash',
        quantity: 1,
        unitPrice: 399,
        lineTotal: 399,
      },
    ],
    times: { scheduledStartAt: null, actualStartAt: null, actualEndAt: null },
    payment: {
      amountPaid: 0,
      amountDue: 399,
      paymentStatusId: 'PS-003',
      paymentStatusName: 'Unpaid',
      followUpRequired: true,
    },
    complaint: { count: 0, hasOpenComplaint: false },
    notes: '',
    createdAt: now,
    updatedAt: now,
  })

  await upsert('bookings', 'BKG-002', {
    customerId: 'CST-002',
    customerName: 'Priya Nair',
    customerPhone: '9901234567',
    vehicleId: 'VEH-003',
    vehicleLabel: 'Tata Nexon EV (KA05EF9012)',
    serviceDate: yesterdayStr,
    timeSlotId: 'TS-002',
    timeSlotLabel: 'Forenoon (9–11 AM)',
    bookingStatusId: 'BS-003',
    bookingStatusName: 'Completed',
    sourceId: 'LS-002',
    sourceName: 'Instagram',
    assignedWorkerId: 'WRK-002',
    assignedWorkerName: 'Ramesh Yadav',
    areaId: 'AREA-002',
    areaName: 'HSR Layout',
    pricing: { basePrice: 799, discountAmount: 0, addonTotal: 0, finalPrice: 799 },
    items: [
      {
        serviceId: 'SVC-002',
        serviceName: 'Premium Interior + Exterior',
        quantity: 1,
        unitPrice: 799,
        lineTotal: 799,
      },
    ],
    times: {
      scheduledStartAt: Timestamp.fromDate(new Date(`${yesterdayStr}T09:00:00`)),
      actualStartAt: Timestamp.fromDate(new Date(`${yesterdayStr}T09:10:00`)),
      actualEndAt: Timestamp.fromDate(new Date(`${yesterdayStr}T10:35:00`)),
    },
    payment: {
      amountPaid: 799,
      amountDue: 0,
      paymentStatusId: 'PS-001',
      paymentStatusName: 'Paid',
      followUpRequired: false,
    },
    complaint: { count: 1, hasOpenComplaint: true },
    notes: 'Customer requested extra attention on the dashboard.',
    createdAt: yesterday,
    updatedAt: yesterday,
  })

  await upsert('bookings', 'BKG-003', {
    customerId: 'CST-003',
    customerName: 'Rohan Desai',
    customerPhone: '9731234500',
    vehicleId: 'VEH-002',
    vehicleLabel: 'Honda City (KA01CD5678)',
    serviceDate: today,
    timeSlotId: 'TS-003',
    timeSlotLabel: 'Afternoon (2–4 PM)',
    bookingStatusId: 'BS-001',
    bookingStatusName: 'Scheduled',
    sourceId: 'LS-001',
    sourceName: 'WhatsApp',
    assignedWorkerId: 'WRK-001',
    assignedWorkerName: 'Suresh Kumar',
    areaId: 'AREA-003',
    areaName: 'Indiranagar',
    pricing: { basePrice: 299, discountAmount: 50, addonTotal: 0, finalPrice: 249 },
    items: [
      {
        serviceId: 'SVC-001',
        serviceName: 'Basic Exterior Wash',
        quantity: 1,
        unitPrice: 299,
        lineTotal: 249,
      },
    ],
    times: { scheduledStartAt: null, actualStartAt: null, actualEndAt: null },
    payment: {
      amountPaid: 0,
      amountDue: 249,
      paymentStatusId: 'PS-003',
      paymentStatusName: 'Unpaid',
      followUpRequired: true,
    },
    complaint: { count: 0, hasOpenComplaint: false },
    notes: 'First time customer. Applied 50 Rs welcome discount.',
    createdAt: now,
    updatedAt: now,
  })
}

async function seedPayments() {
  console.log('\nSeeding payments...')

  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  await upsert('payments', 'PAY-001', {
    bookingId: 'BKG-002',
    customerId: 'CST-002',
    customerName: 'Priya Nair',
    serviceDate: yesterdayStr,
    amountReceived: 799,
    paymentDate: yesterday,
    paymentModeId: 'PM-002',
    paymentModeName: 'UPI',
    paymentStatusId: 'PS-001',
    paymentStatusName: 'Paid',
    collectedByWorkerId: 'WRK-002',
    collectedByWorkerName: 'Ramesh Yadav',
    followUpRequired: false,
    upiTransactionRef: 'UPI-TXN-987654321',
    notes: '',
    createdAt: yesterday,
    updatedAt: yesterday,
  })

  const today = new Date().toISOString().slice(0, 10)

  await upsert('payments', 'PAY-002', {
    bookingId: 'BKG-001',
    customerId: 'CST-001',
    customerName: 'Arjun Mehta',
    serviceDate: today,
    amountReceived: 0,
    paymentDate: null,
    paymentModeId: 'PM-001',
    paymentModeName: 'Cash',
    paymentStatusId: 'PS-003',
    paymentStatusName: 'Unpaid',
    collectedByWorkerId: null,
    collectedByWorkerName: null,
    followUpRequired: true,
    upiTransactionRef: null,
    notes: 'Collect after job done.',
    createdAt: now,
    updatedAt: now,
  })
}

async function seedComplaints() {
  console.log('\nSeeding complaints...')

  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  await upsert('complaints', 'CMP-001', {
    bookingId: 'BKG-002',
    customerId: 'CST-002',
    customerName: 'Priya Nair',
    workerId: 'WRK-002',
    workerName: 'Ramesh Yadav',
    complaintDate: yesterday,
    complaintTypeId: 'CT-001',
    complaintTypeName: 'Missed Spot / Incomplete Wash',
    details: 'Dashboard area was left dusty. Customer sent photos over WhatsApp.',
    resolutionType: 'Redo',
    resolutionNotes: '',
    resolutionStatus: 'open',
    followUpComplete: false,
    rootCause: 'Worker rushed due to tight back-to-back schedule.',
    createdAt: yesterday,
    updatedAt: yesterday,
  })
}

async function seedLeads() {
  console.log('\nSeeding leads...')

  await upsert('leads', 'LED-001', {
    leadDate: yesterday,
    prospectName: 'Kavitha Reddy',
    phone: '9611223344',
    areaId: 'AREA-004',
    areaName: 'Whitefield',
    interestedServiceId: 'SVC-003',
    interestedServiceName: 'Monthly Plan — 8 Washes',
    sourceId: 'LS-004',
    sourceName: 'Door-to-Door Canvassing',
    followUpStatus: 'follow_up_needed',
    conversionStatus: 'unconverted',
    convertedCustomerId: null,
    convertedBookingId: null,
    notes: 'Has a Swift and an Ertiga. Very interested in monthly plan.',
    createdAt: yesterday,
    updatedAt: yesterday,
  })

  await upsert('leads', 'LED-002', {
    leadDate: lastWeek,
    prospectName: 'Vikram Sharma',
    phone: '9922334455',
    areaId: 'AREA-001',
    areaName: 'Koramangala',
    interestedServiceId: 'SVC-001',
    interestedServiceName: 'Basic Exterior Wash',
    sourceId: 'LS-002',
    sourceName: 'Instagram',
    followUpStatus: 'contacted',
    conversionStatus: 'unconverted',
    convertedCustomerId: null,
    convertedBookingId: null,
    notes: 'Responded to DM. Wants to try once before committing.',
    createdAt: lastWeek,
    updatedAt: lastWeek,
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Starting Firestore seed...')
  console.log(`Project: ${process.env.FIREBASE_PROJECT_ID}`)

  await seedAreas()
  await seedServices()
  await seedVehicleTypes()
  await seedTimeSlots()
  await seedBookingStatuses()
  await seedPaymentStatuses()
  await seedPaymentModes()
  await seedLeadSources()
  await seedComplaintTypes()
  await seedCustomers()
  await seedVehicles()
  await seedWorkers()
  await seedBookings()
  await seedPayments()
  await seedComplaints()
  await seedLeads()

  console.log('\nSeed complete.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
