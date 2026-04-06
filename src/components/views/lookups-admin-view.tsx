"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import type { LookupEntryAdmin, LookupsAdminData } from "@/lib/db/adapters";
import { mutate, create, remove } from "@/lib/mutate";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Plus, Pencil, Trash2 } from "lucide-react";

// ─── Collection config ────────────────────────────────────────────────────────

type CollectionKey = keyof LookupsAdminData;

type FieldDef = {
  key: string;
  label: string;
  type: "text" | "number" | "color" | "select";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
};

type CollectionConfig = {
  title: string;
  description: string;
  nameField: string;
  fields: FieldDef[];
  subInfo?: (entry: LookupEntryAdmin) => string | null;
};

const CONFIGS: Record<CollectionKey, CollectionConfig> = {
  areas: {
    title: "Areas",
    description:
      "Service areas / zones used for customer addresses and worker assignments.",
    nameField: "name",
    fields: [
      {
        key: "name",
        label: "Name",
        type: "text",
        required: true,
        placeholder: "e.g. Koramangala",
      },
      {
        key: "city",
        label: "City",
        type: "text",
        placeholder: "e.g. Bengaluru",
      },
    ],
    subInfo: (e) => (e.city ? String(e.city) : null),
  },
  services: {
    title: "Services",
    description:
      "Car wash services offered to customers, with pricing per vehicle type.",
    nameField: "name",
    fields: [
      {
        key: "name",
        label: "Service Name",
        type: "text",
        required: true,
        placeholder: "e.g. Basic Wash",
      },
      {
        key: "category",
        label: "Category",
        type: "select",
        options: [
          { value: "one_time", label: "One Time" },
          { value: "monthly_plan", label: "Monthly Plan" },
        ],
      },
      {
        key: "pricing_sedan",
        label: "Price – Sedan (₹)",
        type: "number",
        placeholder: "0",
      },
      {
        key: "pricing_suv",
        label: "Price – SUV (₹)",
        type: "number",
        placeholder: "0",
      },
      {
        key: "washesIncluded",
        label: "Washes Included",
        type: "number",
        placeholder: "—",
      },
    ],
    subInfo: (e) => {
      const p = e.pricing as { sedan?: number; suv?: number } | undefined;
      const cat = e.category === "monthly_plan" ? "Monthly" : "One time";
      if (p?.sedan || p?.suv)
        return `${cat} · ₹${p.sedan ?? 0} / ₹${p.suv ?? 0}`;
      return cat;
    },
  },
  vehicleTypes: {
    title: "Vehicle Types",
    description:
      "Vehicle categories used for service pricing (e.g. Sedan, SUV).",
    nameField: "name",
    fields: [
      {
        key: "name",
        label: "Name",
        type: "text",
        required: true,
        placeholder: "e.g. Sedan",
      },
    ],
  },
  timeSlots: {
    title: "Time Slots",
    description: "Bookable time windows shown to customers during scheduling.",
    nameField: "label",
    fields: [
      {
        key: "label",
        label: "Label",
        type: "text",
        required: true,
        placeholder: "e.g. Morning",
      },
      {
        key: "startTime",
        label: "Start Time",
        type: "text",
        placeholder: "09:00",
      },
      { key: "endTime", label: "End Time", type: "text", placeholder: "11:00" },
    ],
    subInfo: (e) => {
      const s = e.startTime ? String(e.startTime) : null;
      const end = e.endTime ? String(e.endTime) : null;
      if (s && end) return `${s} – ${end}`;
      return null;
    },
  },
  bookingStatuses: {
    title: "Booking Statuses",
    description: "Lifecycle statuses for bookings (e.g. Confirmed, Completed).",
    nameField: "name",
    fields: [
      {
        key: "name",
        label: "Name",
        type: "text",
        required: true,
        placeholder: "e.g. Completed",
      },
      { key: "color", label: "Color", type: "color" },
      {
        key: "sortOrder",
        label: "Sort Order",
        type: "number",
        placeholder: "0",
      },
    ],
    subInfo: (e) => (e.sortOrder != null ? `Order ${e.sortOrder}` : null),
  },
  paymentStatuses: {
    title: "Payment Statuses",
    description: "Payment collection states (e.g. Paid, Pending, Overdue).",
    nameField: "name",
    fields: [
      {
        key: "name",
        label: "Name",
        type: "text",
        required: true,
        placeholder: "e.g. Paid",
      },
    ],
  },
  paymentModes: {
    title: "Payment Modes",
    description: "Methods of payment accepted (e.g. Cash, UPI, Card).",
    nameField: "name",
    fields: [
      {
        key: "name",
        label: "Name",
        type: "text",
        required: true,
        placeholder: "e.g. UPI",
      },
    ],
  },
  leadSources: {
    title: "Lead Sources",
    description: "Channels through which new leads are acquired.",
    nameField: "name",
    fields: [
      {
        key: "name",
        label: "Name",
        type: "text",
        required: true,
        placeholder: "e.g. Instagram",
      },
    ],
  },
  complaintTypes: {
    title: "Complaint Types",
    description: "Categories of customer complaints tracked in the system.",
    nameField: "name",
    fields: [
      {
        key: "name",
        label: "Name",
        type: "text",
        required: true,
        placeholder: "e.g. Missed spot",
      },
    ],
  },
};

