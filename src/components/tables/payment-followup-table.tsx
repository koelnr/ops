import Link from "next/link";
import { Phone } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { RowActionsPayment } from "@/components/actions/row-actions-payment";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PendingPaymentView, SelectOption, Payment } from "@/lib/domain";

interface PaymentFollowupTableProps {
  views: PendingPaymentView[];
  paymentsByBooking: Record<string, Payment[]>;
  paymentModes: SelectOption[];
  paymentStatuses: SelectOption[];
}

export function PaymentFollowupTable({
  views,
  paymentsByBooking,
  paymentModes,
  paymentStatuses,
}: PaymentFollowupTableProps) {
  if (views.length === 0) {
    return <EmptyState message="No pending payments" description="All bookings are fully paid" />;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Service Date</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Due</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-32"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {views.map(({ booking, customerName, customerPhone, serviceDate, finalPrice, amountPaid, amountDue, followUpRequired, paymentStatusLabel }) => {
            const bookingPayments = paymentsByBooking[booking.booking_id] ?? [];
            const latestPayment = bookingPayments.at(-1);

            return (
              <TableRow key={booking.booking_id}>
                <TableCell>
                  <div>
                    <Link
                      href={`/bookings/${booking.booking_id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {customerName || "—"}
                    </Link>
                    {customerPhone && (
                      <a
                        href={`tel:${customerPhone}`}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-0.5"
                      >
                        <Phone className="h-3 w-3" />
                        {customerPhone}
                      </a>
                    )}
                    {followUpRequired && (
                      <Badge variant="outline" className="mt-1 text-xs bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400">
                        Follow-up
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(serviceDate)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {formatCurrency(finalPrice)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                  {formatCurrency(amountPaid)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm font-medium text-orange-600 dark:text-orange-400">
                  {formatCurrency(amountDue)}
                </TableCell>
                <TableCell>
                  {paymentStatusLabel ? (
                    <StatusBadge status={paymentStatusLabel} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <RowActionsPayment
                    bookingId={booking.booking_id}
                    latestPaymentId={latestPayment?.payment_id ?? ""}
                    amountDue={amountDue}
                    followUpRequired={followUpRequired}
                    paymentModes={paymentModes}
                    paymentStatuses={paymentStatuses}
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
