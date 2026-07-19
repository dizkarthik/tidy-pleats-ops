import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { calculateBalanceDue, formatCurrency, formatDate } from "@/lib/orders";
import {
  activeOrderItemStatuses,
  getStatusBadgeClass,
} from "@/lib/order-status";

export const dynamic = "force-dynamic";

function numberValue(value: { toString: () => string }) {
  return Number(value.toString());
}

function getWeekStart(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const weekStart = getWeekStart(now);

  const orders = await getPrisma().order.findMany({
    include: {
      customer: {
        select: {
          name: true,
        },
      },
      items: {
        orderBy: { neededBy: "asc" },
      },
    },
    orderBy: { orderDate: "desc" },
  });

  const allItems = orders.flatMap((order) =>
    order.items.map((item) => ({
      ...item,
      orderId: order.id,
      customerName: order.customer.name,
    })),
  );
  const openItems = allItems.filter(
    (item) => item.status !== "DELIVERED" && item.status !== "CANCELLED",
  );
  const overdueItems = openItems.filter((item) => item.neededBy < todayStart);
  const dueTodayItems = openItems.filter(
    (item) => item.neededBy >= todayStart && item.neededBy <= todayEnd,
  );
  const readyItems = allItems.filter((item) => item.status === "READY");
  const statusCounts = activeOrderItemStatuses
    .filter((status) => status.value !== "DELIVERED")
    .map((status) => ({
      ...status,
      count: allItems.filter((item) => item.status === status.value).length,
    }));
  const weeklyRevenue = orders
    .filter((order) => order.orderDate >= weekStart)
    .reduce(
      (sum, order) =>
        sum +
        order.items.reduce((itemSum, item) => itemSum + numberValue(item.price), 0),
      0,
    );
  const pendingBalance = orders
    .filter((order) =>
      order.items.some(
        (item) => item.status !== "DELIVERED" && item.status !== "CANCELLED",
      ),
    )
    .reduce((sum, order) => {
      const totalPrice = order.items.reduce(
        (itemSum, item) => itemSum + numberValue(item.price),
        0,
      );

      return (
        sum +
        calculateBalanceDue({
          totalPrice,
          discountValue: numberValue(order.discountValue),
          discountType: order.discountType,
          advancePaid: numberValue(order.advancePaid),
        })
      );
    }, 0);

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-5xl px-4 py-5">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-stone-950">Dashboard</h1>
          <p className="text-sm text-stone-600">Daily order operations</p>
        </div>

        <section className="mb-5 grid gap-3 sm:grid-cols-2">
          <DashboardCard
            href="/orders?segment=overdue"
            label="Overdue"
            value={String(overdueItems.length)}
            tone="red"
            detail="Delivery date has passed"
          />
          <DashboardCard
            href="/orders?segment=due-today"
            label="Due Today"
            value={String(dueTodayItems.length)}
            tone="stone"
            detail="Delivery date is today"
          />
          <DashboardCard
            href="/orders?segment=ready"
            label="Ready for Pickup/Delivery"
            value={String(readyItems.length)}
            tone="teal"
            detail="Items currently ready"
          />
          <DashboardCard
            href="/orders"
            label="Pending Balance"
            value={formatCurrency(pendingBalance)}
            tone="stone"
            detail="Open orders only"
          />
        </section>

        <section className="mb-5 rounded-md border border-stone-200 bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold text-stone-950">
            Status Counts
          </h2>
          <div className="grid gap-2 sm:grid-cols-5">
            {statusCounts.map((status) => (
              <Link
                key={status.value}
                href={`/orders?status=${status.value}`}
                className="rounded-md border border-stone-200 bg-stone-50 px-3 py-3 hover:bg-stone-100"
              >
                <p className="text-xs font-medium uppercase text-stone-500">
                  {status.label}
                </p>
                <p className="mt-1 text-xl font-bold text-stone-950">
                  {status.count}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <DashboardCard
            href="/orders"
            label="This Week's Revenue"
            value={formatCurrency(weeklyRevenue)}
            tone="teal"
            detail={`Since ${formatDate(weekStart)}`}
          />
          <DashboardCard
            href="/orders?status=READY"
            label="Ready Items"
            value={String(readyItems.length)}
            tone="teal"
            detail="Tap to open ready orders"
          />
        </section>
      </main>
    </>
  );
}

function DashboardCard({
  href,
  label,
  value,
  detail,
  tone,
}: {
  href: string;
  label: string;
  value: string;
  detail: string;
  tone: "stone" | "teal" | "red";
}) {
  return (
    <Link
      href={href}
      className={`rounded-md border bg-white p-4 shadow-sm hover:bg-stone-50 ${getStatusBadgeClass(tone)}`}
    >
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs opacity-80">{detail}</p>
    </Link>
  );
}
