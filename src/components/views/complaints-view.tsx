"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Complaint, WorkerDailyOps } from "@/lib/sheets/types";
import { mutate, create, remove } from "@/lib/mutate";
import {
  COMPLAINT_TYPE_OPTIONS,
  RESOLUTION_STATUS_OPTIONS,
  REFUND_REWASH_OPTIONS,
  YES_NO_OPTIONS,
} from "@/lib/options";
import { DataTable } from "@/components/ui/data-table";
import { getComplaintColumns } from "./complaints-columns";
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
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { Plus } from "lucide-react";

type ComplaintFormData = {
  bookingId: string;
  customerName: string;
  date: string;
  workerAssigned: string;
  complaintType: string;
  complaintDetails: string;
  resolutionStatus: string;
  resolutionGiven: string;
  refundOrRewash: string;
  followUpComplete: string;
  rootCause: string;
};

const emptyForm: ComplaintFormData = {
  bookingId: "",
  customerName: "",
  date: "",
  workerAssigned: "",
  complaintType: "",
  complaintDetails: "",
  resolutionStatus: "Open",
  resolutionGiven: "",
  refundOrRewash: "None",
  followUpComplete: "No",
  rootCause: "",
};

function complaintToForm(c: Complaint): ComplaintFormData {
  return {
    bookingId: c.bookingId,
    customerName: c.customerName,
    date: c.date,
    workerAssigned: c.workerAssigned,
    complaintType: c.complaintType,
    complaintDetails: c.complaintDetails,
    resolutionStatus: c.resolutionStatus,
    resolutionGiven: c.resolutionGiven,
    refundOrRewash: c.refundOrRewash || "None",
    followUpComplete: c.followUpComplete || "No",
    rootCause: c.rootCause,
  };
}

interface ComplaintsViewProps {
  complaints: Complaint[];
  workers: WorkerDailyOps[];
}

