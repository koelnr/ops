"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Booking, WorkerDailyOps } from "@/lib/sheets/types";
import { mutate, create, remove } from "@/lib/mutate";
import { formatDate } from "@/lib/format";
import {
  BOOKING_STATUS_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  SERVICE_PACKAGE_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_MODE_OPTIONS,
  BOOKING_SOURCE_OPTIONS,
  TIME_SLOT_OPTIONS,
} from "@/lib/options";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, Plus } from "lucide-react";

type BookingFormData = {
  bookingDate: string;
  serviceDate: string;
  timeSlot: string;
  customerName: string;
  phoneNumber: string;
  areaSociety: string;
  fullAddress: string;
  carModel: string;
  vehicleType: string;
  servicePackage: string;
  addOns: string;
  price: string;
  paymentStatus: string;
  paymentMode: string;
  assignedWorker: string;
  bookingSource: string;
  bookingStatus: string;
  notes: string;
};

const emptyForm: BookingFormData = {
  bookingDate: "",
  serviceDate: "",
  timeSlot: "",
  customerName: "",
  phoneNumber: "",
  areaSociety: "",
  fullAddress: "",
  carModel: "",
  vehicleType: "Hatchback",
  servicePackage: "Exterior Wash",
  addOns: "",
  price: "",
  paymentStatus: "Pending",
  paymentMode: "UPI",
  assignedWorker: "",
  bookingSource: "WhatsApp",
  bookingStatus: "New Inquiry",
  notes: "",
};

function bookingToForm(b: Booking): BookingFormData {
  return {
    bookingDate: b.bookingDate,
    serviceDate: b.serviceDate,
    timeSlot: b.timeSlot,
    customerName: b.customerName,
    phoneNumber: b.phoneNumber,
    areaSociety: b.areaSociety,
    fullAddress: b.fullAddress,
    carModel: b.carModel,
    vehicleType: b.vehicleType,
    servicePackage: b.servicePackage,
    addOns: b.addOns,
    price: String(b.price),
    paymentStatus: b.paymentStatus,
    paymentMode: b.paymentMode,
    assignedWorker: b.assignedWorker,
    bookingSource: b.bookingSource,
    bookingStatus: b.bookingStatus,
    notes: b.notes,
  };
}

interface BookingsViewProps {
  bookings: Booking[];
  workers: WorkerDailyOps[];
}

