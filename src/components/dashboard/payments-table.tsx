import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Payment } from "@/lib/sheets/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "./status-badge";

interface PaymentsTableProps {
  payments: Payment[];
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  if (payments.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No pending payments.
        </div>
      </div>
    );
  }

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
          {payments.map((payment) => (
            <TableRow key={payment.paymentId}>
              <TableCell className="font-mono text-xs">
                {payment.paymentId}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {payment.bookingId}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {payment.customerName}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatCurrency(payment.amountDue)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatCurrency(payment.amountReceived)}
              </TableCell>
              <TableCell>
                <span className="text-sm">{payment.paymentMode}</span>
              </TableCell>
              <TableCell>
                <StatusBadge status={payment.paymentStatus} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(payment.paymentDate)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
