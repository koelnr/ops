import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Booking } from "@/lib/sheets/types";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "./status-badge";

interface BookingsTableProps {
  bookings: Booking[];
  showDate?: boolean;
}

export function BookingsTable({
  bookings,
  showDate = false,
}: BookingsTableProps) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No bookings scheduled for today.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-30">Booking ID</TableHead>
            {showDate && <TableHead>Service Date</TableHead>}
            <TableHead>Customer</TableHead>
            <TableHead>Time Slot</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Assigned Worker</TableHead>
            <TableHead>Booking Status</TableHead>
            <TableHead>Payment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.bookingId}>
              <TableCell className="font-mono text-xs">
                {booking.bookingId}
              </TableCell>
              {showDate && (
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(booking.serviceDate)}
                </TableCell>
              )}
              <TableCell>
                <div className="font-medium text-sm">{booking.customerName}</div>
                <div className="text-xs text-muted-foreground">
                  {booking.phoneNumber}
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {booking.timeSlot || "—"}
              </TableCell>
              <TableCell>
                <span className="text-sm">{booking.servicePackage}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm">{booking.vehicleType}</span>
              </TableCell>
              <TableCell className="text-sm">
                {booking.assignedWorker || "—"}
              </TableCell>
              <TableCell>
                <StatusBadge status={booking.bookingStatus} />
              </TableCell>
              <TableCell>
                <StatusBadge status={booking.paymentStatus} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
