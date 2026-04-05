import Link from "next/link";
import { AlertCircle, Phone } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { RowActionsBooking } from "@/components/actions/row-actions-booking";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency } from "@/lib/format";
import type { TodayJobView, SelectOption } from "@/lib/domain";

interface TodayJobsTableProps {
  jobs: TodayJobView[];
  statusOptions: SelectOption[];
  workerOptions: SelectOption[];
  paymentModes: SelectOption[];
  paymentStatuses: SelectOption[];
  complaintTypes: SelectOption[];
}

export function TodayJobsTable({
  jobs,
  statusOptions,
  workerOptions,
  paymentModes,
  paymentStatuses,
  complaintTypes,
}: TodayJobsTableProps) {
  if (jobs.length === 0) {
    return <EmptyState message="No jobs scheduled for today" />;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">Slot</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Area</TableHead>
            <TableHead>Worker</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Due</TableHead>
            <TableHead className="w-32"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map(
            ({
              booking,
              customerName,
              customerPhone,
              areaName,
              timeSlotLabel,
              workerName,
              bookingStatusLabel,
              finalPrice,
              amountDue,
              hasOpenComplaint,
            }) => (
              <TableRow key={booking.booking_id}>
                <TableCell className="font-medium text-sm">
                  {timeSlotLabel || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-2">
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
                    </div>
                    {hasOpenComplaint && (
                      <AlertCircle className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {areaName || "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {workerName || (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={bookingStatusLabel} />
                </TableCell>
                <TableCell className="text-right tabular-nums text-sm">
                  {formatCurrency(finalPrice)}
                </TableCell>
                <TableCell
                  className={`text-right tabular-nums text-sm ${amountDue > 0 ? "text-orange-600 dark:text-orange-400 font-medium" : "text-muted-foreground"}`}
                >
                  {amountDue > 0 ? formatCurrency(amountDue) : "—"}
                </TableCell>
                <TableCell>
                  <RowActionsBooking
                    bookingId={booking.booking_id}
                    bookingStatusId={booking.booking_status_id}
                    currentWorkerId={booking.assigned_worker_id}
                    amountDue={amountDue}
                    statusOptions={statusOptions}
                    workerOptions={workerOptions}
                    paymentModes={paymentModes}
                    paymentStatuses={paymentStatuses}
                    complaintTypes={complaintTypes}
                  />
                </TableCell>
              </TableRow>
            ),
          )}
        </TableBody>
      </Table>
    </div>
  );
}
