import { getPaymentsResolved } from "@/lib/sheets/payments";
import { getLookupContext } from "@/lib/sheets/lookups";
import { serializeLookupContext } from "@/lib/domain";
import { buildSelectOptions } from "@/lib/options";
import { PaymentsView } from "@/components/views/payments-view";

export default async function PaymentsPage() {
  const [resolvedPayments, ctx] = await Promise.all([
    getPaymentsResolved().catch((err) => { console.error("[payments page]", err); return []; }),
    getLookupContext().catch((err) => { console.error("[payments page] lookups", err); return null; }),
  ]);

  const serializedCtx = ctx ? serializeLookupContext(ctx) : null;
  const options = ctx ? buildSelectOptions(serializeLookupContext(ctx)) : null;

  return (
    <PaymentsView
      resolvedPayments={resolvedPayments}
      serializedCtx={serializedCtx}
      options={options}
    />
  );
}