const COLLECTION_ORDER: CollectionKey[] = [
  "areas",
  "services",
  "vehicleTypes",
  "timeSlots",
  "bookingStatuses",
  "paymentStatuses",
  "paymentModes",
  "leadSources",
  "complaintTypes",
];

// ─── Form helpers ─────────────────────────────────────────────────────────────

function entryToForm(
  entry: LookupEntryAdmin,
  fields: FieldDef[],
): Record<string, string> {
  const form: Record<string, string> = {};
  for (const f of fields) {
    if (f.key === "pricing_sedan") {
      const p = entry.pricing as { sedan?: number } | undefined;
      form[f.key] = String(p?.sedan ?? "");
    } else if (f.key === "pricing_suv") {
      const p = entry.pricing as { suv?: number } | undefined;
      form[f.key] = String(p?.suv ?? "");
    } else {
      form[f.key] = String(entry[f.key] ?? "");
    }
  }
  return form;
}

function emptyForm(fields: FieldDef[]): Record<string, string> {
  const form: Record<string, string> = {};
  for (const f of fields) form[f.key] = f.type === "color" ? "#6366f1" : "";
  return form;
}

function formToBody(
  form: Record<string, string>,
  fields: FieldDef[],
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  let sedan: number | undefined;
  let suv: number | undefined;
  for (const f of fields) {
    if (f.key === "pricing_sedan") {
      sedan = Number(form[f.key]) || 0;
    } else if (f.key === "pricing_suv") {
      suv = Number(form[f.key]) || 0;
    } else if (f.type === "number") {
      body[f.key] = Number(form[f.key]) || 0;
    } else {
      body[f.key] = form[f.key];
    }
  }
  if (sedan !== undefined || suv !== undefined) {
    body.pricing = { sedan: sedan ?? 0, suv: suv ?? 0 };
  }
  return body;
}

// ─── Entry row ────────────────────────────────────────────────────────────────