export function BookingsView({ bookings, workers }: BookingsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [pkg, setPkg] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  // Assign worker dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Booking | null>(null);
  const [workerName, setWorkerName] = useState("");

  // Create / Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Booking | null>(null);
  const [form, setForm] = useState<BookingFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Booking | null>(null);

  const workerNames = useMemo(() => {
    return Array.from(
      new Set(workers.map((w) => w.workerName).filter(Boolean)),
    ).sort();
  }, [workers]);

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

  function setField(key: keyof BookingFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(booking: Booking) {
    setEditTarget(booking);
    setForm(bookingToForm(booking));
    setFormOpen(true);
  }

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

  async function handleFormSubmit() {
    if (!form.customerName.trim() || !form.serviceDate.trim()) {
      toast.error("Customer name and service date are required");
      return;
    }
    setIsSubmitting(true);
    const body = {
      ...form,
      price: Number(form.price) || 0,
    };
    let result;
    if (editTarget) {
      result = await mutate(`/api/bookings/${editTarget.bookingId}`, body);
    } else {
      result = await create("/api/bookings", body);
    }
    setIsSubmitting(false);
    if (result.ok) {
      toast.success(editTarget ? "Booking updated" : "Booking created");
      setFormOpen(false);
      startTransition(() => router.refresh());
    } else {
      toast.error(
        result.error ?? (editTarget ? "Failed to update" : "Failed to create"),
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await remove(`/api/bookings/${deleteTarget.bookingId}`);
    if (result.ok) {
      toast.success(`Booking ${deleteTarget.bookingId} deleted`);
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to delete booking");
    }
  }

  return (
    <div className="mx-auto max-w-350 px-4 py-6 space-y-4">
      <PageHeader
        title="Bookings"
        description={`${bookings.length} total bookings`}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New Booking
          </Button>
        }
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
          options={BOOKING_STATUS_OPTIONS}
          placeholder="All statuses"
        />
        <FilterSelect
          value={vehicle}
          onChange={setVehicle}
          options={VEHICLE_TYPE_OPTIONS}
          placeholder="All vehicles"
        />
        <FilterSelect
          value={pkg}
          onChange={setPkg}
          options={SERVICE_PACKAGE_OPTIONS}
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
                        <DropdownMenuItem onSelect={() => openEdit(booking)}>
                          Edit
                        </DropdownMenuItem>
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => setDeleteTarget(booking)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Assign Worker Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Assign Worker</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="worker-name">Worker Name</Label>
            {workerNames.length > 0 ? (
              <Select
                id="worker-name"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
              >
                <option value="">— select worker —</option>
                {workerNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            ) : (
              <Input
                id="worker-name"
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                placeholder="Enter worker name"
                onKeyDown={(e) => e.key === "Enter" && handleAssignWorker()}
              />
            )}
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

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget
                ? `Edit Booking ${editTarget.bookingId}`
                : "New Booking"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Customer Name *</Label>
              <Input
                value={form.customerName}
                onChange={(e) => setField("customerName", e.target.value)}
                placeholder="Name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input
                value={form.phoneNumber}
                onChange={(e) => setField("phoneNumber", e.target.value)}
                placeholder="Phone"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Booking Date</Label>
              <Input
                type="date"
                value={form.bookingDate}
                onChange={(e) => setField("bookingDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Service Date *</Label>
              <Input
                type="date"
                value={form.serviceDate}
                onChange={(e) => setField("serviceDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Time Slot</Label>
              <Select
                value={form.timeSlot}
                onChange={(e) => setField("timeSlot", e.target.value)}
              >
                <option value="">— select slot —</option>
                {TIME_SLOT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Car Model</Label>
              <Input
                value={form.carModel}
                onChange={(e) => setField("carModel", e.target.value)}
                placeholder="e.g. Swift Dzire"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle Type</Label>
              <Select
                value={form.vehicleType}
                onChange={(e) => setField("vehicleType", e.target.value)}
              >
                {VEHICLE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Service Package</Label>
              <Select
                value={form.servicePackage}
                onChange={(e) => setField("servicePackage", e.target.value)}
              >
                {SERVICE_PACKAGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Add-Ons</Label>
              <Input
                value={form.addOns}
                onChange={(e) => setField("addOns", e.target.value)}
                placeholder="e.g. Engine wash"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Price (₹)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setField("price", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payment Status</Label>
              <Select
                value={form.paymentStatus}
                onChange={(e) => setField("paymentStatus", e.target.value)}
              >
                {PAYMENT_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Mode</Label>
              <Select
                value={form.paymentMode}
                onChange={(e) => setField("paymentMode", e.target.value)}
              >
                {PAYMENT_MODE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Booking Status</Label>
              <Select
                value={form.bookingStatus}
                onChange={(e) => setField("bookingStatus", e.target.value)}
              >
                {BOOKING_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Booking Source</Label>
              <Select
                value={form.bookingSource}
                onChange={(e) => setField("bookingSource", e.target.value)}
              >
                {BOOKING_SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Area / Society</Label>
              <Input
                value={form.areaSociety}
                onChange={(e) => setField("areaSociety", e.target.value)}
                placeholder="Society name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Assigned Worker</Label>
              {workerNames.length > 0 ? (
                <Select
                  value={form.assignedWorker}
                  onChange={(e) => setField("assignedWorker", e.target.value)}
                >
                  <option value="">— select worker —</option>
                  {workerNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </Select>
              ) : (
                <Input
                  value={form.assignedWorker}
                  onChange={(e) => setField("assignedWorker", e.target.value)}
                  placeholder="Worker name"
                />
              )}
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Full Address</Label>
              <Input
                value={form.fullAddress}
                onChange={(e) => setField("fullAddress", e.target.value)}
                placeholder="Full address"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Any notes…"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFormSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? "Saving…"
                : editTarget
                  ? "Save Changes"
                  : "Create Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove booking{" "}
              <span className="font-mono font-medium">
                {deleteTarget?.bookingId}
              </span>{" "}
              for {deleteTarget?.customerName}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
