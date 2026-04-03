"use client";

import { useMemo, useState } from "react";
import type { WorkerDailyOps } from "@/lib/sheets/types";
import { WorkersSummary } from "@/components/dashboard/workers-summary";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { FilterSelect } from "@/components/shared/filter-select";
import { EmptyState } from "@/components/shared/empty-state";

interface WorkersViewProps {
  workers: WorkerDailyOps[];
}

export function WorkersView({ workers }: WorkersViewProps) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const dateOptions = useMemo(() => {
    const dates = Array.from(
      new Set(workers.map((w) => w.date).filter(Boolean)),
    )
      .sort()
      .reverse();
    return dates.map((d) => ({ label: d, value: d }));
  }, [workers]);

  const workerNames = useMemo(() => {
    return Array.from(new Set(workers.map((w) => w.workerName)));
  }, [workers]);

  const filtered = useMemo(() => {
    return workers.filter((w) => {
      if (dateFilter && w.date !== dateFilter) return false;
      if (search) {
        return w.workerName.toLowerCase().includes(search.toLowerCase());
      }
      return true;
    });
  }, [workers, search, dateFilter]);

  return (
    <div className="mx-auto max-w-350 px-4 py-6 space-y-4">
      <PageHeader
        title="Workers"
        description={`${workerNames.length} workers · ${workers.length} daily ops records`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search worker name…"
          className="w-55"
        />
        <FilterSelect
          value={dateFilter}
          onChange={setDateFilter}
          options={dateOptions}
          placeholder="All dates"
        />
        {filtered.length !== workers.length && (
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {workers.length} records shown
          </span>
        )}
      </div>
      {filtered.length === 0 ? (
        <EmptyState message="No worker records match your filters." />
      ) : (
        <WorkersSummary workers={filtered} />
      )}
    </div>
  );
}
