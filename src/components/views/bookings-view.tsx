"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ResolvedBooking, Customer, Vehicle, Worker, SerializedLookupContext } from "@/lib/domain";
import type { SelectOptions } from "@/lib/options";
import { mutate, create, remove } from "@/lib/mutate";
import { STATIC_OPTIONS } from "@/lib/options";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { DataTable } from "@/components/ui/data-table";
import { getBookingColumns } from "./bookings-columns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useUser } from "@clerk/nextjs";

type BookingFormData = {
  customer_id: string;
  vehicle_id: string;
  service_date: string;
  time_slot_id: string;
  booking_status_id: string;
  source_id: string;
  assigned_worker_id: string;
  area_id: string;
  base_price: string;
  discount_amount: string;
  addon_total: string;
  final_price: string;
  notes: string;
};

const emptyForm: BookingFormData = {
  customer_id: "",
  vehicle_id: "",
  service_date: "",
  time_slot_id: "",
  booking_status_id: "",
  source_id: "",
  assigned_worker_id: "",
  area_id: "",
  base_price: "",
  discount_amount: "0",
  addon_total: "0",
  final_price: "",
  notes: "",
};

function resolvedBookingToForm(b: ResolvedBooking): BookingFormData {
  return {
    customer_id: b.customer_id,
    vehicle_id: b.vehicle_id,
    service_date: b.service_date,
    time_slot_id: b.time_slot_id,
    booking_status_id: b.booking_status_id,
    source_id: b.source_id,
    assigned_worker_id: b.worker_id,
    area_id: b.area_id,
    base_price: String(b.base_price),
    discount_amount: String(b.discount_amount),
    addon_total: String(b.addon_total),
    final_price: String(b.final_price),
    notes: b.notes,
  };
}

interface BookingsViewProps {
  resolvedBookings: ResolvedBooking[];
  workers: Worker[];
  vehicles: Vehicle[];
  customers: Customer[];
  serializedCtx: SerializedLookupContext | null;
  options: SelectOptions | null;
}

