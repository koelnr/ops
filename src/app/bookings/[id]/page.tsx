import { notFound } from "next/navigation";
import {
  getBookings,
  getBookingServices,
  getPayments,
  getComplaints,
  getWorkers,
  getVehicles,
  getCustomers,
  getLookupContext,
} from "@/lib/db/adapters";
import { getBookingResolvedView } from "@/lib/selectors";
import { BookingDetailView } from "@/components/details/booking-detail-view";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params;

  const [
    bookings,
    bookingServices,
    payments,
    complaints,
    workers,
    vehicles,
    customers,
    ctx,
  ] = await Promise.all([
    getBookings().catch(() => []),
    getBookingServices().catch(() => []),
    getPayments().catch(() => []),
    getComplaints().catch(() => []),
    getWorkers().catch(() => []),
    getVehicles().catch(() => []),
    getCustomers().catch(() => []),
    getLookupContext().catch(() => null),
  ]);

  const booking = bookings.find((b) => b.booking_id === id);
  if (!booking) notFound();

  if (!ctx) {
    return (
      <div className="p-6 text-muted-foreground">
        Failed to load lookup data.
      </div>
    );
  }

  const view = getBookingResolvedView(
    booking,
    ctx,
    customers,
    vehicles,
    workers,
    bookingServices,
    payments,
  );

  const bookingComplaints = complaints.filter((c) => c.booking_id === id);

  return <BookingDetailView view={view} complaints={bookingComplaints} />;
}
