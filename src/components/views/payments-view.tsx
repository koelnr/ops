"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Payment } from "@/lib/sheets/types";
import { mutate, remove } from "@/lib/mutate";
import {
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_MODE_OPTIONS,
  YES_NO_OPTIONS,
} from "@/lib/options";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { DataTable } from "@/components/ui/data-table";
import { getPaymentColumns } from "./payments-columns";
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

type PaymentFormData = {
  bookingId: string;
  customerName: string;
  serviceDate: string;
  amountDue: string;
  amountReceived: string;
  paymentStatus: string;
  paymentMode: string;
  upiTransactionRef: string;
  paymentDate: string;
  followUpRequired: string;
  notes: string;
};

const emptyForm: PaymentFormData = {
  bookingId: "",
  customerName: "",
  serviceDate: "",
  amountDue: "",
  amountReceived: "0",
  paymentStatus: "Pending",
  paymentMode: "UPI",
  upiTransactionRef: "",
  paymentDate: "",
  followUpRequired: "No",
  notes: "",
};

function paymentToForm(p: Payment): PaymentFormData {
  const today = new Date().toISOString().split("T")[0];
  return {
    bookingId: p.bookingId,
    customerName: p.customerName,
    serviceDate: p.serviceDate,
    amountDue: String(p.amountDue),
    amountReceived: String(p.amountReceived),
    paymentStatus: p.paymentStatus,
    paymentMode: p.paymentMode,
    upiTransactionRef: p.upiTransactionRef,
    // Default to today if paymentDate is empty
    paymentDate: p.paymentDate || today,
    followUpRequired: p.followUpRequired || "No",
    notes: p.notes,
  };
}

interface PaymentsViewProps {
  payments: Payment[];
}

