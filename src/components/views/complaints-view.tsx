"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  ResolvedComplaint,
  Worker,
  SerializedLookupContext,
} from "@/lib/domain";
import type { SelectOptions } from "@/lib/options";
import { mutate, create, remove } from "@/lib/mutate";
import { STATIC_OPTIONS, RESOLUTION_STATUS_OPTIONS } from "@/lib/options";
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
  booking_id: string;
  complaint_date: string;
  complaint_type_id: string;
  details: string;
  assigned_worker_id: string;
  resolution_type: string;
  resolution_notes: string;
  resolution_status: string;
  follow_up_complete: string;
  root_cause: string;
};

const emptyForm: ComplaintFormData = {
  booking_id: "",
  complaint_date: "",
  complaint_type_id: "",
  details: "",
  assigned_worker_id: "",
  resolution_type: "None",
  resolution_notes: "",
  resolution_status: "Open",
  follow_up_complete: "false",
  root_cause: "",
};

function complaintToForm(c: ResolvedComplaint): ComplaintFormData {
  return {
    booking_id: c.booking_id,
    complaint_date: c.complaint_date,
    complaint_type_id: c.complaint_type_id,
    details: c.details,
    assigned_worker_id: c.assigned_worker_id,
    resolution_type: c.resolution_type || "None",
    resolution_notes: c.resolution_notes,
    resolution_status: c.resolution_status,
    follow_up_complete: c.follow_up_complete ? "true" : "false",
    root_cause: c.root_cause,
  };
}

interface ComplaintsViewProps {
  resolvedComplaints: ResolvedComplaint[];
  workers: Worker[];
  serializedCtx: SerializedLookupContext | null;
  options: SelectOptions | null;
}

export function ComplaintsView({
  resolvedComplaints,
  workers,
  options,
}: ComplaintsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const opts = options ?? STATIC_OPTIONS;

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
  }

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ResolvedComplaint | null>(null);
  const [form, setForm] = useState<ComplaintFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ResolvedComplaint | null>(
    null,
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return resolvedComplaints.filter((c) => {
      if (statusFilter && c.resolution_status !== statusFilter) return false;
      if (typeFilter && c.complaint_type_id !== typeFilter) return false;
      if (q) {
        return (
          c.details.toLowerCase().includes(q) ||
          c.complaint_id.toLowerCase().includes(q) ||
          c.customer_name.toLowerCase().includes(q) ||
          c.booking_id.toLowerCase().includes(q) ||
          c.worker_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [resolvedComplaints, search, statusFilter, typeFilter]);

  const unresolvedCount = resolvedComplaints.filter(
    (c) =>
      !c.resolution_status ||
      c.resolution_status.toLowerCase().includes("open") ||
      c.resolution_status.toLowerCase().includes("pending"),
  ).length;

  function setField(key: keyof ComplaintFormData, value: string) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "resolution_status" && value === "Rewash Scheduled") {
        next.resolution_type = "Rewash";
      }
      return next;
    });
  }

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setFormOpen(true);
  }
  function openEdit(complaint: ResolvedComplaint) {
    setEditTarget(complaint);
    setForm(complaintToForm(complaint));
    setFormOpen(true);
  }

  async function handleUpdate(
    complaint: ResolvedComplaint,
    body: Record<string, string>,
    msg: string,
  ) {
    const result = await mutate(
      `/api/complaints/${complaint.complaint_id}`,
      body,
    );
    if (result.ok) {
      toast.success(msg);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to update complaint");
    }
  }

  async function handleFormSubmit() {
    if (!form.details.trim()) {
      toast.error("Complaint details are required");
      return;
    }
    setIsSubmitting(true);
    const result = editTarget
      ? await mutate(`/api/complaints/${editTarget.complaint_id}`, {
          ...form,
          follow_up_complete: form.follow_up_complete === "true",
        })
      : await create("/api/complaints", {
          ...form,
          follow_up_complete: form.follow_up_complete === "true",
        });
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
    const result = await remove(`/api/complaints/${deleteTarget.complaint_id}`);
    if (result.ok) {
      toast.success(`Complaint ${deleteTarget.complaint_id} deleted`);
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
        description={`${resolvedComplaints.length} total · ${unresolvedCount} unresolved`}
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
          options={opts.complaintTypes}
          placeholder="Complaint type"
        />
        {filtered.length !== resolvedComplaints.length && (
          <>
            <span className="text-xs text-muted-foreground">
              {filtered.length} of {resolvedComplaints.length} shown
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 text-xs"
            >
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
              { resolution_status: "Resolved" },
              `Complaint ${c.complaint_id} marked resolved`,
            ),
          onEscalate: (c) =>
            handleUpdate(
              c,
              { resolution_status: "Escalated" },
              `Complaint ${c.complaint_id} escalated`,
            ),
          onScheduleRewash: (c) =>
            handleUpdate(
              c,
              {
                resolution_status: "Rewash Scheduled",
                resolution_type: "Rewash",
              },
              `Rewash scheduled for ${c.complaint_id}`,
            ),
          onDelete: setDeleteTarget,
          isPending,
        })}
        data={[...filtered].sort((a, b) =>
          b.complaint_date.localeCompare(a.complaint_date),
        )}
        emptyMessage="No complaints match your filters."
      />

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget
                ? `Edit Complaint ${editTarget.complaint_id}`
                : "New Complaint"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Booking ID</Label>
              <Input
                value={form.booking_id}
                onChange={(e) => setField("booking_id", e.target.value)}
                placeholder="BKG-001"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.complaint_date}
                onChange={(e) => setField("complaint_date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Complaint Type</Label>
              <Select
                value={form.complaint_type_id}
                onChange={(e) => setField("complaint_type_id", e.target.value)}
              >
                <option value="">— select type —</option>
                {opts.complaintTypes.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assigned Worker</Label>
              <Select
                value={form.assigned_worker_id}
                onChange={(e) => setField("assigned_worker_id", e.target.value)}
              >
                <option value="">— unassigned —</option>
                {workers.map((w) => (
                  <option key={w.worker_id} value={w.worker_id}>
                    {w.worker_name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Resolution Status</Label>
              <Select
                value={form.resolution_status}
                onChange={(e) => setField("resolution_status", e.target.value)}
              >
                {RESOLUTION_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Resolution Type</Label>
              <Select
                value={form.resolution_type}
                onChange={(e) => setField("resolution_type", e.target.value)}
              >
                <option value="None">None</option>
                <option value="Rewash">Rewash</option>
                <option value="Refund">Refund</option>
                <option value="Apology">Apology</option>
                <option value="Discount">Discount</option>
              </Select>
            </div>
            <div className="col-span-full space-y-1.5">
              <Label>Complaint Details *</Label>
              <Textarea
                value={form.details}
                onChange={(e) => setField("details", e.target.value)}
                placeholder="Describe the complaint…"
                rows={2}
              />
            </div>
            <div className="col-span-full space-y-1.5">
              <Label>Resolution Notes</Label>
              <Textarea
                value={form.resolution_notes}
                onChange={(e) => setField("resolution_notes", e.target.value)}
                placeholder="What was done to resolve…"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Follow-Up Complete</Label>
              <Select
                value={form.follow_up_complete}
                onChange={(e) => setField("follow_up_complete", e.target.value)}
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Root Cause</Label>
              <Input
                value={form.root_cause}
                onChange={(e) => setField("root_cause", e.target.value)}
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
                {deleteTarget?.complaint_id}
              </span>
              . This cannot be undone.
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
