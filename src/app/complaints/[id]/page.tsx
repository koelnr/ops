import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { getComplaints, getBookings, getCustomers, getWorkers, getLookupContext } from "@/lib/db/adapters";
import { formatDate } from "@/lib/format";
import { ComplaintActions } from "@/components/actions/complaint-actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ComplaintDetailPage({ params }: Props) {
  const { id } = await params;

  const [complaints, bookings, customers, workers, ctx] = await Promise.all([
    getComplaints().catch(() => []),
    getBookings().catch(() => []),
    getCustomers().catch(() => []),
    getWorkers().catch(() => []),
    getLookupContext().catch(() => null),
  ]);

  const complaint = complaints.find((c) => c.complaint_id === id);
  if (!complaint) notFound();
  if (!ctx)
    return (
      <div className="p-6 text-muted-foreground text-sm">
        Failed to load lookups.
      </div>
    );

  const booking = bookings.find((b) => b.booking_id === complaint.booking_id);
  const customer = booking
    ? customers.find((c) => c.customer_id === booking.customer_id)
    : null;
  const worker = workers.find(
    (w) => w.worker_id === complaint.assigned_worker_id,
  );
  const complaintType = ctx.complaintTypes.get(complaint.complaint_type_id);
  const workerOptions = workers.map((w) => ({
    value: w.worker_id,
    label: w.worker_name,
  }));
  const resolutionStatusOptions = [
    { value: "Open", label: "Open" },
    { value: "Monitoring", label: "Monitoring" },
    { value: "Resolved", label: "Resolved" },
    { value: "Escalated", label: "Escalated" },
    { value: "Rewash Scheduled", label: "Rewash Scheduled" },
    { value: "Closed", label: "Closed" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/complaints">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">
              {complaintType?.label ?? "Complaint"}
            </h1>
            <StatusBadge status={complaint.resolution_status} />
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            {complaint.complaint_id}
          </p>
        </div>
        <ComplaintActions
          complaintId={complaint.complaint_id}
          currentStatus={complaint.resolution_status}
          currentWorkerId={complaint.assigned_worker_id}
          statusOptions={resolutionStatusOptions}
          workerOptions={workerOptions}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Issue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>{complaintType?.label ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{formatDate(complaint.complaint_date)}</span>
            </div>
            {complaint.root_cause && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Root Cause</span>
                <span>{complaint.root_cause}</span>
              </div>
            )}
            {complaint.details && (
              <p className="text-muted-foreground pt-1 border-t">
                {complaint.details}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Linked Records</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {customer && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Customer</span>
                <Link
                  href={`/customers/${customer.customer_id}`}
                  className="font-medium hover:underline"
                >
                  {customer.full_name}
                </Link>
              </div>
            )}
            {booking && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Booking</span>
                <Link
                  href={`/bookings/${booking.booking_id}`}
                  className="font-mono text-xs hover:underline"
                >
                  {booking.booking_id} · {formatDate(booking.service_date)}
                </Link>
              </div>
            )}
            {worker && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Worker</span>
                <Link
                  href={`/workers/${worker.worker_id}`}
                  className="hover:underline"
                >
                  {worker.worker_name}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(complaint.resolution_type || complaint.resolution_notes) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Resolution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {complaint.resolution_type && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span>{complaint.resolution_type}</span>
              </div>
            )}
            {complaint.resolution_notes && (
              <p className="text-muted-foreground">
                {complaint.resolution_notes}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
