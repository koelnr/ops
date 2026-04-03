"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Complaint } from "@/lib/sheets/types";
import { mutate } from "@/lib/mutate";
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

interface ComplaintsViewProps {
  complaints: Complaint[];
}

export function ComplaintsView({ complaints }: ComplaintsViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const statusOptions = useMemo(() => {
    return Array.from(
      new Set(complaints.map((c) => c.resolutionStatus).filter(Boolean)),
    )
      .sort()
      .map((s) => ({ label: s, value: s }));
  }, [complaints]);

  const typeOptions = useMemo(() => {
    return Array.from(
      new Set(complaints.map((c) => c.complaintType).filter(Boolean)),
    )
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

  async function handleUpdate(
    complaint: Complaint,
    body: Record<string, string>,
    successMsg: string,
  ) {
    const result = await mutate(`/api/complaints/${complaint.complaintId}`, body);
    if (result.ok) {
      toast.success(successMsg);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.error ?? "Failed to update complaint");
    }
  }

  return (
    <div className="mx-auto max-w-350 px-4 py-6 space-y-4">
      <PageHeader
        title="Complaints"
        description={`${complaints.length} total · ${unresolvedCount} unresolved`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search details, ID, customer, worker…"
          className="w-70"
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
          placeholder="Resolution status"
        />
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          options={typeOptions}
          placeholder="Complaint type"
        />
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
                    <TableCell className="font-mono text-xs">
                      {complaint.complaintId}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {complaint.customerName}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {complaint.bookingId}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {complaint.workerAssigned || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {complaint.complaintType || "—"}
                    </TableCell>
                    <TableCell className="max-w-60">
                      <p
                        className="text-sm truncate"
                        title={complaint.complaintDetails}
                      >
                        {complaint.complaintDetails}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-50">
                      <p
                        className="text-xs text-muted-foreground truncate"
                        title={complaint.resolutionGiven}
                      >
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
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(complaint.date)}
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
                                complaint,
                                { resolutionStatus: "Resolved" },
                                `Complaint ${complaint.complaintId} marked resolved`,
                              )
                            }
                          >
                            Mark Resolved
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              handleUpdate(
                                complaint,
                                { resolutionStatus: "Escalated" },
                                `Complaint ${complaint.complaintId} escalated`,
                              )
                            }
                          >
                            Escalate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() =>
                              handleUpdate(
                                complaint,
                                {
                                  resolutionStatus: "Rewash Scheduled",
                                  refundOrRewash: "Rewash",
                                },
                                `Rewash scheduled for ${complaint.complaintId}`,
                              )
                            }
                          >
                            Schedule Rewash
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
    </div>
  );
}
