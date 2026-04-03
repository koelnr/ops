"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Complaint } from "@/lib/sheets/types";
import { StatusBadge } from "@/components/dashboard/status-badge";
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
  onEdit: (complaint: Complaint) => void;
  onMarkResolved: (complaint: Complaint) => void;
  onEscalate: (complaint: Complaint) => void;
  onScheduleRewash: (complaint: Complaint) => void;
  onDelete: (complaint: Complaint) => void;
  isPending: boolean;
}

export function getComplaintColumns(actions: ComplaintColumnActions): ColumnDef<Complaint>[] {
  return [
    {
      accessorKey: "complaintId",
      header: "ID",
      size: 96,
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.complaintId}</span>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium text-sm">{row.original.customerName}</span>
      ),
    },
    {
      accessorKey: "bookingId",
      header: "Booking",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.bookingId}</span>
      ),
    },
    {
      accessorKey: "workerAssigned",
      header: "Worker",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.workerAssigned || "—"}</span>
      ),
    },
    {
      accessorKey: "complaintType",
      header: "Type",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.complaintType}</span>
      ),
    },
    {
      accessorKey: "complaintDetails",
      header: "Issue",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-2 max-w-48">
          {row.original.complaintDetails}
        </span>
      ),
    },
    {
      accessorKey: "resolutionGiven",
      header: "Resolution",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground line-clamp-2 max-w-40">
          {row.original.resolutionGiven || "—"}
        </span>
      ),
    },
    {
      accessorKey: "resolutionStatus",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.resolutionStatus} />,
    },
    {
      accessorKey: "date",
      header: "Date",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.date}</span>
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
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={actions.isPending}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => actions.onEdit(complaint)}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                disabled={complaint.resolutionStatus === "Resolved"}
                onSelect={() => actions.onMarkResolved(complaint)}
              >
                Mark Resolved
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={complaint.resolutionStatus === "Escalated"}
                onSelect={() => actions.onEscalate(complaint)}
              >
                Escalate
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={complaint.resolutionStatus === "Rewash Scheduled"}
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
