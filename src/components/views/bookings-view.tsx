"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Booking } from "@/lib/sheets/types";
import { mutate } from "@/lib/mutate";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MoreHorizontal } from "lucide-react";

const STATUS_OPTIONS = [
  { label: "New Inquiry", value: "New Inquiry" },
  { label: "Confirmed", value: "Confirmed" },
  { label: "Assigned", value: "Assigned" },
  { label: "In Progress", value: "In Progress" },
  { label: "Completed", value: "Completed" },
  { label: "Cancelled", value: "Cancelled" },
  { label: "Rescheduled", value: "Rescheduled" },
  { label: "Payment Pending", value: "Payment Pending" },
];

const VEHICLE_OPTIONS = [
  { label: "Hatchback", value: "Hatchback" },
  { label: "Sedan", value: "Sedan" },
  { label: "SUV", value: "SUV" },
  { label: "Luxury", value: "Luxury" },
];

const PACKAGE_OPTIONS = [
  { label: "Exterior Wash", value: "Exterior Wash" },
  { label: "Exterior + Interior Basic", value: "Exterior + Interior Basic" },
  { label: "Monthly Plan", value: "Monthly Plan" },
];

const PAYMENT_STATUS_OPTIONS = [
  { label: "Pending", value: "Pending" },
  { label: "Paid", value: "Paid" },
  { label: "Partially Paid", value: "Partially Paid" },
  { label: "Failed", value: "Failed" },
  { label: "Refunded", value: "Refunded" },
];

interface BookingsViewProps {
  bookings: Booking[];
}

export function BookingsView({ bookings }: BookingsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [pkg, setPkg] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  // Assign worker dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Booking | null>(null);
  const [workerName, setWorkerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return bookings.filter((b) => {
      if (status && b.bookingStatus !== status) return false;
      if (vehicle && b.vehicleType !== vehicle) return false;
      if (pkg && b.servicePackage !== pkg) return false;
      if (paymentStatus && b.paymentStatus !== paymentStatus) return false;
      if (q) {
        return (
          b.customerName.toLowerCase().includes(q) ||
          b.bookingId.toLowerCase().includes(q) ||
          b.assignedWorker.toLowerCase().includes(q) ||
          b.phoneNumber.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bookings, search, status, vehicle, pkg, paymentStatus]);

  async function handleMutate(
    id: string,
    body: Record<string, unknown>,
    successMsg: string,
  ) {
    const result = await mutate(`/api/bookings/${id}`, body);
    if (result.ok) {
      toast.success(successMsg);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to update booking");
    }
  }

  async function handleAssignWorker() {
    if (!assignTarget || !workerName.trim()) return;
    setIsSubmitting(true);
    const result = await mutate(`/api/bookings/${assignTarget.bookingId}`, {
      assignedWorker: workerName.trim(),
    });
    setIsSubmitting(false);
    if (result.ok) {
      toast.success(`Worker assigned to ${assignTarget.bookingId}`);
      setAssignDialogOpen(false);
      setWorkerName("");
      setAssignTarget(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to assign worker");
    }
  }

  return (
    <div className="mx-auto max-w-350 px-4 py-6 space-y-4">
      <PageHeader
        title="Bookings"
        description={`${bookings.length} total bookings`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search ID, customer, phone, worker…"
          className="w-70"
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
        />
        <FilterSelect
          value={vehicle}
          onChange={setVehicle}
          options={VEHICLE_OPTIONS}
          placeholder="All vehicles"
        />
        <FilterSelect
          value={pkg}
          onChange={setPkg}
          options={PACKAGE_OPTIONS}
          placeholder="All packages"
        />
        <FilterSelect
          value={paymentStatus}
          onChange={setPaymentStatus}
          options={PAYMENT_STATUS_OPTIONS}
          placeholder="Payment status"
        />
        {filtered.length !== bookings.length && (
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {bookings.length} shown
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No bookings match your filters." />
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-30">Booking ID</TableHead>
                <TableHead>Service Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Car</TableHead>
                <TableHead>Time Slot</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Assigned Worker</TableHead>
                <TableHead>Booking Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((booking) => (
                <TableRow key={booking.bookingId}>
                  <TableCell className="font-mono text-xs">
                    {booking.bookingId}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(booking.serviceDate)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">
                      {booking.customerName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {booking.phoneNumber}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {booking.carModel || "—"}
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
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={isPending}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => {
                            setAssignTarget(booking);
                            setWorkerName(booking.assignedWorker);
                            setAssignDialogOpen(true);
                          }}
                        >
                          Assign Worker
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            Set Booking Status
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {(
                              [
                                "New Inquiry",
                                "Confirmed",
                                "Assigned",
                                "In Progress",
                                "Completed",
                                "Cancelled",
                                "Rescheduled",
                                "Payment Pending",
                              ] as const
                            ).map((s) => (
                              <DropdownMenuItem
                                key={s}
                                disabled={booking.bookingStatus === s}
                                onSelect={() =>
                                  handleMutate(
                                    booking.bookingId,
                                    { bookingStatus: s },
                                    `Status updated to ${s}`,
                                  )
                                }
                              >
                                {s}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            Payment Status
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {(
                              [
                                "Pending",
                                "Paid",
                                "Partially Paid",
                                "Failed",
                                "Refunded",
                              ] as const
                            ).map((s) => (
                              <DropdownMenuItem
                                key={s}
                                disabled={booking.paymentStatus === s}
                                onSelect={() =>
                                  handleMutate(
                                    booking.bookingId,
                                    { paymentStatus: s },
                                    `Payment marked as ${s}`,
                                  )
                                }
                              >
                                {s}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Worker</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="worker-name">Worker Name</Label>
            <Input
              id="worker-name"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              placeholder="Enter worker name"
              onKeyDown={(e) => e.key === "Enter" && handleAssignWorker()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignWorker}
              disabled={isSubmitting || !workerName.trim()}
            >
              {isSubmitting ? "Saving…" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
