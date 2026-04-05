"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddPaymentDialog } from "./add-payment-dialog";
import { AssignWorkerDialog } from "./assign-worker-dialog";
import { LogComplaintDialog } from "./log-complaint-dialog";
import { mutate } from "@/lib/mutate";
import type { SelectOption } from "@/lib/domain";

interface RowActionsBookingProps {
  bookingId: string;
  bookingStatusId: string;
  currentWorkerId: string;
  amountDue: number;
  statusOptions: SelectOption[];
  workerOptions: SelectOption[];
  paymentModes: SelectOption[];
  paymentStatuses: SelectOption[];
  complaintTypes: SelectOption[];
}

export function RowActionsBooking({
  bookingId,
  currentWorkerId,
  amountDue,
  statusOptions,
  workerOptions,
  paymentModes,
  paymentStatuses,
  complaintTypes,
}: RowActionsBookingProps) {
  const router = useRouter();

  async function updateStatus(statusLabel: string) {
    const match = statusOptions.find(
      (s) => s.label.toLowerCase() === statusLabel.toLowerCase(),
    );
    if (!match) return;
    const result = await mutate(`/api/bookings/${bookingId}`, {
      booking_status_id: match.value,
    });
    if (result.ok) {
      toast.success(`Marked ${statusLabel}`);
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to update status");
    }
  }

  async function markTime(field: "actual_start_at" | "actual_end_at") {
    const result = await mutate(`/api/bookings/${bookingId}`, {
      [field]: new Date().toISOString(),
    });
    if (result.ok) {
      toast.success(
        field === "actual_start_at"
          ? "Start time recorded"
          : "End time recorded",
      );
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to update");
    }
  }

  return (
    <div className="flex items-center gap-1">
      {amountDue > 0 && (
        <AddPaymentDialog
          bookingId={bookingId}
          amountDue={amountDue}
          paymentModes={paymentModes}
          paymentStatuses={paymentStatuses}
        >
          <Button size="sm" variant="outline" className="h-7 text-xs">
            Collect
          </Button>
        </AddPaymentDialog>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-3.5 w-3.5" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => updateStatus("In Progress")}>
            Mark In Progress
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updateStatus("Completed")}>
            Mark Completed
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => markTime("actual_start_at")}>
            Record Start Time
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => markTime("actual_end_at")}>
            Record End Time
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <AssignWorkerDialog
            bookingId={bookingId}
            currentWorkerId={currentWorkerId}
            workers={workerOptions}
          >
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              Reassign Worker
            </DropdownMenuItem>
          </AssignWorkerDialog>
          <LogComplaintDialog
            bookingId={bookingId}
            complaintTypes={complaintTypes}
            workers={workerOptions}
          >
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              Log Complaint
            </DropdownMenuItem>
          </LogComplaintDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
