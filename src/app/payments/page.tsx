import { getPayments } from "@/lib/sheets/payments"
import { PaymentsView } from "@/components/views/payments-view"

export default async function PaymentsPage() {
  const payments = await getPayments().catch((err) => { console.error("[payments page]", err); return []; })
  return <PaymentsView payments={payments} />
}
