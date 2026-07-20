"use client";

import Link from "next/link";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { orderItemStatuses } from "@/lib/order-status";

type OrderFilterControlsProps = {
  query: string;
  orderType: string;
  status?: string;
  segment: string;
  from?: string;
  to?: string;
};

const quickStatuses = [
  { label: "All", value: "" },
  { label: "Ready", value: "READY" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Cancelled", value: "CANCELLED" },
];

function getParamsUrl(
  currentParams: URLSearchParams,
  updates: Record<string, string | undefined>,
) {
  const params = new URLSearchParams(currentParams.toString());

  for (const [key, value] of Object.entries(updates)) {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
  }

  const queryString = params.toString();

  return queryString ? `/orders?${queryString}` : "/orders";
}

export function OrderFilterControls({
  query,
  orderType,
  status,
  segment,
  from,
  to,
}: OrderFilterControlsProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const searchParams = useSearchParams();

  return (
    <div className="mb-4 space-y-3">
      <form
        action="/orders"
        className="grid grid-cols-[1fr_auto] gap-2"
      >
        {orderType ? (
          <input type="hidden" name="orderType" value={orderType} />
        ) : null}
        {status ? <input type="hidden" name="status" value={status} /> : null}
        {segment ? <input type="hidden" name="segment" value={segment} /> : null}
        {from ? <input type="hidden" name="from" value={from} /> : null}
        {to ? <input type="hidden" name="to" value={to} /> : null}
        <label className="relative block min-w-0">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500"
          />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search customer"
            className="h-11 w-full rounded-md border border-stone-300 bg-white pl-9 pr-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
        </label>
        <button
          type="button"
          onClick={() => setIsSheetOpen(true)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-bold text-stone-700 hover:bg-stone-50"
        >
          <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
          Filter
        </button>
      </form>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {quickStatuses.map((quickStatus) => {
          const active =
            quickStatus.value === ""
              ? !status && !segment
              : status === quickStatus.value ||
                (quickStatus.value === "READY" && segment === "ready");

          return (
            <Link
              key={quickStatus.label}
              href={getParamsUrl(searchParams, {
                status: quickStatus.value,
                segment: undefined,
              })}
              className={`inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-sm font-bold ${
                active
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              {quickStatus.label}
            </Link>
          );
        })}
      </div>

      {isSheetOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-stone-950/40"
            aria-label="Close filters"
            onClick={() => setIsSheetOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-md bg-white p-4 shadow-2xl">
            <div className="mx-auto max-w-5xl">
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-stone-950">
                  Order Filters
                </h2>
                <button
                  type="button"
                  onClick={() => setIsSheetOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                  aria-label="Close filters"
                  title="Close"
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>

              <form action="/orders" className="space-y-4">
                {query ? <input type="hidden" name="q" value={query} /> : null}
                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-800">
                    Order Type
                  </span>
                  <select
                    name="orderType"
                    defaultValue={orderType}
                    className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="">All types</option>
                    <option value="SINGLE">Single</option>
                    <option value="MULTI">Multi</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-800">
                    Status
                  </span>
                  <select
                    name="status"
                    defaultValue={status ?? ""}
                    className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="">All statuses</option>
                    {orderItemStatuses.map((itemStatus) => (
                      <option key={itemStatus.value} value={itemStatus.value}>
                        {itemStatus.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-stone-800">
                    Tracking Segment
                  </span>
                  <select
                    name="segment"
                    defaultValue={segment}
                    className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="">All orders</option>
                    <option value="overdue">Overdue</option>
                    <option value="due-today">Due Today</option>
                    <option value="ready">Ready</option>
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-800">
                      From
                    </span>
                    <input
                      name="from"
                      type="date"
                      defaultValue={from ?? ""}
                      className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-800">To</span>
                    <input
                      name="to"
                      type="date"
                      defaultValue={to ?? ""}
                      className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    href={query ? `/orders?q=${encodeURIComponent(query)}` : "/orders"}
                    className="inline-flex h-11 items-center justify-center rounded-md border border-stone-300 bg-white px-3 text-sm font-bold text-stone-700 hover:bg-stone-50"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    Clear
                  </Link>
                  <button
                    type="submit"
                    className="h-11 rounded-md bg-teal-700 px-3 text-sm font-bold text-white hover:bg-teal-800"
                  >
                    Apply
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
