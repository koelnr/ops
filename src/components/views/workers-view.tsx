"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import type { WorkerDailyOps } from "@/lib/sheets/types";
import { mutate, create, remove } from "@/lib/mutate";
import { WorkersSummary } from "@/components/dashboard/workers-summary";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { DataTable } from "@/components/ui/data-table";
import { getWorkerColumns } from "./workers-columns";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

type WorkerFormData = {
  payoutDue: string;
  payoutPaid: string;
  areaCovered: string;
  avgRating: string;
  lateArrivalCount: string;
  rewashCount: string;
  complaintCount: string;
  notes: string;
};

type CreateFormData = {
  workerName: string;
  date: string;
  assignedBookings: string;
  completedBookings: string;
  areaCovered: string;
  payoutDue: string;
  notes: string;
};

const emptyCreateForm: CreateFormData = {
  workerName: "",
  date: "",
  assignedBookings: "0",
  completedBookings: "0",
  areaCovered: "",
  payoutDue: "0",
  notes: "",
};

function workerToForm(w: WorkerDailyOps): WorkerFormData {
  return {
    payoutDue: String(w.payoutDue),
    payoutPaid: String(w.payoutPaid),
    areaCovered: w.areaCovered,
    avgRating: String(w.avgRating),
    lateArrivalCount: String(w.lateArrivalCount),
    rewashCount: String(w.rewashCount),
    complaintCount: String(w.complaintCount),
    notes: w.notes,
  };
}

interface WorkersViewProps {
  workers: WorkerDailyOps[];
}

