"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Customer } from "@/lib/sheets/types";
import { mutate } from "@/lib/mutate";
import { formatCurrency, formatDate } from "@/lib/format";
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
import { MoreHorizontal } from "lucide-react";

type CustomerFormData = {
  subscriptionStatus: string;
  preferredTimeSlot: string;
  preferredServices: string;
  referralSource: string;
  notes: string;
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

  function openEdit(customer: Customer) {
    setEditTarget(customer);
    setForm(customerToForm(customer));
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

  return (
    <div className="mx-auto max-w-350 px-4 py-6 space-y-4">
      <PageHeader
        title="Customers"
        description={`${customers.length} customers`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, phone, area…"
          className="w-60"
        />
        <FilterSelect
          value={subscriptionFilter}
          onChange={setSubscriptionFilter}
          options={SUBSCRIPTION_STATUS_OPTIONS}
          placeholder="Subscription status"
        />
        {filtered.length !== customers.length && (
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {customers.length} shown
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No customers match your filters." />
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Customer ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Area</TableHead>
                <TableHead className="text-right">Bookings</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead>Last Booking</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Preferred Slot</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((customer) => (
                <TableRow key={customer.customerId}>
                  <TableCell className="font-mono text-xs">
                    {customer.customerId}
                  </TableCell>
                  <TableCell className="font-medium text-sm">
                    {customer.customerName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">
                    {customer.phoneNumber}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {customer.primaryArea || "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {customer.totalBookings}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm font-medium">
                    {customer.totalRevenue > 0
                      ? formatCurrency(customer.totalRevenue)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(customer.lastBookingDate)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {customer.subscriptionStatus || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {customer.preferredTimeSlot || "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={isPending}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => openEdit(customer)}>
                          Edit
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
