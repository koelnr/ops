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
import { Textarea } from "@/components/ui/textarea";
import { create } from "@/lib/mutate";
import type { SelectOption } from "@/lib/domain";

interface LogComplaintDialogProps {
  bookingId: string;
  complaintTypes: SelectOption[];
  workers: SelectOption[];
  children?: React.ReactNode;
}

export function LogComplaintDialog({
  bookingId,
  complaintTypes,
  workers,
  children,
}: LogComplaintDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [typeId, setTypeId] = useState("");
  const [details, setDetails] = useState("");
  const [workerId, setWorkerId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!typeId || !details.trim()) {
      toast.error("Type and details are required");
      return;
    }
    setLoading(true);
    const result = await create("/api/complaints", {
      booking_id: bookingId,
      complaint_date: new Date().toISOString().split("T")[0],
      complaint_type_id: typeId,
      details,
      assigned_worker_id: workerId,
      resolution_status: "Open",
    });
    setLoading(false);
    if (result.ok) {
      toast.success("Complaint logged");
      setOpen(false);
      setTypeId("");
      setDetails("");
      setWorkerId("");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to log complaint");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm" variant="outline">
            Log Complaint
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Log Complaint</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="type">Complaint Type</Label>
            <Select
              id="type"
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
            >
              <option value="">Select type…</option>
              {complaintTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="details">Details</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the issue…"
              rows={3}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="worker">Assign Worker (optional)</Label>
            <Select
              id="worker"
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
            >
              <option value="">— None —</option>
              {workers.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </Select>
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
              {loading ? "Saving…" : "Log"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