export function WorkersView({ workers }: WorkersViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  function resetFilters() {
    setSearch("");
    setDateFilter("");
  }

  // Clerk user — used for UI gating only; server enforces admin on all writes
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  // Edit dialog
  const [editTarget, setEditTarget] = useState<WorkerDailyOps | null>(null);
  const [form, setForm] = useState<WorkerFormData>({
    payoutDue: "",
    payoutPaid: "",
    areaCovered: "",
    avgRating: "",
    lateArrivalCount: "",
    rewashCount: "",
    complaintCount: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormData>(emptyCreateForm);
  const [isCreating, setIsCreating] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<WorkerDailyOps | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const dateOptions = useMemo(() => {
    const dates = Array.from(
      new Set(workers.map((w) => w.date).filter(Boolean)),
    )
      .sort()
      .reverse();
    return dates.map((d) => ({ label: d, value: d }));
  }, [workers]);

  const workerNames = useMemo(() => {
    return Array.from(new Set(workers.map((w) => w.workerName)));
  }, [workers]);

  const filtered = useMemo(() => {
    return workers.filter((w) => {
      if (dateFilter && w.date !== dateFilter) return false;
      if (search)
        return w.workerName.toLowerCase().includes(search.toLowerCase());
      return true;
    });
  }, [workers, search, dateFilter]);

  function setField(key: keyof WorkerFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setCreateField(key: keyof CreateFormData, value: string) {
    setCreateForm((f) => ({ ...f, [key]: value }));
  }

  function openEdit(worker: WorkerDailyOps) {
    setEditTarget(worker);
    setForm(workerToForm(worker));
  }

  async function handleFormSubmit() {
    if (!editTarget) return;
    setIsSubmitting(true);
    const result = await mutate(`/api/workers/${editTarget.workerId}`, {
      payoutDue: Number(form.payoutDue) || 0,
      payoutPaid: Number(form.payoutPaid) || 0,
      areaCovered: form.areaCovered,
      avgRating: Number(form.avgRating) || 0,
      lateArrivalCount: Number(form.lateArrivalCount) || 0,
      rewashCount: Number(form.rewashCount) || 0,
      complaintCount: Number(form.complaintCount) || 0,
      notes: form.notes,
    });
    setIsSubmitting(false);
    if (result.ok) {
      toast.success(`Worker record updated for ${editTarget.workerName}`);
      setEditTarget(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to update worker record");
    }
  }

  async function handleCreate() {
    if (!createForm.workerName || !createForm.date) {
      toast.error("Worker name and date are required");
      return;
    }
    setIsCreating(true);
    const result = await create("/api/workers", {
      workerName: createForm.workerName,
      date: createForm.date,
      assignedBookings: Number(createForm.assignedBookings) || 0,
      completedBookings: Number(createForm.completedBookings) || 0,
      areaCovered: createForm.areaCovered,
      payoutDue: Number(createForm.payoutDue) || 0,
      notes: createForm.notes,
    });
    setIsCreating(false);
    if (result.ok) {
      toast.success(`Worker record created for ${createForm.workerName}`);
      setShowCreate(false);
      setCreateForm(emptyCreateForm);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to create worker record");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await remove(`/api/workers/${deleteTarget.workerId}`);
    setIsDeleting(false);
    if (result.ok) {
      toast.success(`Worker record deleted for ${deleteTarget.workerName}`);
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to delete worker record");
    }
  }

  return (
    <div className="mx-auto max-w-350 px-4 py-6 space-y-4">
      <PageHeader
        title="Workers"
        description={`${workerNames.length} workers · ${workers.length} daily ops records`}
        action={
          isAdmin ? (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1" />
              New Record
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search worker name…"
          className="w-55"
        />
        <FilterSelect
          value={dateFilter}
          onChange={setDateFilter}
          options={dateOptions}
          placeholder="All dates"
        />
        {filtered.length !== workers.length && (
          <>
            <span className="text-xs text-muted-foreground">
              {filtered.length} of {workers.length} records shown
            </span>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">
              Clear filters
            </Button>
          </>
        )}
      </div>
      {filtered.length === 0 ? null : <WorkersSummary workers={filtered} />}
      <DataTable
        columns={getWorkerColumns({ onEdit: openEdit, onDelete: setDeleteTarget, isAdmin, isPending })}
        data={filtered}
        emptyMessage="No worker records match your filters."
      />

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Edit Record — {editTarget?.workerName} ({editTarget?.date})
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Payout Due (₹)</Label>
              <Input
                type="number"
                value={form.payoutDue}
                onChange={(e) => setField("payoutDue", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payout Paid (₹)</Label>
              <Input
                type="number"
                value={form.payoutPaid}
                onChange={(e) => setField("payoutPaid", e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Area Covered</Label>
              <Input
                value={form.areaCovered}
                onChange={(e) => setField("areaCovered", e.target.value)}
                placeholder="Area / Society"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Avg Rating</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={form.avgRating}
                onChange={(e) => setField("avgRating", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Late Arrivals</Label>
              <Input
                type="number"
                value={form.lateArrivalCount}
                onChange={(e) => setField("lateArrivalCount", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Rewashes</Label>
              <Input
                type="number"
                value={form.rewashCount}
                onChange={(e) => setField("rewashCount", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Complaints</Label>
              <Input
                type="number"
                value={form.complaintCount}
                onChange={(e) => setField("complaintCount", e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Notes…"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleFormSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog — admin only */}
      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreate(false);
            setCreateForm(emptyCreateForm);
          }
        }}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>New Worker Record</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Worker Name *</Label>
              <Input
                value={createForm.workerName}
                onChange={(e) => setCreateField("workerName", e.target.value)}
                placeholder="e.g. Raju"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Date *</Label>
              <Input
                type="date"
                value={createForm.date}
                onChange={(e) => setCreateField("date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Assigned Bookings</Label>
              <Input
                type="number"
                min="0"
                value={createForm.assignedBookings}
                onChange={(e) =>
                  setCreateField("assignedBookings", e.target.value)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Completed Bookings</Label>
              <Input
                type="number"
                min="0"
                value={createForm.completedBookings}
                onChange={(e) =>
                  setCreateField("completedBookings", e.target.value)
                }
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Area Covered</Label>
              <Input
                value={createForm.areaCovered}
                onChange={(e) => setCreateField("areaCovered", e.target.value)}
                placeholder="Area / Society"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payout Due (₹)</Label>
              <Input
                type="number"
                min="0"
                value={createForm.payoutDue}
                onChange={(e) => setCreateField("payoutDue", e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={createForm.notes}
                onChange={(e) => setCreateField("notes", e.target.value)}
                placeholder="Notes…"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreate(false);
                setCreateForm(emptyCreateForm);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? "Creating…" : "Create Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation — admin only */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Worker Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the record for{" "}
              <strong>{deleteTarget?.workerName}</strong> on{" "}
              <strong>{deleteTarget?.date}</strong>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
