import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  Payment,
  Booking,
  Customer,
  SerializedLookupContext,
} from "@/lib/domain";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "./status-badge";

interface PaymentsTableProps {
  payments: Payment[];
  bookings: Booking[];
  customers: Customer[];
  serializedCtx: SerializedLookupContext | null;
}

export function PaymentsTable({
  payments,
  bookings,
  customers,
  serializedCtx,
}: PaymentsTableProps) {
  if (payments.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No pending payments.
        </div>
      </div>
    );
  }

  const bookingMap = new Map(bookings.map((b) => [b.booking_id, b]));
  const customerMap = new Map(customers.map((c) => [c.customer_id, c]));
  const statusMap = serializedCtx
    ? new Map(
        serializedCtx.paymentStatuses.map((s) => [s.payment_status_id, s]),
      )
    : null;
  const modeMap = serializedCtx
    ? new Map(serializedCtx.paymentModes.map((m) => [m.payment_mode_id, m]))
    : null;

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-30">Payment ID</TableHead>
            <TableHead>Booking ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead className="text-right">Amount Due</TableHead>
            <TableHead className="text-right">Received</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => {
            const booking = bookingMap.get(payment.booking_id);
            const customer = booking
              ? customerMap.get(booking.customer_id)
              : undefined;
            const status = statusMap?.get(payment.payment_status_id);
            const mode = modeMap?.get(payment.payment_mode_id);
            return (
              <TableRow key={payment.payment_id}>
                <TableCell className="font-mono text-xs">
                  {payment.payment_id}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {payment.booking_id}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {customer?.full_name ?? "—"}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {booking ? formatCurrency(booking.final_price) : "—"}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {formatCurrency(payment.amount_received)}
                </TableCell>
                <TableCell>
                  <span className="text-sm">{mode?.label ?? "—"}</span>
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={status?.label ?? payment.payment_status_id}
                  />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(payment.payment_date)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
