"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { WorkerWithSummary } from "@/lib/domain";
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

interface WorkerColumnActions {
  onEdit: (worker: WorkerWithSummary) => void;
  onDelete: (worker: WorkerWithSummary) => void;
  isAdmin: boolean;
  isPending: boolean;
}

export function getWorkerColumns(actions: WorkerColumnActions): ColumnDef<WorkerWithSummary>[] {
  return [
    {
      accessorKey: "worker_name",
      header: "Worker",
      enableSorting: true,
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">{row.original.worker_name}</div>
          <div className="text-xs text-muted-foreground font-mono">{row.original.phone}</div>
        </div>
      ),
    },
    {
      accessorKey: "areaName",
      header: "Area",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.areaName || "—"}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span className={`text-sm ${row.original.status === "Active" ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
          {row.original.status || "—"}
        </span>
      ),
    },
    {
      accessorKey: "assignedCount",
      header: "Assigned",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="tabular-nums text-sm text-right block">{row.original.assignedCount}</span>
      ),
    },
    {
      accessorKey: "completionRate",
      header: "Completion",
      enableSorting: true,
      cell: ({ row }) => {
        const rate = row.original.completionRate;
        const colorClass = rate >= 0.9 ? "text-green-700 dark:text-green-400" : rate >= 0.7 ? "text-yellow-700 dark:text-yellow-400" : "text-red-700 dark:text-red-400";
        return (
          <span className={`tabular-nums text-sm font-medium ${colorClass}`}>
            {row.original.assignedCount > 0 ? `${Math.round(rate * 100)}%` : "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "default_payout_type",
      header: "Payout Type",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.default_payout_type || "—"}</span>
      ),
    },
    {
      accessorKey: "joining_date",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.joining_date || "—"}</span>
      ),
    },
    {
      id: "actions",
      size: 48,
      cell: ({ row }) => {
        const worker = row.original;
        return actions.isAdmin ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={actions.isPending}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => actions.onEdit(worker)}>Edit</DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => actions.onDelete(worker)}
                className="text-destructive focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null;
      },
    },
  ];
}
