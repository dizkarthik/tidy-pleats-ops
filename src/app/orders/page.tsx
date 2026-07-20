import Link from "next/link";
import { Plus } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { OrderFilterControls } from "@/components/order-filter-controls";
import type { Prisma } from "@/generated/prisma/client";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { formatDate } from "@/lib/orders";
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

function formatDeliveryMode(value: string) {
  return value === "MULTIPLE" ? "Multi Delivery" : "Single Delivery";
}

function formatDueIn(value: Date | null | undefined) {
  if (!value) {
    return "Due In Not set";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deliveryDate = new Date(value);
  deliveryDate.setHours(0, 0, 0, 0);
  const dayDifference = Math.round(
    (deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (dayDifference === 0) {
    return "Due Today";
  }

  if (dayDifference < 0) {
    const daysOverdue = Math.abs(dayDifference);

    return `Overdue by ${daysOverdue} day${daysOverdue === 1 ? "" : "s"}`;
  }

  return `Due In ${dayDifference} day${dayDifference === 1 ? "" : "s"}`;
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

        <OrderFilterControls
          query={query}
          orderType={orderType}
          status={status}
          segment={segment}
          from={params.from}
          to={params.to}
        />

        <div className="overflow-hidden rounded-md border border-stone-200 bg-white">
          {sortedOrders.length > 0 ? (
            sortedOrders.map((order) => {
              const statusSummary = getOrderStatusSummary(order.items);
              const nearestNeededBy = order.items[0]?.neededBy;

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block border-b border-stone-100 px-3 py-4 last:border-b-0 hover:bg-stone-50"
                >
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-stone-950">
                          {order.customer.name}
                        </p>
                        <p className="mt-1 text-xs text-stone-600">
                          {order.items.length} Saree
                          {order.items.length === 1 ? "" : "s"} -{" "}
                          {formatDeliveryMode(order.deliveryType)}
                        </p>
                        <p className="mt-1 text-xs font-medium text-stone-700">
                          Delivery Date {formatDate(nearestNeededBy)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span
                          className={`inline-flex h-6 items-center rounded-md border px-2 text-xs font-bold ${getStatusBadgeClass(statusSummary.tone)}`}
                        >
                          {statusSummary.label}
                        </span>
                        <p className="mt-1 text-xs font-bold text-stone-700">
                          {formatDueIn(nearestNeededBy)}
                        </p>
                      </div>
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