export function PaymentsView({ payments }: PaymentsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [mode, setMode] = useState("");

  function resetFilters() {
    setSearch("");
    setStatus("");
    setMode("");
  }

  // UPI ref dialog
  const [refDialogOpen, setRefDialogOpen] = useState(false);
  const [refTarget, setRefTarget] = useState<Payment | null>(null);
  const [upiRef, setUpiRef] = useState("");

  // Create / Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Payment | null>(null);
  const [form, setForm] = useState<PaymentFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return payments.filter((p) => {
      if (status && p.paymentStatus !== status) return false;
      if (mode && p.paymentMode !== mode) return false;
      if (q) {
        return (
          p.paymentId.toLowerCase().includes(q) ||
          p.bookingId.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payments, search, status, mode]);

  const pendingCount = payments.filter(
    (p) =>
      p.paymentStatus === "Pending" || p.paymentStatus === "Partially Paid",
  ).length;

  function setField(key: keyof PaymentFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openEdit(payment: Payment) {
    setEditTarget(payment);
    setForm(paymentToForm(payment));
    setFormOpen(true);
  }

  async function handleStatusUpdate(id: string, newStatus: string) {
    const result = await mutate(`/api/payments/${id}`, {
      paymentStatus: newStatus,
    });
    if (result.ok) {
      toast.success(`Payment marked as ${newStatus}`);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to update payment");
    }
  }

  async function handleUpdateRef() {
    if (!refTarget) return;
    setIsSubmitting(true);
    const result = await mutate(`/api/payments/${refTarget.paymentId}`, {
      paymentStatus: refTarget.paymentStatus,
      upiTransactionRef: upiRef.trim(),
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
    const due = Number(form.amountDue) || 0;
    const received = Number(form.amountReceived) || 0;
    if (received > due) {
      toast.error("Amount received cannot exceed amount due");
      return;
    }
    // Block "Paid" if amounts don't match
    if (form.paymentStatus === "Paid" && received !== due) {
      toast.error("Amount received must equal amount due to mark as Paid");
      return;
    }
    const isSettled =
      form.paymentStatus === "Paid" || form.paymentStatus === "Partially Paid";
    if (isSettled && !form.paymentDate) {
      toast.error(
        "Payment date is required when payment is Paid or Partially Paid",
      );
      return;
    }
    if (
      form.paymentMode === "UPI" &&
      isSettled &&
      !form.upiTransactionRef.trim()
    ) {
      toast.error("UPI transaction reference is required for UPI payments");
      return;
    }
    setIsSubmitting(true);
    const body = {
      ...form,
      amountDue: due,
      amountReceived: received,
    };
    const result = await mutate(`/api/payments/${editTarget.paymentId}`, body);
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
    const result = await remove(`/api/payments/${deleteTarget.paymentId}`);
    if (result.ok) {
      toast.success(`Payment ${deleteTarget.paymentId} deleted`);
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to delete payment");
    }
  }

  const amountWarning =
    form.amountDue &&
    form.amountReceived &&
    Number(form.amountReceived) > Number(form.amountDue);

  const columns = getPaymentColumns({
    onEdit: openEdit,
    onStatusUpdate: handleStatusUpdate,
    onUpdateRef: (payment) => {
      setRefTarget(payment);
      setUpiRef(payment.upiTransactionRef);
      setRefDialogOpen(true);
    },
    onDelete: setDeleteTarget,
    isPending,
  });

  return (
    <div className="mx-auto max-w-350 px-4 py-6 space-y-4">
      <PageHeader
        title="Payments"
        description={`${payments.length} total · ${pendingCount} pending or partial`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search payment ID, booking ID, customer…"
          className="w-full sm:w-75"
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={PAYMENT_STATUS_OPTIONS}
          placeholder="All statuses"
        />
        <FilterSelect
          value={mode}
          onChange={setMode}
          options={PAYMENT_MODE_OPTIONS}
          placeholder="All modes"
        />
        {filtered.length !== payments.length && (
          <>
            <span className="text-xs text-muted-foreground">
              {filtered.length} of {payments.length} shown
            </span>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">
              Clear filters
            </Button>
          </>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="No payments match your filters."
      />

      {/* UPI Ref Dialog */}
      <Dialog open={refDialogOpen} onOpenChange={setRefDialogOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Update UPI Reference</DialogTitle>
          </DialogHeader>
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
            <Button variant="outline" onClick={() => setRefDialogOpen(false)}>
              Cancel
            </Button>
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
            <DialogTitle>
              {editTarget ? `Edit Payment ${editTarget.paymentId}` : "Payment"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Booking ID</Label>
              <Input
                value={form.bookingId}
                readOnly
                disabled
                className="bg-muted cursor-not-allowed opacity-60"
                aria-label="Booking ID (read only)"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Customer Name</Label>
              <Input
                value={form.customerName}
                readOnly
                disabled
                className="bg-muted cursor-not-allowed opacity-60"
                aria-label="Customer Name (read only)"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Service Date</Label>
              <Input
                type="date"
                value={form.serviceDate}
                readOnly
                disabled
                className="bg-muted cursor-not-allowed opacity-60"
                aria-label="Service Date (read only)"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Payment Date
                {(form.paymentStatus === "Paid" ||
                  form.paymentStatus === "Partially Paid") &&
                  " *"}
              </Label>
              <Input
                type="date"
                value={form.paymentDate}
                onChange={(e) => setField("paymentDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Amount Due (₹)</Label>
              <Input
                type="number"
                value={form.amountDue}
                readOnly
                disabled
                className="bg-muted cursor-not-allowed opacity-60"
                aria-label="Amount Due (read only)"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Amount Received (₹)</Label>
              <Input
                type="number"
                value={form.amountReceived}
                onChange={(e) => setField("amountReceived", e.target.value)}
                placeholder="0"
              />
              {amountWarning && (
                <p className="text-xs text-destructive">
                  Cannot exceed amount due
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Payment Status</Label>
              <Select
                value={form.paymentStatus}
                onChange={(e) => setField("paymentStatus", e.target.value)}
              >
                {PAYMENT_STATUS_OPTIONS.map((o) => (
                  <option
                    key={o.value}
                    value={o.value}
                    disabled={
                      o.value === "Paid" &&
                      Number(form.amountReceived) !== Number(form.amountDue)
                    }
                  >
                    {o.label}
                  </option>
                ))}
              </Select>
              {form.paymentStatus !== "Paid" &&
                Number(form.amountReceived) !== Number(form.amountDue) && (
                  <p className="text-xs text-muted-foreground">
                    &ldquo;Paid&rdquo; requires amount received = amount due
                  </p>
                )}
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
            {form.paymentMode === "UPI" && (
              <div className="col-span-2 space-y-1.5">
                <Label>
                  UPI Transaction Ref
                  {(form.paymentStatus === "Paid" ||
                    form.paymentStatus === "Partially Paid") &&
                    " *"}
                </Label>
                <Input
                  value={form.upiTransactionRef}
                  onChange={(e) =>
                    setField("upiTransactionRef", e.target.value)
                  }
                  placeholder="e.g. UPI-123456789"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Follow-Up Required</Label>
              <Select
                value={form.followUpRequired}
                onChange={(e) => setField("followUpRequired", e.target.value)}
              >
                <option value="">— select —</option>
                {YES_NO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
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
              {isSubmitting ? "Saving…" : "Save Changes"}
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
            <AlertDialogTitle>Delete payment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove payment{" "}
              <span className="font-mono font-medium">
                {deleteTarget?.paymentId}
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
