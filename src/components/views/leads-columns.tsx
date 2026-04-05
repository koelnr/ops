"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { LeadWithContext } from "@/lib/domain";
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

interface LeadColumnActions {
  onEdit: (lead: LeadWithContext) => void;
  onMarkContacted: (lead: LeadWithContext) => void;
  onMarkConverted: (lead: LeadWithContext) => void;
  onMarkFollowUp: (lead: LeadWithContext) => void;
  onDelete: (lead: LeadWithContext) => void;
  isPending: boolean;
}

export function getLeadColumns(
  actions: LeadColumnActions,
): ColumnDef<LeadWithContext>[] {
  return [
    {
      accessorKey: "prospect_name",
      header: "Name",
      enableSorting: true,
      cell: ({ row }) => {
        const isPending =
          row.original.follow_up_status === "New" ||
          row.original.follow_up_status === "Follow-Up Pending";
        return (
          <span
            className={`font-medium text-sm${isPending ? " text-yellow-700 dark:text-yellow-400" : ""}`}
          >
            {row.original.prospect_name}
          </span>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground font-mono">
          {row.original.phone}
        </span>
      ),
    },
    {
      accessorKey: "areaName",
      header: "Area",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.areaName || "—"}
        </span>
      ),
    },
    {
      accessorKey: "sourceLabel",
      header: "Source",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.sourceLabel || "—"}</span>
      ),
    },
    {
      accessorKey: "interestedServiceName",
      header: "Service Interest",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.interestedServiceName || "—"}
        </span>
      ),
    },
    {
      accessorKey: "follow_up_status",
      header: "Follow-Up",
      cell: ({ row }) =>
        row.original.follow_up_status ? (
          <StatusBadge status={row.original.follow_up_status} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "conversion_status",
      header: "Conversion",
      cell: ({ row }) =>
        row.original.conversion_status ? (
          <StatusBadge status={row.original.conversion_status} />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "lead_date",
      header: "Lead Date",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.lead_date)}
        </span>
      ),
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground line-clamp-1">
          {row.original.notes || "—"}
        </span>
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
              <DropdownMenuItem onSelect={() => actions.onEdit(lead)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={lead.follow_up_status === "Contacted"}
                onSelect={() => actions.onMarkContacted(lead)}
              >
                Mark Contacted
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={lead.conversion_status === "Converted"}
                onSelect={() => actions.onMarkConverted(lead)}
              >
                Mark Converted
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={lead.follow_up_status === "Follow-Up Pending"}
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
