import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import type { Prisma } from "@/generated/prisma/client";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  calculateOrderTotals,
  formatCurrency,
  formatDate,
  formatOrderType,
} from "@/lib/orders";
import {
  getOrderStatusSummary,
  getStatusBadgeClass,
  orderItemStatuses,
} from "@/lib/order-status";

export const dynamic = "force-dynamic";

type OrdersPageProps = {
  searchParams: Promise<{
    q?: string;
    orderType?: string;
    status?: string;
    segment?: string;
    from?: string;
    to?: string;
  }>;
};

function parseDateFilter(value?: string) {
  if (!value) {
    return undefined;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const orderType =
    params.orderType === "SINGLE" || params.orderType === "MULTI"
      ? params.orderType
      : "";
  const status = orderItemStatuses.find(
    (itemStatus) => itemStatus.value === params.status,
  )?.value;
  const segment = params.segment ?? "";
  const fromDate = parseDateFilter(params.from);
  const toDate = parseDateFilter(params.to);
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const segmentItemFilter: Prisma.OrderItemWhereInput | undefined =
    segment === "overdue"
      ? {
          neededBy: { lt: todayStart },
          status: { notIn: ["READY", "DELIVERED", "CANCELLED"] },
        }
      : segment === "due-today"
        ? {
            neededBy: { gte: todayStart, lte: todayEnd },
            status: { notIn: ["DELIVERED", "CANCELLED"] },
          }
        : segment === "ready"
          ? { status: "READY" }
          : undefined;
  const itemFilters: Prisma.OrderItemWhereInput[] = [
    ...(status ? [{ status }] : []),
    ...(segmentItemFilter ? [segmentItemFilter] : []),
    ...(fromDate || toDate
      ? [
          {
            neededBy: {
              ...(fromDate ? { gte: fromDate } : {}),
              ...(toDate ? { lte: toDate } : {}),
            },
          },
        ]
      : []),
  ];

  const orders = await getPrisma().order.findMany({
    where: {
      ...(orderType ? { orderType } : {}),
      ...(itemFilters.length > 0
        ? {
            AND: itemFilters.map((itemFilter) => ({
              items: { some: itemFilter },
            })),
          }
        : {}),
      ...(query
        ? {
            customer: {
              name: { contains: query, mode: "insensitive" },
            },
          }
        : {}),
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
      items: {
        orderBy: { neededBy: "asc" },
      },
      payments: true,
    },
    orderBy: { orderDate: "desc" },
  });

  const sortedOrders = orders.sort((left, right) => {
    const leftNeededBy = left.items[0]?.neededBy?.getTime() ?? Infinity;
    const rightNeededBy = right.items[0]?.neededBy?.getTime() ?? Infinity;

    return leftNeededBy - rightNeededBy;
  });

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-5xl px-4 py-5">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-stone-950">Orders</h1>
          </div>
          <Link
            href="/orders/new"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New
          </Link>
        </div>

        <form className="mb-4 grid gap-2 rounded-md border border-stone-200 bg-white p-3 sm:grid-cols-[1fr_10rem_11rem_9rem_9rem_auto]">
          {segment ? <input type="hidden" name="segment" value={segment} /> : null}
          <label className="relative block">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500"
            />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search customer"
              className="h-10 w-full rounded-md border border-stone-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </label>
          <select
            name="orderType"
            defaultValue={orderType}
            className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          >
            <option value="">All types</option>
            <option value="SINGLE">Single</option>
            <option value="MULTI">Multi</option>
          </select>
          <select
            name="status"
            defaultValue={status}
            className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          >
            <option value="">All statuses</option>
            {orderItemStatuses.map((itemStatus) => (
              <option key={itemStatus.value} value={itemStatus.value}>
                {itemStatus.label}
              </option>
            ))}
          </select>
          <input
            name="from"
            type="date"
            defaultValue={params.from ?? ""}
            className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
          <input
            name="to"
            type="date"
            defaultValue={params.to ?? ""}
            className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
          <button
            type="submit"
            className="h-10 rounded-md bg-stone-900 px-3 text-sm font-bold text-white hover:bg-stone-800"
          >
            Filter
          </button>
        </form>

        <div className="overflow-hidden rounded-md border border-stone-200 bg-white">
          {sortedOrders.length > 0 ? (
            sortedOrders.map((order) => {
              const statusSummary = getOrderStatusSummary(order.items);
              const { totalPrice, balanceDue } = calculateOrderTotals(order);
              const nearestNeededBy = order.items[0]?.neededBy;

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block border-b border-stone-100 px-3 py-4 last:border-b-0 hover:bg-stone-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-stone-950">
                        Order #{order.id} - {order.customer.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex h-6 items-center rounded-md border px-2 text-xs font-bold ${getStatusBadgeClass(statusSummary.tone)}`}
                        >
                          {statusSummary.label}
                        </span>
                        <p className="text-xs text-stone-600">
                        {formatOrderType(order.orderType)} - {order.items.length} saree
                        {order.items.length === 1 ? "" : "s"} - Needed{" "}
                        {formatDate(nearestNeededBy)}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-stone-950">
                        {formatCurrency(totalPrice)}
                      </p>
                      <p className="text-xs font-bold text-teal-700">
                        Due {formatCurrency(balanceDue)}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="px-4 py-10 text-center text-sm text-stone-500">
              No orders found.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
