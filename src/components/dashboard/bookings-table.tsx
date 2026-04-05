import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Booking, Customer, SerializedLookupContext } from "@/lib/domain";
import { formatDate, formatCurrency } from "@/lib/format";
import { StatusBadge } from "./status-badge";

interface BookingsTableProps {
  bookings: Booking[];
  customers: Customer[];
  serializedCtx: SerializedLookupContext | null;
}

export function BookingsTable({
  bookings,
  customers,
  serializedCtx,
}: BookingsTableProps) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No upcoming bookings.
        </div>
      </div>
    );
  }

  const customerMap = new Map(customers.map((c) => [c.customer_id, c]));
  const statusMap = serializedCtx
    ? new Map(
        serializedCtx.bookingStatuses.map((s) => [s.booking_status_id, s]),
      )
    : null;
  const timeSlotMap = serializedCtx
    ? new Map(serializedCtx.timeSlots.map((t) => [t.time_slot_id, t]))
    : null;

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-30">Booking ID</TableHead>
            <TableHead>Service Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Time Slot</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => {
            const customer = customerMap.get(booking.customer_id);
            const status = statusMap?.get(booking.booking_status_id);
            const timeSlot = timeSlotMap?.get(booking.time_slot_id);
            return (
              <TableRow key={booking.booking_id}>
                <TableCell className="font-mono text-xs">
                  {booking.booking_id}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(booking.service_date)}
                </TableCell>
                <TableCell>
                  <div className="font-medium text-sm">
                    {customer?.full_name ?? "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {customer?.phone ?? ""}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {timeSlot?.label ?? "—"}
                </TableCell>
                <TableCell className="text-sm tabular-nums">
                  {booking.final_price > 0
                    ? formatCurrency(booking.final_price)
                    : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={status?.label ?? booking.booking_status_id}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
