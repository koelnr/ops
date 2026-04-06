import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentFollowupTable } from "@/components/tables/payment-followup-table";
import {
  getBookings,
  getPayments,
  getCustomers,
  getLookupContext,
} from "@/lib/db/adapters";
import { serializeLookupContext } from "@/lib/domain";
import { buildPendingPaymentViews } from "@/lib/selectors";
import type { Payment } from "@/lib/domain";
import { buildSelectOptions } from "@/lib/options";

interface Props {
  searchParams: Promise<{ filter?: string }>;
}

export default async function PaymentFollowupPage({ searchParams }: Props) {
  const { filter } = await searchParams;
  const activeFilter =
    filter === "follow-up" || filter === "partial" ? filter : "all";

  const [bookings, payments, customers, ctx] = await Promise.all([
    getBookings().catch(() => []),
    getPayments().catch(() => []),
    getCustomers().catch(() => []),
    getLookupContext().catch(() => null),
  ]);

  if (!ctx) {
    return (
      <div className="p-6 text-muted-foreground text-sm">
        Failed to load lookup data.
      </div>
    );
  }

  const views = buildPendingPaymentViews(
    bookings,
    payments,
    customers,
    ctx,
    activeFilter,
  );

  const paymentsByBooking: Record<string, Payment[]> = {};
  for (const p of payments) {
    if (!paymentsByBooking[p.booking_id]) paymentsByBooking[p.booking_id] = [];
    paymentsByBooking[p.booking_id].push(p);
  }

  const serialized = serializeLookupContext(ctx);
  const options = buildSelectOptions(serialized);

  const totalDue = views.reduce((s, v) => s + v.amountDue, 0);
  const followUpCount = views.filter((v) => v.followUpRequired).length;

  const filterLinks = [
    { label: "All", value: "all" },
    { label: "Follow-up Required", value: "follow-up" },
    { label: "Partial", value: "partial" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/payments">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Payment Follow-up</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {views.length} pending · ₹{totalDue.toLocaleString("en-IN")}{" "}
            outstanding
            {followUpCount > 0 && ` · ${followUpCount} flagged`}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b">
        {filterLinks.map(({ label, value }) => (
          <Link
            key={value}
            href={
              value === "all"
                ? "/payments/follow-up"
                : `/payments/follow-up?filter=${value}`
            }
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeFilter === value
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      <PaymentFollowupTable
        views={views}
        paymentsByBooking={paymentsByBooking}
        paymentModes={options.paymentModes}
        paymentStatuses={options.paymentStatuses}
      />
    </div>
  );
}
