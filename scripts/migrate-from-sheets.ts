/**
 * Migration placeholder: Google Sheets → Firestore
 *
 * DO NOT RUN until Firestore is validated with seed data.
 *
 * Steps before running:
 * 1. Run `npx tsx scripts/seed-firestore.ts` and verify data in Firebase Console
 * 2. Verify all Firestore query/write helpers work correctly from the app
 * 3. Map all Sheets IDs to Firestore document IDs (lookup tables first, then transactional)
 * 4. Implement each migrate* function below, then run them in order
 */

// TODO: import Sheets fetch functions when ready
// import { getAreas } from '../src/lib/sheets/lookups'
// import { getCustomers } from '../src/lib/sheets/customers'
// etc.

// TODO: import Firestore write helpers when ready
// import { createCustomer } from '../src/lib/db/modules/customers'
// import { createBooking } from '../src/lib/db/modules/bookings'
// etc.

// ─── Lookup Table Migration ───────────────────────────────────────────────────
// Migrate these first — transactional docs reference their IDs.

async function migrateAreas(): Promise<void> {
  // TODO:
  // 1. Fetch rows from Sheets "Lists" tab (areas section)
  // 2. For each row, map fields to AreaDoc shape
  // 3. Write to Firestore `areas` collection using the Sheets ID as the doc ID
  throw new Error('Not implemented')
}

async function migrateServices(): Promise<void> {
  // TODO:
  // 1. Fetch rows from Sheets "Lists" tab (services section)
  // 2. Map to ServiceDoc: resolve category ('one_time' | 'monthly_plan'), pricing object
  // 3. Write to Firestore `services` collection
  throw new Error('Not implemented')
}

async function migrateVehicleTypes(): Promise<void> {
  // TODO: Fetch from Sheets Lists tab → write to `vehicleTypes`
  throw new Error('Not implemented')
}

async function migrateTimeSlots(): Promise<void> {
  // TODO: Fetch from Sheets Lists tab → write to `timeSlots`
  throw new Error('Not implemented')
}

async function migrateBookingStatuses(): Promise<void> {
  // TODO: Fetch from Sheets Lists tab → write to `bookingStatuses`
  throw new Error('Not implemented')
}

async function migratePaymentStatuses(): Promise<void> {
  // TODO: Fetch from Sheets Lists tab → write to `paymentStatuses`
  throw new Error('Not implemented')
}

async function migratePaymentModes(): Promise<void> {
  // TODO: Fetch from Sheets Lists tab → write to `paymentModes`
  throw new Error('Not implemented')
}

async function migrateLeadSources(): Promise<void> {
  // TODO: Fetch from Sheets Lists tab → write to `leadSources`
  throw new Error('Not implemented')
}

async function migrateComplaintTypes(): Promise<void> {
  // TODO: Fetch from Sheets Lists tab → write to `complaintTypes`
  throw new Error('Not implemented')
}

// ─── Transactional Data Migration ────────────────────────────────────────────
// Migrate after all lookup collections are complete.

async function migrateCustomers(): Promise<void> {
  // TODO:
  // 1. Fetch all rows from Sheets "Customers" tab
  // 2. Map Customer (snake_case) → CustomerDoc (camelCase)
  //    - full_name → fullName
  //    - area_id → areaId + areaName (resolve from migrated areas map)
  //    - acquisition_source_id → acquisitionSourceId + acquisitionSourceName
  //    - created_at → Timestamp
  // 3. Use customer_id as Firestore doc ID
  throw new Error('Not implemented')
}

async function migrateVehicles(): Promise<void> {
  // TODO:
  // 1. Fetch all rows from Sheets "Vehicles" tab (if separate) or derive from Bookings
  // 2. Map to VehicleDoc, resolve vehicleTypeName from migrated vehicleTypes map
  // 3. Use vehicle_id as doc ID
  throw new Error('Not implemented')
}

async function migrateWorkers(): Promise<void> {
  // TODO:
  // 1. Fetch all rows from Sheets "Workers" tab
  // 2. Map to WorkerDoc:
  //    - default_payout_type + default_payout_rate → payout: { type, rate }
  //    - joining_date → Timestamp | null
  //    - Resolve primaryAreaName from migrated areas
  // 3. Use worker_id as doc ID
  throw new Error('Not implemented')
}

async function migrateBookings(): Promise<void> {
  // TODO:
  // 1. Fetch all rows from Sheets "Bookings" tab
  // 2. Fetch BookingServices rows and group by booking_id
  // 3. Fetch Payments rows and group by booking_id to build payment summary
  // 4. Fetch Complaints rows and group by booking_id to build complaint summary
  // 5. Map to BookingDoc:
  //    - Resolve all label fields (workerName, areaName, timeSlotLabel, etc.)
  //    - Build items[] from BookingService rows
  //    - Build pricing{} from base_price, discount_amount, addon_total, final_price
  //    - Build times{} from scheduled_start_at, actual_start_at, actual_end_at
  //    - Build payment{} aggregate from payments grouped by bookingId
  //    - Build complaint{} aggregate from complaints count
  // 6. Use booking_id as doc ID
  throw new Error('Not implemented')
}

async function migratePayments(): Promise<void> {
  // TODO:
  // 1. Fetch all rows from Sheets "Payments" tab
  // 2. Map to PaymentDoc, resolve customerName + serviceDate from booking
  // 3. Use payment_id as doc ID
  throw new Error('Not implemented')
}

async function migrateComplaints(): Promise<void> {
  // TODO:
  // 1. Fetch all rows from Sheets "Complaints" tab
  // 2. Map to ComplaintDoc, resolve customerName + workerName
  // 3. Use complaint_id as doc ID
  throw new Error('Not implemented')
}

async function migrateLeads(): Promise<void> {
  // TODO:
  // 1. Fetch all rows from Sheets "Leads" tab
  // 2. Map to LeadDoc, resolve areaName + interestedServiceName + sourceName
  // 3. Use lead_id as doc ID
  throw new Error('Not implemented')
}

// ─── Orchestration ────────────────────────────────────────────────────────────

async function runMigration(): Promise<void> {
  console.log('Migration starting...')
  console.log('WARNING: This will overwrite Firestore data. Ensure you are on the correct project.')

  // Step 1: lookups (order matters — transactional data references these)
  await migrateAreas()
  await migrateServices()
  await migrateVehicleTypes()
  await migrateTimeSlots()
  await migrateBookingStatuses()
  await migratePaymentStatuses()
  await migratePaymentModes()
  await migrateLeadSources()
  await migrateComplaintTypes()

  // Step 2: master entities
  await migrateCustomers()
  await migrateVehicles()
  await migrateWorkers()

  // Step 3: transactional (depend on customers + workers)
  await migrateBookings()
  await migratePayments()
  await migrateComplaints()
  await migrateLeads()

  console.log('Migration complete.')
}

export { runMigration }