interface EntryRowProps {
  entry: LookupEntryAdmin;
  collectionKey: CollectionKey;
  isAdmin: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function EntryRow({
  entry,
  collectionKey,
  isAdmin,
  onToggle,
  onEdit,
  onDelete,
}: EntryRowProps) {
  const config = CONFIGS[collectionKey];
  const name = String(entry[config.nameField] ?? "");
  const sub = config.subInfo?.(entry) ?? null;
  const color =
    collectionKey === "bookingStatuses" && entry.color
      ? String(entry.color)
      : null;

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md px-2 py-1.5 -mx-2 transition-colors",
        "hover:bg-muted/50",
        !entry.isActive && "opacity-50",
      )}
    >
      {/* Color swatch for booking statuses */}
      {color && (
        <span
          className="shrink-0 h-2.5 w-2.5 rounded-full ring-1 ring-black/10"
          style={{ backgroundColor: color }}
        />
      )}

      {/* Name + sub-info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-none truncate">{name}</p>
        {sub && (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {sub}
          </p>
        )}
      </div>

      {/* Actions */}
      {isAdmin ? (
        <div className="flex items-center gap-1 shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Switch
                  checked={entry.isActive}
                  onCheckedChange={onToggle}
                  className="scale-90"
                />
              </TooltipTrigger>
              <TooltipContent side="top">
                {entry.isActive ? "Deactivate" : "Activate"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={onEdit}
                >
                  <Pencil />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Edit</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Delete</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : (
        <span
          className={cn(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
            entry.isActive
              ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
              : "bg-muted text-muted-foreground",
          )}
        >
          {entry.isActive ? "Active" : "Inactive"}
        </span>
      )}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

interface LookupsAdminViewProps {
  data: LookupsAdminData;
}

export function LookupsAdminView({ data }: LookupsAdminViewProps) {
  const router = useRouter();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  const [, startTransition] = useTransition();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogCollection, setDialogCollection] =
    useState<CollectionKey | null>(null);
  const [editTarget, setEditTarget] = useState<LookupEntryAdmin | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<{
    collection: CollectionKey;
    entry: LookupEntryAdmin;
  } | null>(null);

  function openAdd(collection: CollectionKey) {
    setDialogCollection(collection);
    setEditTarget(null);
    setForm(emptyForm(CONFIGS[collection].fields));
    setDialogOpen(true);
  }

  function openEdit(collection: CollectionKey, entry: LookupEntryAdmin) {
    setDialogCollection(collection);
    setEditTarget(entry);
    setForm(entryToForm(entry, CONFIGS[collection].fields));
    setDialogOpen(true);
  }

  async function handleToggle(
    collection: CollectionKey,
    entry: LookupEntryAdmin,
  ) {
    const result = await mutate(`/api/lookups/${collection}/${entry.id}`, {
      isActive: !entry.isActive,
    });
    if (result.ok) {
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to update");
    }
  }

  async function handleSubmit() {
    if (!dialogCollection) return;
    const config = CONFIGS[dialogCollection];
    if (!form[config.nameField]?.trim()) {
      toast.error(
        `${config.fields.find((f) => f.key === config.nameField)?.label ?? "Name"} is required`,
      );
      return;
    }
    setIsSubmitting(true);
    const body = formToBody(form, config.fields);
    const result = editTarget
      ? await mutate(`/api/lookups/${dialogCollection}/${editTarget.id}`, body)
      : await create(`/api/lookups/${dialogCollection}`, body);
    setIsSubmitting(false);
    if (result.ok) {
      toast.success(editTarget ? "Saved" : "Created");
      setDialogOpen(false);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to save");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { collection, entry } = deleteTarget;
    const config = CONFIGS[collection];
    const result = await remove(`/api/lookups/${collection}/${entry.id}`);
    if (result.ok) {
      toast.success(`${String(entry[config.nameField] ?? "Entry")} deleted`);
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to delete");
    }
  }

  const activeConfig = dialogCollection ? CONFIGS[dialogCollection] : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            Lookup Tables
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAdmin
              ? "Manage the reference data used across bookings, payments, and leads."
              : "Reference data used across the system. Contact an admin to make changes."}
          </p>
        </div>
      </div>

      <Separator />

      {/* Collections grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {COLLECTION_ORDER.map((key) => {
          const config = CONFIGS[key];
          const entries = data[key];
          const activeCount = entries.filter((e) => e.isActive).length;

          return (
            <Card key={key} className="flex flex-col">
              <CardHeader className="pb-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-medium">
                    {config.title}
                  </CardTitle>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {activeCount}/{entries.length}
                    </span>
                    {isAdmin && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              onClick={() => openAdd(key)}
                            >
                              <Plus />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            Add {config.title.replace(/s$/, "")}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {config.description}
                </p>
              </CardHeader>

              <Separator />

              <CardContent className="pt-2 pb-3 flex-1 max-h-[25vh] overflow-y-auto">
                {entries.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center">
                    No entries yet
                  </p>
                ) : (
                  <div className="mx-0">
                    {[...entries].sort((a, b) => (a.isActive === b.isActive ? 0 : a.isActive ? -1 : 1)).map((entry) => (
                      <EntryRow
                        key={entry.id}
                        entry={entry}
                        collectionKey={key}
                        isAdmin={isAdmin}
                        onToggle={() => handleToggle(key, entry)}
                        onEdit={() => openEdit(key, entry)}
                        onDelete={() =>
                          setDeleteTarget({ collection: key, entry })
                        }
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editTarget
                ? `Edit "${activeConfig ? String(editTarget[activeConfig.nameField] ?? "") : ""}"`
                : `New ${activeConfig?.title.replace(/s$/, "") ?? "entry"}`}
            </DialogTitle>
          </DialogHeader>

          {activeConfig && (
            <div className="space-y-4">
              {activeConfig.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required && (
                      <span className="text-destructive ml-0.5">*</span>
                    )}
                  </Label>

                  {field.type === "select" ? (
                    <Select
                      id={field.key}
                      value={form[field.key] ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [field.key]: e.target.value }))
                      }
                    >
                      <option value="">— select —</option>
                      {field.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  ) : field.type === "color" ? (
                    <div className="flex items-center gap-2">
                      <input
                        id={field.key}
                        type="color"
                        value={form[field.key] ?? "#6366f1"}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            [field.key]: e.target.value,
                          }))
                        }
                        className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-1"
                      />
                      <Input
                        value={form[field.key] ?? ""}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder="#rrggbb"
                      />
                    </div>
                  ) : (
                    <Input
                      id={field.key}
                      type={field.type === "number" ? "number" : "text"}
                      min={field.type === "number" ? "0" : undefined}
                      value={form[field.key] ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder ?? field.label}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? "Saving…"
                : editTarget
                  ? "Save Changes"
                  : "Create"}
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
            <AlertDialogTitle>Delete entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes{" "}
              <strong>
                {deleteTarget
                  ? String(
                      deleteTarget.entry[
                        CONFIGS[deleteTarget.collection].nameField
                      ] ?? "this entry",
                    )
                  : ""}
              </strong>
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
