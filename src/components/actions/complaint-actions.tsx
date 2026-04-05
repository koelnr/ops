"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { mutate } from "@/lib/mutate";
import type { SelectOption } from "@/lib/domain";

interface ComplaintActionsProps {
  complaintId: string;
  currentStatus: string;
  currentWorkerId: string;
  statusOptions: SelectOption[];
  workerOptions: SelectOption[];
}

export function ComplaintActions({
  complaintId,
  currentStatus,
  statusOptions,
}: ComplaintActionsProps) {
  const router = useRouter();
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolutionType, setResolutionType] = useState("");
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: string) {
    const result = await mutate(`/api/complaints/${complaintId}`, {
      resolution_status: status,
    });
    if (result.ok) {
      toast.success(`Status updated to ${status}`);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed");
    }
  }

  async function handleResolve(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const result = await mutate(`/api/complaints/${complaintId}`, {
      resolution_status: "Resolved",
      resolution_notes: resolutionNotes,
      resolution_type: resolutionType,
      follow_up_complete: true,
    });
    setLoading(false);
    if (result.ok) {
      toast.success("Complaint resolved");
      setResolveOpen(false);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            Actions <ChevronDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {statusOptions
            .filter((s) => s.label !== currentStatus)
            .map((s) => (
              <DropdownMenuItem key={s.value} onClick={() => updateStatus(s.label)}>
                Mark {s.label}
              </DropdownMenuItem>
            ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setResolveOpen(true);
            }}
          >
            Resolve with Notes
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Resolve Complaint</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResolve} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="res-type">Resolution Type</Label>
              <Select
                id="res-type"
                value={resolutionType}
                onChange={(e) => setResolutionType(e.target.value)}
              >
                <option value="">Select type…</option>
                {["Refund", "Rewash", "Apology", "Replacement", "No Action", "Other"].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="What was done to resolve this…"
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setResolveOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Resolve"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
