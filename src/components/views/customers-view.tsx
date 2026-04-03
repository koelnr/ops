"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Customer } from "@/lib/sheets/types";
import { mutate, create } from "@/lib/mutate";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { DataTable } from "@/components/ui/data-table";
import { getCustomerColumns } from "./customers-columns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BOOKING_SOURCE_OPTIONS,
  TIME_SLOT_OPTIONS,
  SUBSCRIPTION_STATUS_OPTIONS,
} from "@/lib/options";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";

type CustomerFormData = {
  subscriptionStatus: string;
  preferredTimeSlot: string;
  preferredServices: string;
  referralSource: string;
  notes: string;
};

type CreateCustomerFormData = {
  customerName: string;
  phoneNumber: string;
  primaryArea: string;
  preferredTimeSlot: string;
  preferredServices: string;
  subscriptionStatus: string;
  referralSource: string;
  notes: string;
};

const emptyCreateForm: CreateCustomerFormData = {
  customerName: "",
  phoneNumber: "",
  primaryArea: "",
  preferredTimeSlot: "",
  preferredServices: "",
  subscriptionStatus: "",
  referralSource: "",
  notes: "",
};

function customerToForm(c: Customer): CustomerFormData {
  return {
    subscriptionStatus: c.subscriptionStatus,
    preferredTimeSlot: c.preferredTimeSlot,
    preferredServices: c.preferredServices,
    referralSource: c.referralSource,
    notes: c.notes,
  };
}

interface CustomersViewProps {
  customers: Customer[];
}

export function CustomersView({ customers }: CustomersViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState("");

  function resetFilters() {
    setSearch("");
    setSubscriptionFilter("");
  }

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCustomerFormData>(emptyCreateForm);
  const [isCreating, setIsCreating] = useState(false);

  // Edit dialog
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerFormData>({
    subscriptionStatus: "",
    preferredTimeSlot: "",
    preferredServices: "",
    referralSource: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter((c) => {
      if (subscriptionFilter && c.subscriptionStatus !== subscriptionFilter)
        return false;
      if (q) {
        return (
          c.customerName.toLowerCase().includes(q) ||
          c.phoneNumber.toLowerCase().includes(q) ||
          c.primaryArea.toLowerCase().includes(q) ||
          c.customerId.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [customers, search, subscriptionFilter]);

  function setField(key: keyof CustomerFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function setCreateField(key: keyof CreateCustomerFormData, value: string) {
    setCreateForm((f) => ({ ...f, [key]: value }));
  }

  function openEdit(customer: Customer) {
    setEditTarget(customer);
    setForm(customerToForm(customer));
  }

  async function handleCreate() {
    if (!createForm.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!createForm.phoneNumber.trim()) {
      toast.error("Phone number is required");
      return;
    }
    setIsCreating(true);
    const result = await create("/api/customers", createForm);
    setIsCreating(false);
    if (result.ok) {
      toast.success("Customer created");
      setShowCreate(false);
      setCreateForm(emptyCreateForm);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to create customer");
    }
  }

  async function handleFormSubmit() {
    if (!editTarget) return;
    setIsSubmitting(true);
    const result = await mutate(
      `/api/customers/${editTarget.customerId}`,
      form,
    );
    setIsSubmitting(false);
    if (result.ok) {
      toast.success(`Customer ${editTarget.customerName} updated`);
      setEditTarget(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to update customer");
    }
  }

  const columns = getCustomerColumns({
    onEdit: openEdit,
    isPending,
  });

  return (
    <div className="mx-auto max-w-350 px-4 py-6 space-y-4">
      <PageHeader
        title="Customers"
        description={`${customers.length} customers`}
        action={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Create Customer
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, phone, area…"
          className="w-full sm:w-60"
        />
        <FilterSelect
          value={subscriptionFilter}
          onChange={setSubscriptionFilter}
          options={SUBSCRIPTION_STATUS_OPTIONS}
          placeholder="Subscription status"
        />
        {filtered.length !== customers.length && (
          <>
            <span className="text-xs text-muted-foreground">
              {filtered.length} of {customers.length} shown
            </span>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs">
              Clear filters
            </Button>
          </>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="No customers match your filters."
      />

      {/* Create Customer Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => !open && setShowCreate(false)}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Customer</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Customer Name *</Label>
              <Input
                value={createForm.customerName}
                onChange={(e) => setCreateField("customerName", e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone Number *</Label>
              <Input
                value={createForm.phoneNumber}
                onChange={(e) => setCreateField("phoneNumber", e.target.value)}
                placeholder="10-digit mobile number"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Area / Society</Label>
              <Input
                value={createForm.primaryArea}
                onChange={(e) => setCreateField("primaryArea", e.target.value)}
                placeholder="e.g. Sector 12"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Subscription Status</Label>
              <Select
                value={createForm.subscriptionStatus}
                onChange={(e) => setCreateField("subscriptionStatus", e.target.value)}
              >
                <option value="">— select —</option>
                {SUBSCRIPTION_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Preferred Time Slot</Label>
              <Select
                value={createForm.preferredTimeSlot}
                onChange={(e) => setCreateField("preferredTimeSlot", e.target.value)}
              >
                <option value="">— select slot —</option>
                {TIME_SLOT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Referral Source</Label>
              <Select
                value={createForm.referralSource}
                onChange={(e) => setCreateField("referralSource", e.target.value)}
              >
                <option value="">— select source —</option>
                {BOOKING_SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Preferred Services</Label>
              <Input
                value={createForm.preferredServices}
                onChange={(e) => setCreateField("preferredServices", e.target.value)}
                placeholder="e.g. Exterior Wash"
              />
            </div>
            <div className="col-span-full space-y-1.5">
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
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating ? "Creating…" : "Create Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Edit Customer — {editTarget?.customerName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Subscription Status</Label>
              <Select
                value={form.subscriptionStatus}
                onChange={(e) => setField("subscriptionStatus", e.target.value)}
              >
                <option value="">— select —</option>
                {SUBSCRIPTION_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Preferred Time Slot</Label>
              <Select
                value={form.preferredTimeSlot}
                onChange={(e) => setField("preferredTimeSlot", e.target.value)}
              >
                <option value="">— select slot —</option>
                {TIME_SLOT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Preferred Services</Label>
              <Input
                value={form.preferredServices}
                onChange={(e) => setField("preferredServices", e.target.value)}
                placeholder="e.g. Exterior Wash"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Referral Source</Label>
              <Select
                value={form.referralSource}
                onChange={(e) => setField("referralSource", e.target.value)}
              >
                <option value="">— select source —</option>
                {BOOKING_SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Notes…"
                rows={3}
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
    </div>
  );
}
