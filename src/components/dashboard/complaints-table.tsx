import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  Complaint,
  Booking,
  Customer,
  SerializedLookupContext,
} from "@/lib/domain";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "./status-badge";

interface ComplaintsTableProps {
  complaints: Complaint[];
  bookings: Booking[];
  customers: Customer[];
  serializedCtx: SerializedLookupContext | null;
}

export function ComplaintsTable({
  complaints,
  bookings,
  customers,
  serializedCtx,
}: ComplaintsTableProps) {
  if (complaints.length === 0) {
    return (
      <div className="rounded-md border">
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          No complaints on record.
        </div>
      </div>
    );
  }

  const bookingMap = new Map(bookings.map((b) => [b.booking_id, b]));
  const customerMap = new Map(customers.map((c) => [c.customer_id, c]));
  const typeMap = serializedCtx
    ? new Map(serializedCtx.complaintTypes.map((t) => [t.complaint_type_id, t]))
    : null;

  const sorted = [...complaints].sort((a, b) =>
    b.complaint_date.localeCompare(a.complaint_date),
  );

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-30">ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Booking</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Issue</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((complaint) => {
            const booking = bookingMap.get(complaint.booking_id);
            const customer = booking
              ? customerMap.get(booking.customer_id)
              : undefined;
            const type = typeMap?.get(complaint.complaint_type_id);
            return (
              <TableRow key={complaint.complaint_id}>
                <TableCell className="font-mono text-xs">
                  {complaint.complaint_id}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {customer?.full_name ?? "—"}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {complaint.booking_id || "—"}
                </TableCell>
                <TableCell className="text-sm">{type?.label ?? "—"}</TableCell>
                <TableCell className="max-w-60">
                  <p className="text-sm truncate" title={complaint.details}>
                    {complaint.details}
                  </p>
                </TableCell>
                <TableCell>
                  {complaint.resolution_status ? (
                    <StatusBadge status={complaint.resolution_status} />
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(complaint.complaint_date)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
