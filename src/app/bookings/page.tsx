import { getBookings } from "@/lib/sheets/bookings"
import { BookingsView } from "@/components/views/bookings-view"

export default async function BookingsPage() {
  const bookings = await getBookings().catch(() => [])
  return <BookingsView bookings={bookings} />
}
