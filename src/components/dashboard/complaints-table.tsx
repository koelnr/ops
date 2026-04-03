import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Complaint } from "@/lib/sheets/types";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "./status-badge";

interface ComplaintsTableProps {
  complaints: Complaint[];
  limit?: number;
}

export function ComplaintsTable({
  complaints,
  limit = 10,
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

  const sorted = [...complaints]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-30">ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Booking ID</TableHead>
            <TableHead>Worker</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Issue</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((complaint) => (
            <TableRow key={complaint.complaintId}>
              <TableCell className="font-mono text-xs">
                {complaint.complaintId}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {complaint.customerName}
              </TableCell>
              <TableCell className="font-mono text-xs">
                {complaint.bookingId}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {complaint.workerAssigned || "—"}
              </TableCell>
              <TableCell className="text-sm">
                {complaint.complaintType || "—"}
              </TableCell>
              <TableCell className="max-w-60">
                <p className="text-sm truncate" title={complaint.complaintDetails}>
                  {complaint.complaintDetails}
                </p>
              </TableCell>
              <TableCell>
                {complaint.resolutionStatus ? (
                  <StatusBadge status={complaint.resolutionStatus} />
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(complaint.date)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
