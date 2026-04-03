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
  const [followUpFilter, setFollowUpFilter] = useState("");
  const [conversionFilter, setConversionFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const followUpOptions = useMemo(() => {
    return Array.from(
      new Set(leads.map((l) => l.followUpStatus).filter(Boolean)),
    )
      .sort()
      .map((s) => ({ label: s, value: s }));
  }, [leads]);

  const conversionOptions = useMemo(() => {
    return Array.from(
      new Set(leads.map((l) => l.conversionStatus).filter(Boolean)),
    )
      .sort()
      .map((s) => ({ label: s, value: s }));
  }, [leads]);

  const sourceOptions = useMemo(() => {
    return Array.from(new Set(leads.map((l) => l.leadSource).filter(Boolean)))
      .sort()
      .map((s) => ({ label: s, value: s }));
  }, [leads]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter((l) => {
      if (followUpFilter && l.followUpStatus !== followUpFilter) return false;
      if (conversionFilter && l.conversionStatus !== conversionFilter)
        return false;
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

  async function handleUpdate(
    lead: Lead,
    body: Record<string, string>,
    successMsg: string,
  ) {
    // Leads use prospectName as lookup key (URL-encoded)
    const result = await mutate(
      `/api/leads/${encodeURIComponent(lead.prospectName)}`,
      body,
    );
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
          placeholder="Search name, phone, area…"
          className="w-60"
        />
        <FilterSelect
          value={followUpFilter}
          onChange={setFollowUpFilter}
          options={followUpOptions}
          placeholder="Follow-up status"
        />
        <FilterSelect
          value={conversionFilter}
          onChange={setConversionFilter}
          options={conversionOptions}
          placeholder="Conversion status"
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
                    className={
                      isRowPending
                        ? "bg-yellow-50/50 dark:bg-yellow-900/10"
                        : undefined
                    }
                  >
                    <TableCell className="font-medium text-sm">
                      {lead.prospectName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {lead.phoneNumber}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lead.areaSociety || "—"}
                    </TableCell>
                    <TableCell className="text-sm">{lead.leadSource}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lead.interestedService || "—"}
                    </TableCell>
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
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(lead.leadDate)}
                    </TableCell>
                    <TableCell className="max-w-50">
                      <p
                        className="text-xs text-muted-foreground truncate"
                        title={lead.notes ?? undefined}
                      >
                        {lead.notes || "—"}
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
                              handleUpdate(
                                lead,
                                { followUpStatus: "Contacted" },
                                `${lead.prospectName} marked as contacted`,
                              )
                            }
                          >
                            Mark Contacted
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              handleUpdate(
                                lead,
                                { conversionStatus: "Converted" },
                                `${lead.prospectName} marked as converted`,
                              )
                            }
                          >
                            Mark Converted
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              handleUpdate(
                                lead,
                                { followUpStatus: "Follow-Up Pending" },
                                `Follow-up set for ${lead.prospectName}`,
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