export function ComplaintsView({ complaints, workers }: ComplaintsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
  }

  // Create / Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Complaint | null>(null);
  const [form, setForm] = useState<ComplaintFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Complaint | null>(null);

  const workerNames = useMemo(() => {
    return Array.from(
      new Set(workers.map((w) => w.workerName).filter(Boolean)),
    ).sort();
  }, [workers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return complaints.filter((c) => {
      if (statusFilter && c.resolutionStatus !== statusFilter) return false;
      if (typeFilter && c.complaintType !== typeFilter) return false;
      if (q) {
        return (
          c.complaintDetails.toLowerCase().includes(q) ||
          c.complaintId.toLowerCase().includes(q) ||
          c.customerName.toLowerCase().includes(q) ||
          c.bookingId.toLowerCase().includes(q) ||
          c.workerAssigned.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [complaints, search, statusFilter, typeFilter]);

  const unresolvedCount = complaints.filter(
    (c) =>
      !c.resolutionStatus ||
      c.resolutionStatus.toLowerCase().includes("open") ||
      c.resolutionStatus.toLowerCase().includes("pending"),
  ).length;

  function setField(key: keyof ComplaintFormData, value: string) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      // Auto-set refundOrRewash when scheduling a rewash
      if (key === "resolutionStatus" && value === "Rewash Scheduled") {
        next.refundOrRewash = "Rewash";
      }
      return next;
    });
  }

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(complaint: Complaint) {
    setEditTarget(complaint);
    setForm(complaintToForm(complaint));
    setFormOpen(true);
  }

  async function handleUpdate(
    complaint: Complaint,
    body: Record<string, string>,
    successMsg: string,
  ) {
    const result = await mutate(
      `/api/complaints/${complaint.complaintId}`,
      body,
    );
    if (result.ok) {
      toast.success(successMsg);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to update complaint");
    }
  }

  async function handleFormSubmit() {
    if (!form.customerName.trim() || !form.complaintDetails.trim()) {
      toast.error("Customer name and complaint details are required");
      return;
    }
    setIsSubmitting(true);
    let result;
    if (editTarget) {
      result = await mutate(`/api/complaints/${editTarget.complaintId}`, form);
    } else {
      result = await create("/api/complaints", form);
    }
    setIsSubmitting(false);
    if (result.ok) {
      toast.success(editTarget ? "Complaint updated" : "Complaint created");
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
    const result = await remove(`/api/complaints/${deleteTarget.complaintId}`);
    if (result.ok) {
      toast.success(`Complaint ${deleteTarget.complaintId} deleted`);
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to delete complaint");
    }
  }

  return (
    <div className="mx-auto max-w-350 px-4 py-6 space-y-4">
      <PageHeader
        title="Complaints"
        description={`${complaints.length} total · ${unresolvedCount} unresolved`}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New Complaint
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search details, ID, customer, worker…"
          className="w-70"
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={RESOLUTION_STATUS_OPTIONS}
          placeholder="Resolution status"
        />
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          options={COMPLAINT_TYPE_OPTIONS}
          placeholder="Complaint type"
        />
        {filtered.length !== complaints.length && (
          <>
            <span className="text-xs text-muted-foreground">
              {filtered.length} of {complaints.length} shown
            </span>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">
              Clear filters
            </Button>
          </>
        )}
      </div>

      <DataTable
        columns={getComplaintColumns({
          onEdit: openEdit,
          onMarkResolved: (c) =>
            handleUpdate(
              c,
              { resolutionStatus: "Resolved" },
              `Complaint ${c.complaintId} marked resolved`,
            ),
          onEscalate: (c) =>
            handleUpdate(
              c,
              { resolutionStatus: "Escalated" },
              `Complaint ${c.complaintId} escalated`,
            ),
          onScheduleRewash: (c) =>
            handleUpdate(
              c,
              { resolutionStatus: "Rewash Scheduled", refundOrRewash: "Rewash" },
              `Rewash scheduled for ${c.complaintId}`,
            ),
          onDelete: setDeleteTarget,
          isPending,
        })}
        data={[...filtered].sort((a, b) => b.date.localeCompare(a.date))}
        emptyMessage="No complaints match your filters."
      />

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget
                ? `Edit Complaint ${editTarget.complaintId}`
                : "New Complaint"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Customer Name *</Label>
              <Input
                value={form.customerName}
                onChange={(e) => setField("customerName", e.target.value)}
                placeholder="Name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Booking ID</Label>
              <Input
                value={form.bookingId}
                onChange={(e) => setField("bookingId", e.target.value)}
                placeholder="BKG-001"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setField("date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Worker Assigned</Label>
              <Select
                value={form.workerAssigned}
                onChange={(e) => setField("workerAssigned", e.target.value)}
              >
                <option value="">— select worker —</option>
                {workerNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Complaint Type</Label>
              <Select
                value={form.complaintType}
                onChange={(e) => setField("complaintType", e.target.value)}
              >
                <option value="">— select type —</option>
                {COMPLAINT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Resolution Status</Label>
              <Select
                value={form.resolutionStatus}
                onChange={(e) => setField("resolutionStatus", e.target.value)}
              >
                {RESOLUTION_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Complaint Details *</Label>
              <Textarea
                value={form.complaintDetails}
                onChange={(e) => setField("complaintDetails", e.target.value)}
                placeholder="Describe the complaint…"
                rows={2}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Resolution Given</Label>
              <Textarea
                value={form.resolutionGiven}
                onChange={(e) => setField("resolutionGiven", e.target.value)}
                placeholder="What was done to resolve…"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Refund / Rewash</Label>
              <Select
                value={form.refundOrRewash}
                onChange={(e) => setField("refundOrRewash", e.target.value)}
              >
                {REFUND_REWASH_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Follow-Up Complete</Label>
              <Select
                value={form.followUpComplete}
                onChange={(e) => setField("followUpComplete", e.target.value)}
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
              <Label>Root Cause</Label>
              <Input
                value={form.rootCause}
                onChange={(e) => setField("rootCause", e.target.value)}
                placeholder="Root cause analysis…"
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
                  : "Create Complaint"}
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
            <AlertDialogTitle>Delete complaint?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove complaint{" "}
              <span className="font-mono font-medium">
                {deleteTarget?.complaintId}
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
