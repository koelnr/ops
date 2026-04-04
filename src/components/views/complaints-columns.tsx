"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ComplaintWithContext } from "@/lib/domain";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { formatDate } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

interface ComplaintColumnActions {
  onEdit: (complaint: ComplaintWithContext) => void;
  onMarkResolved: (complaint: ComplaintWithContext) => void;
  onEscalate: (complaint: ComplaintWithContext) => void;
  onScheduleRewash: (complaint: ComplaintWithContext) => void;
  onDelete: (complaint: ComplaintWithContext) => void;
  isPending: boolean;
}

export function getComplaintColumns(actions: ComplaintColumnActions): ColumnDef<ComplaintWithContext>[] {
  return [
    {
      accessorKey: "complaint_id",
      header: "ID",
      size: 96,
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.complaint_id}</span>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium text-sm">{row.original.customerName || "—"}</span>
      ),
    },
    {
      accessorKey: "booking_id",
      header: "Booking",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.booking_id || "—"}</span>
      ),
    },
    {
      accessorKey: "workerName",
      header: "Worker",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.workerName || "—"}</span>
      ),
    },
    {
      accessorKey: "complaintTypeLabel",
      header: "Type",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.complaintTypeLabel || "—"}</span>
      ),
    },
    {
      accessorKey: "details",
      header: "Issue",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-2 max-w-48">
          {row.original.details}
        </span>
      ),
    },
    {
      accessorKey: "resolution_notes",
      header: "Resolution",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-2 max-w-40">
          {row.original.resolution_notes || "—"}
        </span>
      ),
    },
    {
      accessorKey: "resolution_status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.resolution_status} />,
    },
    {
      accessorKey: "complaint_date",
      header: "Date",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.complaint_date)}</span>
      ),
    },
    {
      id: "actions",
      size: 48,
      cell: ({ row }) => {
        const complaint = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={actions.isPending}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => actions.onEdit(complaint)}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                disabled={complaint.resolution_status === "Resolved"}
                onSelect={() => actions.onMarkResolved(complaint)}
              >
                Mark Resolved
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={complaint.resolution_status === "Escalated"}
                onSelect={() => actions.onEscalate(complaint)}
              >
                Escalate
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={complaint.resolution_status === "Rewash Scheduled"}
                onSelect={() => actions.onScheduleRewash(complaint)}
              >
                Schedule Rewash
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => actions.onDelete(complaint)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
