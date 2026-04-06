"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { LeadWithContext, SerializedLookupContext } from "@/lib/domain";
import type { SelectOptions } from "@/lib/options";
import { mutate, create, remove } from "@/lib/mutate";
import {
  STATIC_OPTIONS,
  FOLLOW_UP_STATUS_OPTIONS,
  CONVERSION_STATUS_OPTIONS,
} from "@/lib/options";
import { DataTable } from "@/components/ui/data-table";
import { getLeadColumns } from "./leads-columns";
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

type LeadFormData = {
  lead_date: string;
  source_id: string;
  prospect_name: string;
  phone: string;
  area_id: string;
  interested_service_id: string;
  follow_up_status: string;
  conversion_status: string;
  converted_customer_id: string;
  notes: string;
};

const emptyForm: LeadFormData = {
  lead_date: "",
  source_id: "",
  prospect_name: "",
  phone: "",
  area_id: "",
  interested_service_id: "",
  follow_up_status: "New",
  conversion_status: "Not Converted",
  converted_customer_id: "",
  notes: "",
};

function leadToForm(l: LeadWithContext): LeadFormData {
  return {
    lead_date: l.lead_date,
    source_id: l.source_id,
    prospect_name: l.prospect_name,
    phone: l.phone,
    area_id: l.area_id,
    interested_service_id: l.interested_service_id,
    follow_up_status: l.follow_up_status,
    conversion_status: l.conversion_status,
    converted_customer_id: l.converted_customer_id,
    notes: l.notes,
  };
}

interface LeadsViewProps {
  leads: LeadWithContext[];
  serializedCtx: SerializedLookupContext | null;
  options: SelectOptions | null;
}

export function LeadsView({ leads, options }: LeadsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [followUpFilter, setFollowUpFilter] = useState("");
  const [conversionFilter, setConversionFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");

  const opts = options ?? STATIC_OPTIONS;

  function resetFilters() {
    setSearch("");
    setFollowUpFilter("");
    setConversionFilter("");
    setAreaFilter("");
  }

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LeadWithContext | null>(null);
  const [form, setForm] = useState<LeadFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<LeadWithContext | null>(
    null,
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter((l) => {
      if (followUpFilter && l.follow_up_status !== followUpFilter) return false;
      if (conversionFilter && l.conversion_status !== conversionFilter)
        return false;
      if (areaFilter && l.area_id !== areaFilter) return false;
      if (q) {
        return (
          l.prospect_name.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          l.areaName.toLowerCase().includes(q) ||
          l.notes.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [leads, search, followUpFilter, conversionFilter, areaFilter]);

  const pendingCount = leads.filter(
    (l) =>
      l.follow_up_status === "New" ||
      l.follow_up_status === "Follow-Up Pending",
  ).length;

  function setField(key: keyof LeadFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setFormOpen(true);
  }
  function openEdit(lead: LeadWithContext) {
    setEditTarget(lead);
    setForm(leadToForm(lead));
    setFormOpen(true);
  }

  async function handleUpdate(
    lead: LeadWithContext,
    body: Record<string, string>,
    msg: string,
  ) {
    const result = await mutate(`/api/leads/${lead.lead_id}`, body);
    if (result.ok) {
      toast.success(msg);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to update lead");
    }
  }

  async function handleFormSubmit() {
    if (!form.prospect_name.trim()) {
      toast.error("Prospect name is required");
      return;
    }
    setIsSubmitting(true);
    const result = editTarget
      ? await mutate(`/api/leads/${editTarget.lead_id}`, form)
      : await create("/api/leads", form);
    setIsSubmitting(false);
    if (result.ok) {
      toast.success(editTarget ? "Lead updated" : "Lead created");
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
    const result = await remove(`/api/leads/${deleteTarget.lead_id}`);
    if (result.ok) {
      toast.success(`Lead for ${deleteTarget.prospect_name} deleted`);
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
        <FilterSelect
          value={followUpFilter}
          onChange={setFollowUpFilter}
          options={FOLLOW_UP_STATUS_OPTIONS}
          placeholder="Follow-up status"
        />
        <FilterSelect
          value={conversionFilter}
          onChange={setConversionFilter}
          options={CONVERSION_STATUS_OPTIONS}
          placeholder="Conversion status"
        />
        <FilterSelect
          value={areaFilter}
          onChange={setAreaFilter}
          options={opts.areas}
          placeholder="All areas"
        />
        {filtered.length !== leads.length && (
          <>
            <span className="text-xs text-muted-foreground">
              {filtered.length} of {leads.length} shown
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
        columns={getLeadColumns({
          onEdit: openEdit,
          onMarkContacted: (lead) =>
            handleUpdate(
              lead,
              { follow_up_status: "Contacted" },
              `${lead.prospect_name} marked as contacted`,
            ),
          onMarkConverted: (lead) =>
            handleUpdate(
              lead,
              { conversion_status: "Converted" },
              `${lead.prospect_name} marked as converted`,
            ),
          onMarkFollowUp: (lead) =>
            handleUpdate(
              lead,
              { follow_up_status: "Follow-Up Pending" },
              `Follow-up set for ${lead.prospect_name}`,
            ),
          onDelete: setDeleteTarget,
          isPending,
        })}
        data={filtered}
        emptyMessage="No leads match your filters."
      />

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget
                ? `Edit Lead — ${editTarget.prospect_name}`
                : "New Lead"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Prospect Name *</Label>
              <Input
                value={form.prospect_name}
                onChange={(e) => setField("prospect_name", e.target.value)}
                placeholder="Name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="Phone"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Lead Date</Label>
              <Input
                type="date"
                value={form.lead_date}
                onChange={(e) => setField("lead_date", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Lead Source</Label>
              <Select
                value={form.source_id}
                onChange={(e) => setField("source_id", e.target.value)}
              >
                <option value="">— select source —</option>
                {opts.leadSources.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Area</Label>
              <Select
                value={form.area_id}
                onChange={(e) => setField("area_id", e.target.value)}
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
              <Label>Interested Service</Label>
              <Select
                value={form.interested_service_id}
                onChange={(e) =>
                  setField("interested_service_id", e.target.value)
                }
              >
                <option value="">— select service —</option>
                {opts.services.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Follow-Up Status</Label>
              <Select
                value={form.follow_up_status}
                onChange={(e) => setField("follow_up_status", e.target.value)}
              >
                {FOLLOW_UP_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Conversion Status</Label>
              <Select
                value={form.conversion_status}
                onChange={(e) => setField("conversion_status", e.target.value)}
              >
                {CONVERSION_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="col-span-full space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Any notes…"
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
                  : "Create Lead"}
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
            <AlertDialogTitle>Delete lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the lead for{" "}
              <span className="font-medium">{deleteTarget?.prospect_name}</span>
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
