import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  calculateBalanceDue,
  formatCurrency,
  formatDate,
  formatOrderType,
} from "@/lib/orders";

export const dynamic = "force-dynamic";

type OrdersPageProps = {
  searchParams: Promise<{
    q?: string;
    orderType?: string;
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

function numberValue(value: { toString: () => string }) {
  return Number(value.toString());
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const orderType =
    params.orderType === "SINGLE" || params.orderType === "MULTI"
      ? params.orderType
      : "";
  const fromDate = parseDateFilter(params.from);
  const toDate = parseDateFilter(params.to);

  const orders = await getPrisma().order.findMany({
    where: {
      ...(orderType ? { orderType } : {}),
      ...(query
        ? {
            customer: {
              name: { contains: query, mode: "insensitive" },
            },
          }
        : {}),
      ...(fromDate || toDate
        ? {
            items: {
              some: {
                neededBy: {
                  ...(fromDate ? { gte: fromDate } : {}),
                  ...(toDate ? { lte: toDate } : {}),
                },
              },
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
            <p className="text-sm text-stone-600">
              {sortedOrders.length} shown
            </p>
          </div>
          <Link
            href="/orders/new"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            New
          </Link>
        </div>

        <form className="mb-4 grid gap-2 rounded-md border border-stone-200 bg-white p-3 sm:grid-cols-[1fr_10rem_9rem_9rem_auto]">
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
              const totalPrice = order.items.reduce(
                (sum, item) => sum + numberValue(item.price),
                0,
              );
              const balanceDue = calculateBalanceDue({
                totalPrice,
                discountValue: numberValue(order.discountValue),
                discountType: order.discountType,
                advancePaid: numberValue(order.advancePaid),
              });
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
                      <p className="mt-1 text-xs text-stone-600">
                        {formatOrderType(order.orderType)} - {order.items.length} saree
                        {order.items.length === 1 ? "" : "s"} - Needed{" "}
                        {formatDate(nearestNeededBy)}
                      </p>
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
