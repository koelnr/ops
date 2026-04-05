"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddPaymentDialog } from "./add-payment-dialog";
import { mutate } from "@/lib/mutate";
import type { SelectOption } from "@/lib/domain";

interface RowActionsPaymentProps {
  bookingId: string;
  latestPaymentId: string;
  amountDue: number;
  followUpRequired: boolean;
  paymentModes: SelectOption[];
  paymentStatuses: SelectOption[];
}

export function RowActionsPayment({
  bookingId,
  latestPaymentId,
  amountDue,
  followUpRequired,
  paymentModes,
  paymentStatuses,
}: RowActionsPaymentProps) {
  const router = useRouter();

  async function toggleFollowUp() {
    if (!latestPaymentId) return;
    const result = await mutate(`/api/payments/${latestPaymentId}`, {
      follow_up_required: !followUpRequired,
    });
    if (result.ok) {
      toast.success(followUpRequired ? "Follow-up cleared" : "Follow-up flagged");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to update");
    }
  }

  return (
    <div className="flex items-center gap-1">
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-3.5 w-3.5" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={toggleFollowUp}>
            {followUpRequired ? "Clear Follow-up" : "Flag Follow-up"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/bookings/${bookingId}`}>Open Booking</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
