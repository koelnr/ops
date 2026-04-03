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
            <TableHead>Customer ID</TableHead>
            <TableHead className="text-right">Amount Due</TableHead>
            <TableHead>Mode</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-mono text-xs">{payment.id}</TableCell>
              <TableCell className="font-mono text-xs">
                {payment.bookingId}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {payment.customerId}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatCurrency(payment.amount)}
              </TableCell>
              <TableCell>
                <span className="capitalize text-sm">
                  {payment.mode.replace(/_/g, " ")}
                </span>
              </TableCell>
              <TableCell>
                <StatusBadge status={payment.status} />
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(payment.date)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
