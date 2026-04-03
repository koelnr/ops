"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Payment } from "@/lib/sheets/types";
import { mutate, create, remove } from "@/lib/mutate";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_MODE_OPTIONS,
  YES_NO_OPTIONS,
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
  return {
    bookingId: p.bookingId,
    customerName: p.customerName,
    serviceDate: p.serviceDate,
    amountDue: String(p.amountDue),
    amountReceived: String(p.amountReceived),
    paymentStatus: p.paymentStatus,
    paymentMode: p.paymentMode,
    upiTransactionRef: p.upiTransactionRef,
    paymentDate: p.paymentDate,
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

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setFormOpen(true);
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
    if (!form.bookingId.trim() || !form.customerName.trim()) {
      toast.error("Booking ID and customer name are required");
      return;
    }
    const due = Number(form.amountDue) || 0;
    const received = Number(form.amountReceived) || 0;
    if (received > due) {
      toast.error("Amount received cannot exceed amount due");
      return;
    }
    const isPaid =
      form.paymentStatus === "Paid" || form.paymentStatus === "Partially Paid";
    if (isPaid && !form.paymentDate) {
      toast.error(
        "Payment date is required when payment is Paid or Partially Paid",
      );
      return;
    }
    if (
      form.paymentMode === "UPI" &&
      isPaid &&
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
    let result;
    if (editTarget) {
      result = await mutate(`/api/payments/${editTarget.paymentId}`, body);
    } else {
      result = await create("/api/payments", body);
    }
    setIsSubmitting(false);
    if (result.ok) {
      toast.success(editTarget ? "Payment updated" : "Payment created");
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

  return (
    <div className="mx-auto max-w-350 px-4 py-6 space-y-4">
      <PageHeader
        title="Payments"
        description={`${payments.length} total · ${pendingCount} pending or partial`}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New Payment
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search payment ID, booking ID, customer…"
          className="w-75"
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
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {payments.length} shown
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No payments match your filters." />
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-30">Payment ID</TableHead>
                <TableHead>Booking ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Amount Due</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>UPI Ref</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((payment) => (
                <TableRow key={payment.paymentId}>
                  <TableCell className="font-mono text-xs">
                    {payment.paymentId}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {payment.bookingId}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {payment.customerName}
                  </TableCell>
                  <TableCell className="text-right font-medium text-sm tabular-nums">
                    {formatCurrency(payment.amountDue)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {formatCurrency(payment.amountReceived)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {payment.paymentMode}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={payment.paymentStatus} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(payment.paymentDate)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {payment.upiTransactionRef || "—"}
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
                        <DropdownMenuItem onSelect={() => openEdit(payment)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={payment.paymentStatus === "Paid"}
                          onSelect={() =>
                            handleStatusUpdate(payment.paymentId, "Paid")
                          }
                        >
                          Mark as Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={payment.paymentStatus === "Partially Paid"}
                          onSelect={() =>
                            handleStatusUpdate(
                              payment.paymentId,
                              "Partially Paid",
                            )
                          }
                        >
                          Mark as Partially Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={payment.paymentStatus === "Pending"}
                          onSelect={() =>
                            handleStatusUpdate(payment.paymentId, "Pending")
                          }
                        >
                          Mark as Pending
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => {
                            setRefTarget(payment);
                            setUpiRef(payment.upiTransactionRef);
                            setRefDialogOpen(true);
                          }}
                        >
                          Update UPI Reference
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => setDeleteTarget(payment)}
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

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget
                ? `Edit Payment ${editTarget.paymentId}`
                : "New Payment"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Booking ID *</Label>
              <Input
                value={form.bookingId}
                onChange={(e) => setField("bookingId", e.target.value)}
                placeholder="BKG-001"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Customer Name *</Label>
              <Input
                value={form.customerName}
                onChange={(e) => setField("customerName", e.target.value)}
                placeholder="Name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Service Date</Label>
              <Input
                type="date"
                value={form.serviceDate}
                onChange={(e) => setField("serviceDate", e.target.value)}
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
                onChange={(e) => setField("amountDue", e.target.value)}
                placeholder="0"
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
              {isSubmitting
                ? "Saving…"
                : editTarget
                  ? "Save Changes"
                  : "Create Payment"}
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
