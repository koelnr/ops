"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Booking } from "@/lib/sheets/types";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

interface BookingColumnActions {
  onEdit: (booking: Booking) => void;
  onAssign: (booking: Booking) => void;
  onSetBookingStatus: (id: string, status: string) => void;
  onSetPaymentStatus: (id: string, status: string) => void;
  onDelete: (booking: Booking) => void;
  isPending: boolean;
  isAdmin: boolean;
}

export function getBookingColumns(actions: BookingColumnActions): ColumnDef<Booking>[] {
  const columns: ColumnDef<Booking>[] = [
    {
      accessorKey: "bookingId",
      header: "Booking ID",
      size: 120,
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.bookingId}</span>
      ),
    },
    {
      accessorKey: "serviceDate",
      header: "Service Date",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{formatDate(row.original.serviceDate)}</span>
      ),
    },
    {
      accessorKey: "customerName",
      header: "Customer",
      enableSorting: true,
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-sm">{row.original.customerName}</div>
          <div className="text-xs text-muted-foreground">{row.original.phoneNumber}</div>
        </div>
      ),
    },
    {
      accessorKey: "carModel",
      header: "Car",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.carModel || "—"}</span>
      ),
    },
    {
      accessorKey: "timeSlot",
      header: "Time Slot",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.timeSlot || "—"}</span>
      ),
    },
    {
      accessorKey: "servicePackage",
      header: "Service",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.servicePackage}</span>
      ),
    },
    {
      accessorKey: "vehicleType",
      header: "Vehicle",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.vehicleType}</span>
      ),
    },
    {
      accessorKey: "assignedWorker",
      header: "Worker",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.assignedWorker || "—"}</span>
      ),
    },
    {
      accessorKey: "bookingStatus",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.bookingStatus} />,
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment",
      cell: ({ row }) => <StatusBadge status={row.original.paymentStatus} />,
    },
  ];

  if (actions.isAdmin) {
    columns.push({
      id: "actions",
      size: 48,
      cell: ({ row }) => {
        const booking = row.original;
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
              <DropdownMenuItem onSelect={() => actions.onEdit(booking)}>Edit</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => actions.onAssign(booking)}>Assign Worker</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Booking Status</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {["New Inquiry", "Confirmed", "Assigned", "In Progress", "Completed", "Cancelled", "Rescheduled", "Payment Pending"].map((s) => (
                    <DropdownMenuItem
                      key={s}
                      disabled={booking.bookingStatus === s}
                      onSelect={() => actions.onSetBookingStatus(booking.bookingId, s)}
                    >
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Payment Status</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {["Paid", "Partially Paid", "Pending", "Failed", "Refunded"].map((s) => (
                    <DropdownMenuItem
                      key={s}
                      disabled={booking.paymentStatus === s}
                      onSelect={() => actions.onSetPaymentStatus(booking.bookingId, s)}
                    >
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => actions.onDelete(booking)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });
  }

  return columns;
}
