"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Lead } from "@/lib/sheets/types";
import { mutate } from "@/lib/mutate";
import { isLeadPending } from "@/lib/lead-utils";
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
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { EmptyState } from "@/components/shared/empty-state";
import { MoreHorizontal } from "lucide-react";

interface LeadsViewProps {
  leads: Lead[];
}

export function LeadsView({ leads }: LeadsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const statusOptions = useMemo(() => {
    return Array.from(new Set(leads.map((l) => l.status).filter(Boolean)))
      .sort()
      .map((s) => ({ label: s, value: s }));
  }, [leads]);

  const sourceOptions = useMemo(() => {
    return Array.from(new Set(leads.map((l) => l.source).filter(Boolean)))
      .sort()
      .map((s) => ({ label: s, value: s }));
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter((l) => {
      if (statusFilter && l.status !== statusFilter) return false;
      if (sourceFilter && l.source !== sourceFilter) return false;
      if (q) {
        return (
          l.name.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          (l.notes?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [leads, search, statusFilter, sourceFilter]);

  const pendingCount = leads.filter((l) => isLeadPending(l.status)).length;

  async function handleStatusUpdate(
    lead: Lead,
    newStatus: string,
    successMsg: string,
  ) {
    const result = await mutate(`/api/leads/${lead.id}`, { status: newStatus });
    if (result.ok) {
      toast.success(successMsg);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to update lead");
    }
  }

  return (
    <div className="mx-auto max-w-350 px-4 py-6 space-y-4">
      <PageHeader
        title="Leads"
        description={`${leads.length} total · ${pendingCount} pending follow-up`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, phone…"
          className="w-60"
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          placeholder="All statuses"
        />
        <FilterSelect
          value={sourceFilter}
          onChange={setSourceFilter}
          options={sourceOptions}
          placeholder="All sources"
        />
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
                <TableHead className="w-30">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => {
                const isRowPending = isLeadPending(lead.status);
                return (
                  <TableRow
                    key={lead.id}
                    className={
                      isRowPending
                        ? "bg-yellow-50/50 dark:bg-yellow-900/10"
                        : undefined
                    }
                  >
                    <TableCell className="font-mono text-xs">
                      {lead.id}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {lead.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lead.phone}
                    </TableCell>
                    <TableCell className="text-sm">{lead.source}</TableCell>
                    <TableCell>
                      <StatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(lead.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-60">
                      <p
                        className="text-xs text-muted-foreground truncate"
                        title={lead.notes ?? undefined}
                      >
                        {lead.notes ?? "—"}
                      </p>
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
                          <DropdownMenuItem
                            onSelect={() =>
                              handleStatusUpdate(
                                lead,
                                "contacted",
                                `${lead.name} marked as contacted`,
                              )
                            }
                          >
                            Mark Contacted
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              handleStatusUpdate(
                                lead,
                                "converted",
                                `${lead.name} marked as converted`,
                              )
                            }
                          >
                            Mark Converted
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              handleStatusUpdate(
                                lead,
                                "follow_up",
                                `Follow-up set for ${lead.name}`,
                              )
                            }
                          >
                            Mark Follow-up Needed
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
    </div>
  );
}
