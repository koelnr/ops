"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Complaint } from "@/lib/sheets/types";
import { mutate, create, remove } from "@/lib/mutate";
import { formatDate } from "@/lib/format";
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
import { StatusBadge } from "@/components/dashboard/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { EmptyState } from "@/components/shared/empty-state";
import { MoreHorizontal, Plus } from "lucide-react";

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
  refundOrRewash: "",
  followUpComplete: "",
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
    refundOrRewash: c.refundOrRewash,
    followUpComplete: c.followUpComplete,
    rootCause: c.rootCause,
  };
}

interface ComplaintsViewProps {
  complaints: Complaint[];
}

export function ComplaintsView({ complaints }: ComplaintsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Create / Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Complaint | null>(null);
  const [form, setForm] = useState<ComplaintFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Complaint | null>(null);

  const statusOptions = useMemo(() => {
    return Array.from(new Set(complaints.map((c) => c.resolutionStatus).filter(Boolean)))
      .sort()
      .map((s) => ({ label: s, value: s }));
  }, [complaints]);

  const typeOptions = useMemo(() => {
    return Array.from(new Set(complaints.map((c) => c.complaintType).filter(Boolean)))
      .sort()
      .map((s) => ({ label: s, value: s }));
  }, [complaints]);

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
    setForm((f) => ({ ...f, [key]: value }));
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

  async function handleUpdate(complaint: Complaint, body: Record<string, string>, successMsg: string) {
    const result = await mutate(`/api/complaints/${complaint.complaintId}`, body);
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
      toast.error(result.error ?? (editTarget ? "Failed to update" : "Failed to create"));
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
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={statusOptions} placeholder="Resolution status" />
        <FilterSelect value={typeFilter} onChange={setTypeFilter} options={typeOptions} placeholder="Complaint type" />
        {filtered.length !== complaints.length && (
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {complaints.length} shown
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No complaints match your filters." />
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-30">ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Booking</TableHead>
                <TableHead>Worker</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Resolution</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered
                .slice()
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((complaint) => (
                  <TableRow key={complaint.complaintId}>
                    <TableCell className="font-mono text-xs">{complaint.complaintId}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{complaint.customerName}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{complaint.bookingId}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{complaint.workerAssigned || "—"}</TableCell>
                    <TableCell className="text-sm">{complaint.complaintType || "—"}</TableCell>
                    <TableCell className="max-w-60">
                      <p className="text-sm truncate" title={complaint.complaintDetails}>{complaint.complaintDetails}</p>
                    </TableCell>
                    <TableCell className="max-w-50">
                      <p className="text-xs text-muted-foreground truncate" title={complaint.resolutionGiven}>
                        {complaint.resolutionGiven || "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      {complaint.resolutionStatus ? (
                        <StatusBadge status={complaint.resolutionStatus} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(complaint.date)}</TableCell>
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
                          <DropdownMenuItem onSelect={() => openEdit(complaint)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => handleUpdate(complaint, { resolutionStatus: "Resolved" }, `Complaint ${complaint.complaintId} marked resolved`)}
                          >
                            Mark Resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => handleUpdate(complaint, { resolutionStatus: "Escalated" }, `Complaint ${complaint.complaintId} escalated`)}
                          >
                            Escalate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              handleUpdate(
                                complaint,
                                { resolutionStatus: "Rewash Scheduled", refundOrRewash: "Rewash" },
                                `Rewash scheduled for ${complaint.complaintId}`,
                              )
                            }
                          >
                            Schedule Rewash
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setDeleteTarget(complaint)}
                          >
                            Delete
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

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? `Edit Complaint ${editTarget.complaintId}` : "New Complaint"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Customer Name *</Label>
              <Input value={form.customerName} onChange={(e) => setField("customerName", e.target.value)} placeholder="Name" />
            </div>
            <div className="space-y-1.5">
              <Label>Booking ID</Label>
              <Input value={form.bookingId} onChange={(e) => setField("bookingId", e.target.value)} placeholder="BKG-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Worker Assigned</Label>
              <Input value={form.workerAssigned} onChange={(e) => setField("workerAssigned", e.target.value)} placeholder="Worker name" />
            </div>
            <div className="space-y-1.5">
              <Label>Complaint Type</Label>
              <Input value={form.complaintType} onChange={(e) => setField("complaintType", e.target.value)} placeholder="e.g. Service Quality" />
            </div>
            <div className="space-y-1.5">
              <Label>Resolution Status</Label>
              <Input value={form.resolutionStatus} onChange={(e) => setField("resolutionStatus", e.target.value)} placeholder="e.g. Open" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Complaint Details *</Label>
              <Textarea value={form.complaintDetails} onChange={(e) => setField("complaintDetails", e.target.value)} placeholder="Describe the complaint…" rows={2} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Resolution Given</Label>
              <Textarea value={form.resolutionGiven} onChange={(e) => setField("resolutionGiven", e.target.value)} placeholder="What was done to resolve…" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label>Refund / Rewash</Label>
              <Input value={form.refundOrRewash} onChange={(e) => setField("refundOrRewash", e.target.value)} placeholder="Refund / Rewash / None" />
            </div>
            <div className="space-y-1.5">
              <Label>Follow-Up Complete</Label>
              <Input value={form.followUpComplete} onChange={(e) => setField("followUpComplete", e.target.value)} placeholder="Yes / No" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Root Cause</Label>
              <Input value={form.rootCause} onChange={(e) => setField("rootCause", e.target.value)} placeholder="Root cause analysis…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleFormSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : editTarget ? "Save Changes" : "Create Complaint"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete complaint?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove complaint <span className="font-mono font-medium">{deleteTarget?.complaintId}</span> for {deleteTarget?.customerName}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
