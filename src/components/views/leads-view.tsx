"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Lead } from "@/lib/sheets/types";
import { mutate, create, remove } from "@/lib/mutate";
import { isLeadPending } from "@/lib/lead-utils";
import { formatDate } from "@/lib/format";
import {
  BOOKING_SOURCE_OPTIONS,
  FOLLOW_UP_STATUS_OPTIONS,
  CONVERSION_STATUS_OPTIONS,
  SERVICE_PACKAGE_OPTIONS,
} from "@/lib/options";
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
import { Select } from "@/components/ui/select";
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

type LeadFormData = {
  leadDate: string;
  leadSource: string;
  prospectName: string;
  phoneNumber: string;
  areaSociety: string;
  interestedService: string;
  followUpStatus: string;
  conversionStatus: string;
  firstBookingDate: string;
  notes: string;
};

const emptyForm: LeadFormData = {
  leadDate: "",
  leadSource: "WhatsApp",
  prospectName: "",
  phoneNumber: "",
  areaSociety: "",
  interestedService: "",
  followUpStatus: "New",
  conversionStatus: "Not Converted",
  firstBookingDate: "",
  notes: "",
};

function leadToForm(l: Lead): LeadFormData {
  return {
    leadDate: l.leadDate,
    leadSource: l.leadSource,
    prospectName: l.prospectName,
    phoneNumber: l.phoneNumber,
    areaSociety: l.areaSociety,
    interestedService: l.interestedService ?? "",
    followUpStatus: l.followUpStatus,
    conversionStatus: l.conversionStatus,
    firstBookingDate: l.firstBookingDate ?? "",
    notes: l.notes ?? "",
  };
}

interface LeadsViewProps {
  leads: Lead[];
}

