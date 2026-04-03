"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Lead } from "@/lib/sheets/types";
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

function isLeadPending(status: string) {
  return status === "New" || status === "Follow-Up Pending";
}

interface LeadColumnActions {
  onEdit: (lead: Lead) => void;
  onMarkContacted: (lead: Lead) => void;
  onMarkConverted: (lead: Lead) => void;
  onMarkFollowUp: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  isPending: boolean;
}

export function getLeadColumns(actions: LeadColumnActions): ColumnDef<Lead>[] {
  return [
    {
      accessorKey: "prospectName",
      header: "Name",
      enableSorting: true,
      cell: ({ row }) => {
        const isPending = isLeadPending(row.original.followUpStatus);
        return (
          <span className={`font-medium text-sm${isPending ? " text-yellow-700 dark:text-yellow-400" : ""}`}>
            {row.original.prospectName}
          </span>
        );
      },
    },
    {
      accessorKey: "phoneNumber",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground font-mono">{row.original.phoneNumber}</span>
      ),
    },
    {
      accessorKey: "areaSociety",
      header: "Area",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.areaSociety || "—"}</span>
      ),
    },
    {
      accessorKey: "leadSource",
      header: "Source",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.leadSource}</span>
      ),
    },
    {
      accessorKey: "interestedService",
      header: "Service Interest",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.interestedService || "—"}</span>
      ),
    },
    {
      accessorKey: "followUpStatus",
      header: "Follow-Up",
      cell: ({ row }) =>
        row.original.followUpStatus ? (
          <StatusBadge status={row.original.followUpStatus} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "conversionStatus",
      header: "Conversion",
      cell: ({ row }) =>
        row.original.conversionStatus ? (
          <StatusBadge status={row.original.conversionStatus} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "leadDate",
      header: "Lead Date",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.leadDate}</span>
      ),
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground line-clamp-1">{row.original.notes || "—"}</span>
      ),
    },
    {
      id: "actions",
      size: 48,
      cell: ({ row }) => {
        const lead = row.original;
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
              <DropdownMenuItem onSelect={() => actions.onEdit(lead)}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                disabled={lead.followUpStatus === "Contacted"}
                onSelect={() => actions.onMarkContacted(lead)}
              >
                Mark Contacted
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={lead.conversionStatus === "Converted"}
                onSelect={() => actions.onMarkConverted(lead)}
              >
                Mark Converted
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={lead.followUpStatus === "Follow-Up Pending"}
                onSelect={() => actions.onMarkFollowUp(lead)}
              >
                Mark Follow-Up Needed
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => actions.onDelete(lead)}
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
