"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { WorkerDailyOps } from "@/lib/sheets/types";
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
  onEdit: (worker: WorkerDailyOps) => void;
  onDelete: (worker: WorkerDailyOps) => void;
  isAdmin: boolean;
  isPending: boolean;
}

export function getWorkerColumns(actions: WorkerColumnActions): ColumnDef<WorkerDailyOps>[] {
  return [
    {
      accessorKey: "workerName",
      header: "Worker",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-medium text-sm">{row.original.workerName}</span>
      ),
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
      accessorKey: "assignedBookings",
      header: "Assigned",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="tabular-nums text-sm text-right block">{row.original.assignedBookings}</span>
      ),
    },
    {
      accessorKey: "completedBookings",
      header: "Completed",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="tabular-nums text-sm text-right block">{row.original.completedBookings}</span>
      ),
    },
    {
      accessorKey: "areaCovered",
      header: "Area",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.areaCovered || "—"}</span>
      ),
    },
    {
      accessorKey: "avgRating",
      header: "Avg Rating",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="tabular-nums text-sm">{row.original.avgRating || "—"}</span>
      ),
    },
    {
      accessorKey: "payoutDue",
      header: "Due (₹)",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="tabular-nums text-sm text-right block">₹{row.original.payoutDue}</span>
      ),
    },
    {
      accessorKey: "payoutPaid",
      header: "Paid (₹)",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="tabular-nums text-sm text-right block">₹{row.original.payoutPaid}</span>
      ),
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.notes || "—"}</span>
      ),
    },
    {
      id: "actions",
      size: 48,
      cell: ({ row }) => {
        const worker = row.original;
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
              {actions.isAdmin && (
                <DropdownMenuItem onSelect={() => actions.onEdit(worker)}>
                  Edit Record
                </DropdownMenuItem>
              )}
              {actions.isAdmin && (
                <DropdownMenuItem
                  onSelect={() => actions.onDelete(worker)}
                  className="text-destructive focus:text-destructive"
                >
                  Delete Record
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