export function LeadsView({ leads }: LeadsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [followUpFilter, setFollowUpFilter] = useState("");
  const [conversionFilter, setConversionFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  // Create / Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);

  const sourceOptions = useMemo(() => {
    return Array.from(new Set(leads.map((l) => l.leadSource).filter(Boolean)))
      .sort()
      .map((s) => ({ label: s, value: s }));
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter((l) => {
      if (followUpFilter && l.followUpStatus !== followUpFilter) return false;
      if (conversionFilter && l.conversionStatus !== conversionFilter) return false;
      if (sourceFilter && l.leadSource !== sourceFilter) return false;
      if (q) {
        return (
          l.prospectName.toLowerCase().includes(q) ||
          l.phoneNumber.toLowerCase().includes(q) ||
          l.areaSociety.toLowerCase().includes(q) ||
          (l.notes?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [leads, search, followUpFilter, conversionFilter, sourceFilter]);

  const pendingCount = leads.filter((l) => isLeadPending(l.followUpStatus)).length;

  function setField(key: keyof LeadFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(lead: Lead) {
    setEditTarget(lead);
    setForm(leadToForm(lead));
    setFormOpen(true);
  }

  async function handleUpdate(lead: Lead, body: Record<string, string>, successMsg: string) {
    const result = await mutate(`/api/leads/${lead.leadId}`, body);
    if (result.ok) {
      toast.success(successMsg);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to update lead");
    }
  }

  async function handleFormSubmit() {
    if (!form.prospectName.trim()) {
      toast.error("Prospect name is required");
      return;
    }
    if (form.conversionStatus === "Converted" && !form.firstBookingDate) {
      toast.error("First booking date is required when lead is converted");
      return;
    }
    setIsSubmitting(true);
    let result;
    if (editTarget) {
      result = await mutate(`/api/leads/${editTarget.leadId}`, form);
    } else {
      result = await create("/api/leads", form);
    }
    setIsSubmitting(false);
    if (result.ok) {
      toast.success(editTarget ? "Lead updated" : "Lead created");
      setFormOpen(false);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? (editTarget ? "Failed to update" : "Failed to create"));
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const result = await remove(`/api/leads/${deleteTarget.leadId}`);
    if (result.ok) {
      toast.success(`Lead for ${deleteTarget.prospectName} deleted`);
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to delete lead");
    }
  }

  return (
    <div className="mx-auto max-w-350 px-4 py-6 space-y-4">
      <PageHeader
        title="Leads"
        description={`${leads.length} total · ${pendingCount} pending follow-up`}
        action={
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            New Lead
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, phone, area…"
          className="w-60"
        />
        <FilterSelect value={followUpFilter} onChange={setFollowUpFilter} options={FOLLOW_UP_STATUS_OPTIONS} placeholder="Follow-up status" />
        <FilterSelect value={conversionFilter} onChange={setConversionFilter} options={CONVERSION_STATUS_OPTIONS} placeholder="Conversion status" />
        <FilterSelect value={sourceFilter} onChange={setSourceFilter} options={sourceOptions} placeholder="All sources" />
        {filtered.length !== leads.length && (
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {leads.length} shown
          </span>
        )}
      </div>
      {filtered.length === 0 ? (
        <EmptyState message="No leads match your filters." />
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Service Interest</TableHead>
                <TableHead>Follow-Up</TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead>Lead Date</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => {
                const isRowPending = isLeadPending(lead.followUpStatus);
                return (
                  <TableRow
                    key={lead.leadId || `${lead.leadDate}-${lead.prospectName}`}
                    className={isRowPending ? "bg-yellow-50/50 dark:bg-yellow-900/10" : undefined}
                  >
                    <TableCell className="font-medium text-sm">{lead.prospectName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">{lead.phoneNumber}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{lead.areaSociety || "—"}</TableCell>
                    <TableCell className="text-sm">{lead.leadSource}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{lead.interestedService || "—"}</TableCell>
                    <TableCell>
                      {lead.followUpStatus ? (
                        <StatusBadge status={lead.followUpStatus} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.conversionStatus ? (
                        <StatusBadge status={lead.conversionStatus} />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(lead.leadDate)}</TableCell>
                    <TableCell className="max-w-50">
                      <p className="text-xs text-muted-foreground truncate" title={lead.notes ?? undefined}>
                        {lead.notes || "—"}
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
                          <DropdownMenuItem onSelect={() => openEdit(lead)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => handleUpdate(lead, { followUpStatus: "Contacted" }, `${lead.prospectName} marked as contacted`)}
                          >
                            Mark Contacted
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => handleUpdate(lead, { conversionStatus: "Converted" }, `${lead.prospectName} marked as converted`)}
                          >
                            Mark Converted
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => handleUpdate(lead, { followUpStatus: "Follow-Up Pending" }, `Follow-up set for ${lead.prospectName}`)}
                          >
                            Mark Follow-up Needed
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onSelect={() => setDeleteTarget(lead)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editTarget ? `Edit Lead — ${editTarget.prospectName}` : "New Lead"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Prospect Name *</Label>
              <Input value={form.prospectName} onChange={(e) => setField("prospectName", e.target.value)} placeholder="Name" />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input value={form.phoneNumber} onChange={(e) => setField("phoneNumber", e.target.value)} placeholder="Phone" />
            </div>
            <div className="space-y-1.5">
              <Label>Lead Date</Label>
              <Input type="date" value={form.leadDate} onChange={(e) => setField("leadDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Lead Source</Label>
              <Select value={form.leadSource} onChange={(e) => setField("leadSource", e.target.value)}>
                {BOOKING_SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Area / Society</Label>
              <Input value={form.areaSociety} onChange={(e) => setField("areaSociety", e.target.value)} placeholder="Society name" />
            </div>
            <div className="space-y-1.5">
              <Label>Interested Service</Label>
              <Select value={form.interestedService} onChange={(e) => setField("interestedService", e.target.value)}>
                <option value="">— select service —</option>
                {SERVICE_PACKAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Follow-Up Status</Label>
              <Select value={form.followUpStatus} onChange={(e) => setField("followUpStatus", e.target.value)}>
                {FOLLOW_UP_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Conversion Status</Label>
              <Select value={form.conversionStatus} onChange={(e) => setField("conversionStatus", e.target.value)}>
                {CONVERSION_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            {form.conversionStatus === "Converted" && (
              <div className="col-span-2 space-y-1.5">
                <Label>First Booking Date *</Label>
                <Input type="date" value={form.firstBookingDate} onChange={(e) => setField("firstBookingDate", e.target.value)} />
              </div>
            )}
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} placeholder="Any notes…" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleFormSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : editTarget ? "Save Changes" : "Create Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the lead for <span className="font-medium">{deleteTarget?.prospectName}</span>. This cannot be undone.
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
