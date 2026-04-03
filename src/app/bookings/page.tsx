import { getBookings } from "@/lib/sheets/bookings"
import { getWorkers } from "@/lib/sheets/workers"
import { BookingsView } from "@/components/views/bookings-view"

export default async function BookingsPage() {
  const [bookings, workers] = await Promise.all([
    getBookings().catch((err) => { console.error("[bookings page]", err); return []; }),
    getWorkers().catch((err) => { console.error("[bookings page] workers", err); return []; }),
  ])
  return <BookingsView bookings={bookings} workers={workers} />
}
