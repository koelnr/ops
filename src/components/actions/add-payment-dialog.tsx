"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { create } from "@/lib/mutate";
import type { SelectOption } from "@/lib/domain";

interface AddPaymentDialogProps {
  bookingId: string;
  amountDue: number;
  paymentModes: SelectOption[];
  paymentStatuses: SelectOption[];
  children?: React.ReactNode;
}

export function AddPaymentDialog({
  bookingId,
  amountDue,
  paymentModes,
  paymentStatuses,
  children,
}: AddPaymentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState(String(amountDue));
  const [modeId, setModeId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [upiRef, setUpiRef] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!modeId || !statusId) {
      toast.error("Payment mode and status are required");
      return;
    }
    setLoading(true);
    const result = await create("/api/payments", {
      booking_id: bookingId,
      payment_date: new Date().toISOString().split("T")[0],
      amount_received: parseFloat(amount) || 0,
      payment_mode_id: modeId,
      payment_status_id: statusId,
      upi_transaction_ref: upiRef,
    });
    setLoading(false);
    if (result.ok) {
      toast.success("Payment recorded");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to record payment");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm" variant="outline">
            Add Payment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Collect Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              step={0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mode">Payment Mode</Label>
            <Select
              id="mode"
              value={modeId}
              onChange={(e) => setModeId(e.target.value)}
            >
              <option value="">Select mode…</option>
              {paymentModes.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              value={statusId}
              onChange={(e) => setStatusId(e.target.value)}
            >
              <option value="">Select status…</option>
              {paymentStatuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="upi">UPI Ref (optional)</Label>
            <Input
              id="upi"
              value={upiRef}
              onChange={(e) => setUpiRef(e.target.value)}
              placeholder="Transaction ID"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