export function BookingsView({
  resolvedBookings, workers, vehicles, customers, options,
}: BookingsViewProps) {
  const router = useRouter();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");

  const opts = options ?? STATIC_OPTIONS;

  function resetFilters() { setSearch(""); setStatusFilter(""); setAreaFilter(""); }

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<ResolvedBooking | null>(null);
  const [assignWorkerId, setAssignWorkerId] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ResolvedBooking | null>(null);
  const [form, setForm] = useState<BookingFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ResolvedBooking | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return resolvedBookings.filter((b) => {
      if (statusFilter && b.booking_status_id !== statusFilter) return false;
      if (areaFilter && b.area_id !== areaFilter) return false;
      if (q) {
        return (
          b.booking_id.toLowerCase().includes(q) ||
          b.customer_name.toLowerCase().includes(q) ||
          b.phone.toLowerCase().includes(q) ||
          b.worker_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [resolvedBookings, search, statusFilter, areaFilter]);

  function setField(key: keyof BookingFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() { setEditTarget(null); setForm(emptyForm); setFormOpen(true); }
  function openEdit(booking: ResolvedBooking) { setEditTarget(booking); setForm(resolvedBookingToForm(booking)); setFormOpen(true); }

  async function handleMutate(id: string, body: Record<string, unknown>, msg: string) {
    const result = await mutate(`/api/bookings/${id}`, body);
    if (result.ok) { toast.success(msg); startTransition(() => router.refresh()); }
    else toast.error(result.error ?? "Failed to update booking");
  }

  async function handleAssignWorker() {
    if (!assignTarget) return;
    setIsSubmitting(true);
    const result = await mutate(`/api/bookings/${assignTarget.booking_id}`, {
      assigned_worker_id: assignWorkerId,
    });
    setIsSubmitting(false);
    if (result.ok) {
      toast.success("Worker assigned");
      setAssignDialogOpen(false);
      setAssignWorkerId("");
      setAssignTarget(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to assign worker");
    }
  }

  async function handleFormSubmit() {
    if (!form.customer_id || !form.service_date) {
      toast.error("Customer and service date are required");
      return;
    }
    setIsSubmitting(true);
    const body = {
      ...form,
      base_price: Number(form.base_price) || 0,
      discount_amount: Number(form.discount_amount) || 0,
      addon_total: Number(form.addon_total) || 0,
      final_price: Number(form.final_price) || 0,
    };
    const result = editTarget
      ? await mutate(`/api/bookings/${editTarget.booking_id}`, body)
      : await create("/api/bookings", body);
    setIsSubmitting(false);
    if (result.ok) {
      toast.success(editTarget ? "Booking updated" : "Booking created");
      setFormOpen(false);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? (editTarget ? "Failed to update" : "Failed to create"));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await remove(`/api/bookings/${deleteTarget.booking_id}`);
    if (result.ok) {
      toast.success(`Booking ${deleteTarget.booking_id} deleted`);
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to delete booking");
    }
  }

  // Filter vehicles by selected customer
  const customerVehicles = useMemo(
    () => vehicles.filter((v) => v.customer_id === form.customer_id),
    [vehicles, form.customer_id],
  );

  const columns = getBookingColumns({
    onEdit: openEdit,
    onAssign: (booking) => {
      setAssignTarget(booking);
      setAssignWorkerId(booking.worker_id);
      setAssignDialogOpen(true);
    },
    onSetBookingStatus: (id, statusId) =>
      handleMutate(id, { booking_status_id: statusId }, "Status updated"),
    onDelete: setDeleteTarget,
    isPending,
    isAdmin,
    bookingStatusOptions: opts.bookingStatuses,
  });

  return (
    <div className="mx-auto max-w-350 px-4 py-6 space-y-4">
      <PageHeader
        title="Bookings"
        description={`${resolvedBookings.length} total bookings`}
        action={
          isAdmin ? (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              New Booking
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search ID, customer, phone…" className="w-70" />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={opts.bookingStatuses} placeholder="All statuses" />
        <FilterSelect value={areaFilter} onChange={setAreaFilter} options={opts.areas} placeholder="All areas" />
        {filtered.length !== resolvedBookings.length && (
          <>
            <span className="text-xs text-muted-foreground">{filtered.length} of {resolvedBookings.length} shown</span>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">Clear filters</Button>
          </>
        )}
      </div>

      <DataTable columns={columns} data={filtered} emptyMessage="No bookings match your filters." />

      {/* Assign Worker Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Assign Worker</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Worker</Label>
            <Select value={assignWorkerId} onChange={(e) => setAssignWorkerId(e.target.value)}>
              <option value="">— unassigned —</option>
              {workers.map((w) => (
                <option key={w.worker_id} value={w.worker_id}>{w.worker_name}</option>
              ))}
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignWorker} disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? `Edit Booking ${editTarget.booking_id}` : "New Booking"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Customer *</Label>
              <Select value={form.customer_id} onChange={(e) => setField("customer_id", e.target.value)}>
                <option value="">— select customer —</option>
                {customers.map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>{c.full_name} ({c.phone})</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle *</Label>
              <Select value={form.vehicle_id} onChange={(e) => setField("vehicle_id", e.target.value)}>
                <option value="">— select vehicle —</option>
                {customerVehicles.map((v) => (
                  <option key={v.vehicle_id} value={v.vehicle_id}>
                    {v.car_model} {v.registration_number ? `(${v.registration_number})` : ""}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Service Date *</Label>
              <Input type="date" value={form.service_date} onChange={(e) => setField("service_date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Time Slot *</Label>
              <Select value={form.time_slot_id} onChange={(e) => setField("time_slot_id", e.target.value)}>
                <option value="">— select slot —</option>
                {opts.timeSlots.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Booking Status *</Label>
              <Select value={form.booking_status_id} onChange={(e) => setField("booking_status_id", e.target.value)}>
                <option value="">— select status —</option>
                {opts.bookingStatuses.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={form.source_id} onChange={(e) => setField("source_id", e.target.value)}>
                <option value="">— select source —</option>
                {opts.leadSources.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Area</Label>
              <Select value={form.area_id} onChange={(e) => setField("area_id", e.target.value)}>
                <option value="">— select area —</option>
                {opts.areas.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assigned Worker</Label>
              <Select value={form.assigned_worker_id} onChange={(e) => setField("assigned_worker_id", e.target.value)}>
                <option value="">— unassigned —</option>
                {workers.map((w) => <option key={w.worker_id} value={w.worker_id}>{w.worker_name}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Base Price (₹)</Label>
              <Input type="number" value={form.base_price} onChange={(e) => setField("base_price", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Final Price (₹)</Label>
              <Input type="number" value={form.final_price} onChange={(e) => setField("final_price", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Discount (₹)</Label>
              <Input type="number" value={form.discount_amount} onChange={(e) => setField("discount_amount", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Add-on Total (₹)</Label>
              <Input type="number" value={form.addon_total} onChange={(e) => setField("addon_total", e.target.value)} placeholder="0" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Any notes…" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleFormSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : editTarget ? "Save Changes" : "Create Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove booking{" "}
              <span className="font-mono font-medium">{deleteTarget?.booking_id}</span>.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
