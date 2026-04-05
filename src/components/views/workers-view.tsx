"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import type { WorkerWithSummary, SerializedLookupContext } from "@/lib/domain";
import type { SelectOptions } from "@/lib/options";
import { mutate, create, remove } from "@/lib/mutate";
import {
  STATIC_OPTIONS,
  WORKER_STATUS_OPTIONS,
  PAYOUT_TYPE_OPTIONS,
} from "@/lib/options";
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
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

type WorkerFormData = {
  worker_name: string;
  phone: string;
  primary_area_id: string;
  joining_date: string;
  status: string;
  default_payout_type: string;
  default_payout_rate: string;
  notes: string;
};

const emptyForm: WorkerFormData = {
  worker_name: "",
  phone: "",
  primary_area_id: "",
  joining_date: "",
  status: "Active",
  default_payout_type: "Per Booking",
  default_payout_rate: "0",
  notes: "",
};

function workerToForm(w: WorkerWithSummary): WorkerFormData {
  return {
    worker_name: w.worker_name,
    phone: w.phone,
    primary_area_id: w.primary_area_id,
    joining_date: w.joining_date,
    status: w.status,
    default_payout_type: w.default_payout_type,
    default_payout_rate: String(w.default_payout_rate),
    notes: w.notes,
  };
}

interface WorkersViewProps {
  workers: WorkerWithSummary[];
  serializedCtx: SerializedLookupContext | null;
  options: SelectOptions | null;
}

export function WorkersView({ workers, options }: WorkersViewProps) {
  const router = useRouter();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");

  const opts = options ?? STATIC_OPTIONS;

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setAreaFilter("");
  }

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<WorkerWithSummary | null>(null);
  const [form, setForm] = useState<WorkerFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<WorkerWithSummary | null>(
    null,
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return workers.filter((w) => {
      if (statusFilter && w.status !== statusFilter) return false;
      if (areaFilter && w.primary_area_id !== areaFilter) return false;
      if (q) {
        return (
          w.worker_name.toLowerCase().includes(q) ||
          w.phone.toLowerCase().includes(q) ||
          w.areaName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [workers, search, statusFilter, areaFilter]);

  function setField(key: keyof WorkerFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setFormOpen(true);
  }
  function openEdit(worker: WorkerWithSummary) {
    setEditTarget(worker);
    setForm(workerToForm(worker));
    setFormOpen(true);
  }

  async function handleFormSubmit() {
    if (!form.worker_name.trim()) {
      toast.error("Worker name is required");
      return;
    }
    setIsSubmitting(true);
    const body = {
      ...form,
      default_payout_rate: Number(form.default_payout_rate) || 0,
    };
    const result = editTarget
      ? await mutate(`/api/workers/${editTarget.worker_id}`, body)
      : await create("/api/workers", body);
    setIsSubmitting(false);
    if (result.ok) {
      toast.success(
        editTarget ? `${editTarget.worker_name} updated` : "Worker created",
      );
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
    const result = await remove(`/api/workers/${deleteTarget.worker_id}`);
    if (result.ok) {
      toast.success(`${deleteTarget.worker_name} deleted`);
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to delete worker");
    }
  }

  const columns = getWorkerColumns({
    onEdit: openEdit,
    onDelete: setDeleteTarget,
    isAdmin,
    isPending,
  });

  return (
    <div className="mx-auto max-w-350 px-4 py-6 space-y-4">
      <PageHeader
        title="Workers"
        description={`${workers.length} workers`}
        action={
          isAdmin ? (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              New Worker
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, phone…"
          className="w-55"
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={WORKER_STATUS_OPTIONS}
          placeholder="All statuses"
        />
        <FilterSelect
          value={areaFilter}
          onChange={setAreaFilter}
          options={opts.areas}
          placeholder="All areas"
        />
        {filtered.length !== workers.length && (
          <>
            <span className="text-xs text-muted-foreground">
              {filtered.length} of {workers.length} shown
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
        columns={columns}
        data={filtered}
        emptyMessage="No workers match your filters."
      />

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? `Edit ${editTarget.worker_name}` : "New Worker"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Worker Name *</Label>
              <Input
                value={form.worker_name}
                onChange={(e) => setField("worker_name", e.target.value)}
                placeholder="e.g. Raju"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="Mobile number"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Primary Area</Label>
              <Select
                value={form.primary_area_id}
                onChange={(e) => setField("primary_area_id", e.target.value)}
              >
                <option value="">— select area —</option>
                {opts.areas.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
              >
                {WORKER_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Joining Date</Label>
              <Input
                type="date"
                value={form.joining_date}
                onChange={(e) => setField("joining_date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Payout Type</Label>
              <Select
                value={form.default_payout_type}
                onChange={(e) =>
                  setField("default_payout_type", e.target.value)
                }
              >
                {PAYOUT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payout Rate (₹)</Label>
              <Input
                type="number"
                min="0"
                value={form.default_payout_rate}
                onChange={(e) =>
                  setField("default_payout_rate", e.target.value)
                }
                placeholder="0"
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
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFormSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? "Saving…"
                : editTarget
                  ? "Save Changes"
                  : "Create Worker"}
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
            <AlertDialogTitle>Delete worker?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <strong>{deleteTarget?.worker_name}</strong>. This cannot be
              undone.
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
