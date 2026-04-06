import { getLookupsAdminData } from "@/lib/db/adapters";
import { LookupsAdminView } from "@/components/views/lookups-admin-view";

export default async function LookupsPage() {
  const data = await getLookupsAdminData().catch(() => null);

  if (!data) {
    return (
      <div className="p-6 text-muted-foreground text-sm">
        Failed to load lookups.
      </div>
    );
  }

  return <LookupsAdminView data={data} />;
}
