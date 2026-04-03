"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { WorkerDailyOps } from "@/lib/sheets/types";
import { mutate } from "@/lib/mutate";
import { formatCurrency } from "@/lib/format";
import { WorkersSummary } from "@/components/dashboard/workers-summary";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { EmptyState } from "@/components/shared/empty-state";
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
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal } from "lucide-react";

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

  // Edit dialog
  const [editTarget, setEditTarget] = useState<WorkerDailyOps | null>(null);
  const [form, setForm] = useState<WorkerFormData>({
    payoutDue: "", payoutPaid: "", areaCovered: "",
    avgRating: "", lateArrivalCount: "", rewashCount: "",
    complaintCount: "", notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dateOptions = useMemo(() => {
    const dates = Array.from(new Set(workers.map((w) => w.date).filter(Boolean)))
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
      if (search) return w.workerName.toLowerCase().includes(search.toLowerCase());
      return true;
    });
  }, [workers, search, dateFilter]);

  function setField(key: keyof WorkerFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
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

  return (
    <div className="mx-auto max-w-350 px-4 py-6 space-y-4">
      <PageHeader
        title="Workers"
        description={`${workerNames.length} workers · ${workers.length} daily ops records`}
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
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {workers.length} records shown
          </span>
        )}
      </div>
      {filtered.length === 0 ? (
        <EmptyState message="No worker records match your filters." />
      ) : (
        <>
          <WorkersSummary workers={filtered} />

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Assigned</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead className="text-right">Payout Due</TableHead>
                  <TableHead className="text-right">Payout Paid</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((worker) => (
                  <TableRow key={worker.workerId}>
                    <TableCell className="font-medium text-sm">{worker.workerName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{worker.date}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{worker.assignedBookings}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">{worker.completedBookings}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{worker.areaCovered || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                      {worker.avgRating > 0 ? worker.avgRating : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm">
                      {worker.payoutDue > 0 ? formatCurrency(worker.payoutDue) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                      {worker.payoutPaid > 0 ? formatCurrency(worker.payoutPaid) : "—"}
                    </TableCell>
                    <TableCell className="max-w-40">
                      <p className="text-xs text-muted-foreground truncate" title={worker.notes}>
                        {worker.notes || "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isPending}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => openEdit(worker)}>Edit Record</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Edit Record — {editTarget?.workerName} ({editTarget?.date})
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Payout Due (₹)</Label>
              <Input type="number" value={form.payoutDue} onChange={(e) => setField("payoutDue", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Payout Paid (₹)</Label>
              <Input type="number" value={form.payoutPaid} onChange={(e) => setField("payoutPaid", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Area Covered</Label>
              <Input value={form.areaCovered} onChange={(e) => setField("areaCovered", e.target.value)} placeholder="Area / Society" />
            </div>
            <div className="space-y-1.5">
              <Label>Avg Rating</Label>
              <Input type="number" step="0.1" min="0" max="5" value={form.avgRating} onChange={(e) => setField("avgRating", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Late Arrivals</Label>
              <Input type="number" value={form.lateArrivalCount} onChange={(e) => setField("lateArrivalCount", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Rewashes</Label>
              <Input type="number" value={form.rewashCount} onChange={(e) => setField("rewashCount", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Complaints</Label>
              <Input type="number" value={form.complaintCount} onChange={(e) => setField("complaintCount", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Notes…" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleFormSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
