"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Payment } from "@/lib/sheets/types";
import { mutate } from "@/lib/mutate";
import { formatCurrency, formatDate } from "@/lib/format";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { MoreHorizontal } from "lucide-react";

const STATUS_OPTIONS = [
  { label: "Pending", value: "Pending" },
  { label: "Paid", value: "Paid" },
  { label: "Partially Paid", value: "Partially Paid" },
  { label: "Failed", value: "Failed" },
  { label: "Refunded", value: "Refunded" },
];

const MODE_OPTIONS = [
  { label: "UPI", value: "UPI" },
  { label: "Cash", value: "Cash" },
];

interface PaymentsViewProps {
  payments: Payment[];
}

export function PaymentsView({ payments }: PaymentsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [mode, setMode] = useState("");

  // UPI ref dialog state
  const [refDialogOpen, setRefDialogOpen] = useState(false);
  const [refTarget, setRefTarget] = useState<Payment | null>(null);
  const [upiRef, setUpiRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    (p) => p.paymentStatus === "Pending" || p.paymentStatus === "Partially Paid",
  ).length;

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
          className="w-75"
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
          placeholder="All statuses"
        />
        <FilterSelect
          value={mode}
          onChange={setMode}
          options={MODE_OPTIONS}
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
                  <TableCell className="text-sm">{payment.paymentMode}</TableCell>
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
                            handleStatusUpdate(payment.paymentId, "Partially Paid")
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={refDialogOpen} onOpenChange={setRefDialogOpen}>
        <DialogContent className="max-w-sm">
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
    </div>
  );
}
