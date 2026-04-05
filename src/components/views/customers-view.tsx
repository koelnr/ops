"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import type { ResolvedCustomer, SerializedLookupContext } from "@/lib/domain";
import type { SelectOptions } from "@/lib/options";
import { mutate, create, remove } from "@/lib/mutate";
import { STATIC_OPTIONS } from "@/lib/options";
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

type CustomerFormData = {
  full_name: string;
  phone: string;
  secondary_phone: string;
  area_id: string;
  full_address: string;
  landmark: string;
  acquisition_source_id: string;
  notes: string;
};

const emptyForm: CustomerFormData = {
  full_name: "",
  phone: "",
  secondary_phone: "",
  area_id: "",
  full_address: "",
  landmark: "",
  acquisition_source_id: "",
  notes: "",
};

function customerToForm(c: ResolvedCustomer): CustomerFormData {
  return {
    full_name: c.full_name,
    phone: c.phone,
    secondary_phone: c.secondary_phone,
    area_id: c.area_id,
    full_address: c.full_address,
    landmark: c.landmark,
    acquisition_source_id: c.acquisition_source_id,
    notes: c.notes,
  };
}

interface CustomersViewProps {
  resolvedCustomers: ResolvedCustomer[];
  serializedCtx: SerializedLookupContext | null;
  options: SelectOptions | null;
}

export function CustomersView({
  resolvedCustomers,
  options,
}: CustomersViewProps) {
  const router = useRouter();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");

  const opts = options ?? STATIC_OPTIONS;

  function resetFilters() {
    setSearch("");
    setAreaFilter("");
  }

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ResolvedCustomer | null>(null);
  const [form, setForm] = useState<CustomerFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ResolvedCustomer | null>(
    null,
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return resolvedCustomers.filter((c) => {
      if (areaFilter && c.area_id !== areaFilter) return false;
      if (q) {
        return (
          c.full_name.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.area_name.toLowerCase().includes(q) ||
          c.customer_id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [resolvedCustomers, search, areaFilter]);

  function setField(key: keyof CustomerFormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm);
    setFormOpen(true);
  }
  function openEdit(customer: ResolvedCustomer) {
    setEditTarget(customer);
    setForm(customerToForm(customer));
    setFormOpen(true);
  }

  async function handleFormSubmit() {
    if (!form.full_name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    setIsSubmitting(true);
    const result = editTarget
      ? await mutate(`/api/customers/${editTarget.customer_id}`, form)
      : await create("/api/customers", form);
    setIsSubmitting(false);
    if (result.ok) {
      toast.success(
        editTarget ? `${editTarget.full_name} updated` : "Customer created",
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
    const result = await remove(`/api/customers/${deleteTarget.customer_id}`);
    if (result.ok) {
      toast.success(`${deleteTarget.full_name} deleted`);
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to delete customer");
    }
  }

  const columns = getCustomerColumns({
    onEdit: openEdit,
    onDelete: setDeleteTarget,
    isPending,
    isAdmin,
  });

  return (
    <div className="mx-auto max-w-350 px-4 py-6 space-y-4">
      <PageHeader
        title="Customers"
        description={`${resolvedCustomers.length} customers`}
        action={
          isAdmin ? (
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              New Customer
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, phone, ID…"
          className="w-60"
        />
        <FilterSelect
          value={areaFilter}
          onChange={setAreaFilter}
          options={opts.areas}
          placeholder="All areas"
        />
        {filtered.length !== resolvedCustomers.length && (
          <>
            <span className="text-xs text-muted-foreground">
              {filtered.length} of {resolvedCustomers.length} shown
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
        emptyMessage="No customers match your filters."
      />

      {/* Create / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? `Edit ${editTarget.full_name}` : "New Customer"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setField("full_name", e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                placeholder="10-digit mobile"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Secondary Phone</Label>
              <Input
                value={form.secondary_phone}
                onChange={(e) => setField("secondary_phone", e.target.value)}
                placeholder="Optional"
              />
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
              <Label>Acquisition Source</Label>
              <Select
                value={form.acquisition_source_id}
                onChange={(e) =>
                  setField("acquisition_source_id", e.target.value)
                }
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
              <Label>Landmark</Label>
              <Input
                value={form.landmark}
                onChange={(e) => setField("landmark", e.target.value)}
                placeholder="Near landmark"
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Full Address</Label>
              <Input
                value={form.full_address}
                onChange={(e) => setField("full_address", e.target.value)}
                placeholder="Complete address"
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
                  : "Create Customer"}
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
            <AlertDialogTitle>Delete customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-medium">{deleteTarget?.full_name}</span>.
              This cannot be undone.
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
