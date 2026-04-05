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
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { mutate } from "@/lib/mutate";
import type { SelectOption } from "@/lib/domain";

interface AssignWorkerDialogProps {
  bookingId: string;
  currentWorkerId?: string;
  workers: SelectOption[];
  children?: React.ReactNode;
}

export function AssignWorkerDialog({
  bookingId,
  currentWorkerId,
  workers,
  children,
}: AssignWorkerDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workerId, setWorkerId] = useState(currentWorkerId ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await mutate(`/api/bookings/${bookingId}`, {
      assigned_worker_id: workerId,
    });
    setLoading(false);
    if (result.ok) {
      toast.success("Worker assigned");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to assign worker");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm" variant="outline">
            Assign Worker
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Assign Worker</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="worker">Worker</Label>
            <Select
              id="worker"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
            >
              <option value="">Select worker…</option>
              {workers.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !workerId}>
              {loading ? "Saving…" : "Assign"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
