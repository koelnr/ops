"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { PaymentWithContext, SerializedLookupContext } from "@/lib/domain";
import type { SelectOptions } from "@/lib/options";
import { mutate, remove } from "@/lib/mutate";
import { STATIC_OPTIONS } from "@/lib/options";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { DataTable } from "@/components/ui/data-table";
import { getPaymentColumns } from "./payments-columns";
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

type PaymentFormData = {
  amount_received: string;
  payment_status_id: string;
  payment_mode_id: string;
  upi_transaction_ref: string;
  payment_date: string;
  follow_up_required: string;
  notes: string;
};

function paymentToForm(p: PaymentWithContext): PaymentFormData {
  const today = new Date().toISOString().split("T")[0];
  return {
    amount_received: String(p.amount_received),
    payment_status_id: p.payment_status_id,
    payment_mode_id: p.payment_mode_id,
    upi_transaction_ref: p.upi_transaction_ref,
    payment_date: p.payment_date || today,
    follow_up_required: p.follow_up_required ? "true" : "false",
    notes: p.notes,
  };
}

interface PaymentsViewProps {
  payments: PaymentWithContext[];
  serializedCtx: SerializedLookupContext | null;
  options: SelectOptions | null;
}

export function PaymentsView({ payments, options }: PaymentsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");

  const opts = options ?? STATIC_OPTIONS;

  function resetFilters() { setSearch(""); setStatusFilter(""); setModeFilter(""); }

  // UPI ref dialog
  const [refDialogOpen, setRefDialogOpen] = useState(false);
  const [refTarget, setRefTarget] = useState<PaymentWithContext | null>(null);
  const [upiRef, setUpiRef] = useState("");

  // Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PaymentWithContext | null>(null);
  const [form, setForm] = useState<PaymentFormData>({
    amount_received: "0",
    payment_status_id: "",
    payment_mode_id: "",
    upi_transaction_ref: "",
    payment_date: "",
    follow_up_required: "false",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<PaymentWithContext | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter((p) => {
      if (statusFilter && p.payment_status_id !== statusFilter) return false;
      if (modeFilter && p.payment_mode_id !== modeFilter) return false;
      if (q) {
        return (
          p.payment_id.toLowerCase().includes(q) ||
          p.booking_id.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payments, search, statusFilter, modeFilter]);

  const pendingCount = useMemo(() => {
    const pendingLabels = new Set(["Pending", "Partially Paid"]);
    return payments.filter((p) => pendingLabels.has(p.paymentStatusLabel)).length;
  }, [payments]);

  function setField(key: keyof PaymentFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openEdit(payment: PaymentWithContext) {
    setEditTarget(payment);
    setForm(paymentToForm(payment));
    setFormOpen(true);
  }

  // Resolve FK helpers
  const selectedModeLabel = opts.paymentModes.find((o) => o.value === form.payment_mode_id)?.label ?? "";
  const isUpi = selectedModeLabel === "UPI";
  const selectedStatusLabel = opts.paymentStatuses.find((o) => o.value === form.payment_status_id)?.label ?? "";
  const isSettled = selectedStatusLabel === "Paid" || selectedStatusLabel === "Partially Paid";

  async function handleStatusUpdate(id: string, statusId: string) {
    const result = await mutate(`/api/payments/${id}`, { payment_status_id: statusId });
    if (result.ok) {
      const label = opts.paymentStatuses.find((o) => o.value === statusId)?.label ?? statusId;
      toast.success(`Payment marked as ${label}`);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to update payment");
    }
  }

  async function handleUpdateRef() {
    if (!refTarget) return;
    setIsSubmitting(true);
    const result = await mutate(`/api/payments/${refTarget.payment_id}`, {
      payment_status_id: refTarget.payment_status_id,
      upi_transaction_ref: upiRef.trim(),
    });
    setIsSubmitting(false);
    if (result.ok) {
      toast.success("UPI reference updated");
      setRefDialogOpen(false);
      setUpiRef("");
      setRefTarget(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to update reference");
    }
  }

  async function handleFormSubmit() {
    if (!editTarget) return;
    const received = Number(form.amount_received) || 0;
    if (received > editTarget.finalPrice) {
      toast.error("Amount received cannot exceed amount due");
      return;
    }
    if (selectedStatusLabel === "Paid" && received !== editTarget.finalPrice) {
      toast.error("Amount received must equal amount due to mark as Paid");
      return;
    }
    if (isSettled && !form.payment_date) {
      toast.error("Payment date is required when payment is Paid or Partially Paid");
      return;
    }
    if (isUpi && isSettled && !form.upi_transaction_ref.trim()) {
      toast.error("UPI transaction reference is required for UPI payments");
      return;
    }
    setIsSubmitting(true);
    const result = await mutate(`/api/payments/${editTarget.payment_id}`, {
      ...form,
      amount_received: received,
      follow_up_required: form.follow_up_required === "true",
    });
    setIsSubmitting(false);
    if (result.ok) {
      toast.success("Payment updated");
      setFormOpen(false);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to update payment");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await remove(`/api/payments/${deleteTarget.payment_id}`);
    if (result.ok) {
      toast.success(`Payment ${deleteTarget.payment_id} deleted`);
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to delete payment");
    }
  }

  const amountWarning =
    form.amount_received &&
    editTarget &&
    Number(form.amount_received) > editTarget.finalPrice;

  const columns = getPaymentColumns({
    onEdit: openEdit,
    onSetPaymentStatus: handleStatusUpdate,
    onUpdateRef: (payment) => {
      setRefTarget(payment);
      setUpiRef(payment.upi_transaction_ref);
      setRefDialogOpen(true);
    },
    onDelete: setDeleteTarget,
    isPending,
    paymentStatusOptions: opts.paymentStatuses,
  });

  return (
    <div className="mx-auto max-w-350 px-4 py-6 space-y-4">
      <PageHeader
        title="Payments"
        description={`${payments.length} total · ${pendingCount} pending or partial`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search payment ID, booking ID, customer…" className="w-full sm:w-75" />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={opts.paymentStatuses} placeholder="All statuses" />
        <FilterSelect value={modeFilter} onChange={setModeFilter} options={opts.paymentModes} placeholder="All modes" />
        {filtered.length !== payments.length && (
          <>
            <span className="text-xs text-muted-foreground">{filtered.length} of {payments.length} shown</span>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">Clear filters</Button>
          </>
        )}
      </div>

      <DataTable columns={columns} data={filtered} emptyMessage="No payments match your filters." />

      {/* UPI Ref Dialog */}
      <Dialog open={refDialogOpen} onOpenChange={setRefDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Update UPI Reference</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="upi-ref">UPI Transaction Reference</Label>
            <Input
              id="upi-ref"
              value={upiRef}
              onChange={(e) => setUpiRef(e.target.value)}
              placeholder="e.g. UPI-123456789"
              onKeyDown={(e) => e.key === "Enter" && handleUpdateRef()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateRef} disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Payment {editTarget?.payment_id}</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Booking ID</Label>
                <Input value={editTarget.booking_id} readOnly disabled className="bg-muted cursor-not-allowed opacity-60" />
              </div>
              <div className="space-y-1.5">
                <Label>Customer</Label>
                <Input value={editTarget.customerName} readOnly disabled className="bg-muted cursor-not-allowed opacity-60" />
              </div>
              <div className="space-y-1.5">
                <Label>Service Date</Label>
                <Input value={editTarget.serviceDate} readOnly disabled className="bg-muted cursor-not-allowed opacity-60" />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Date{isSettled && " *"}</Label>
                <Input type="date" value={form.payment_date} onChange={(e) => setField("payment_date", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Amount Due (₹)</Label>
                <Input value={editTarget.finalPrice} readOnly disabled className="bg-muted cursor-not-allowed opacity-60" />
              </div>
              <div className="space-y-1.5">
                <Label>Amount Received (₹)</Label>
                <Input
                  type="number"
                  value={form.amount_received}
                  onChange={(e) => setField("amount_received", e.target.value)}
                  placeholder="0"
                />
                {amountWarning && <p className="text-xs text-destructive">Cannot exceed amount due</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Payment Status</Label>
                <Select value={form.payment_status_id} onChange={(e) => setField("payment_status_id", e.target.value)}>
                  {opts.paymentStatuses.map((o) => (
                    <option
                      key={o.value}
                      value={o.value}
                      disabled={o.label === "Paid" && Number(form.amount_received) !== editTarget.finalPrice}
                    >
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Payment Mode</Label>
                <Select value={form.payment_mode_id} onChange={(e) => setField("payment_mode_id", e.target.value)}>
                  {opts.paymentModes.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              </div>
              {isUpi && (
                <div className="col-span-2 space-y-1.5">
                  <Label>UPI Transaction Ref{isSettled && " *"}</Label>
                  <Input
                    value={form.upi_transaction_ref}
                    onChange={(e) => setField("upi_transaction_ref", e.target.value)}
                    placeholder="e.g. UPI-123456789"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Follow-Up Required</Label>
                <Select value={form.follow_up_required} onChange={(e) => setField("follow_up_required", e.target.value)}>
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Notes</Label>
                <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Any notes…" rows={2} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleFormSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete payment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove payment{" "}
              <span className="font-mono font-medium">{deleteTarget?.payment_id}</span>{" "}
              for {deleteTarget?.customerName}. This cannot be undone.
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
