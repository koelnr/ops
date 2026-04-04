import { getPayments } from "@/lib/sheets/payments";
import { getBookings } from "@/lib/sheets/bookings";
import { getCustomers } from "@/lib/sheets/customers";
import { getLookupContext } from "@/lib/sheets/lookups";
import { buildPaymentWithContext } from "@/lib/selectors";
import { serializeLookupContext } from "@/lib/domain";
import { buildSelectOptions } from "@/lib/options";
import { PaymentsView } from "@/components/views/payments-view";

export default async function PaymentsPage() {
  const [payments, bookings, customers, ctx] = await Promise.all([
    getPayments().catch((err) => { console.error("[payments page]", err); return []; }),
    getBookings().catch(() => []),
    getCustomers().catch(() => []),
    getLookupContext().catch((err) => { console.error("[payments page] lookups", err); return null; }),
  ]);

  const paymentsWithContext = ctx
    ? payments.map((p) => buildPaymentWithContext(p, bookings, customers, ctx))
    : payments.map((p) => ({
        ...p,
        paymentStatusLabel: p.payment_status_id,
        paymentStatusColor: "",
        paymentModeLabel: p.payment_mode_id,
        customerName: "",
        serviceDate: "",
        finalPrice: 0,
      }));

  const serializedCtx = ctx ? serializeLookupContext(ctx) : null;
  const options = ctx ? buildSelectOptions(serializeLookupContext(ctx)) : null;

  return (
    <PaymentsView
      payments={paymentsWithContext}
      serializedCtx={serializedCtx}
      options={options}
    />
  );
}
