import Link from "next/link";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { calculateOrderTotals, formatCurrency, formatDate } from "@/lib/orders";
import {
  activeOrderItemStatuses,
  getStatusBadgeClass,
} from "@/lib/order-status";

export const dynamic = "force-dynamic";

function getWeekStart(date: Date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isDateInNextDays(value: Date | null, baseDate: Date, days: number) {
  if (!value) {
    return false;
  }

  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + days);

  for (let offset = 0; offset <= days; offset += 1) {
    const candidate = new Date(start);
    candidate.setDate(candidate.getDate() + offset);

    if (
      candidate.getMonth() === value.getMonth() &&
      candidate.getDate() === value.getDate()
    ) {
      return candidate >= start && candidate <= end;
    }
  }

  return false;
}

function isCancelledOrder(order: { items: Array<{ status: string }> }) {
  return (
    order.items.length > 0 &&
    order.items.every((item) => item.status === "CANCELLED")
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const weekStart = getWeekStart(now);
  const monthStart = getMonthStart(now);

  const [orders, customers, todayPayments] = await Promise.all([
    getPrisma().order.findMany({
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        items: {
          orderBy: { neededBy: "asc" },
        },
        payments: true,
      },
      orderBy: { orderDate: "desc" },
    }),
    getPrisma().customer.findMany({
      where: {
        OR: [
          { dateAdded: { gte: weekStart } },
          { birthdayDate: { not: null } },
          { referrals: { some: { dateAdded: { gte: monthStart } } } },
        ],
      },
      include: {
        referrals: {
          where: { dateAdded: { gte: monthStart } },
          select: { id: true },
        },
      },
    }),
    getPrisma().payment.findMany({
      where: {
        paymentDate: { gte: todayStart, lte: todayEnd },
      },
    }),
  ]);

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
  const overdueItems = openItems.filter(
    (item) => item.status !== "READY" && item.neededBy < todayStart,
  );
  const dueTodayItems = openItems.filter(
    (item) => item.neededBy >= todayStart && item.neededBy <= todayEnd,
  );
  const readyItems = allItems.filter((item) => item.status === "READY");
  const statusCounts = activeOrderItemStatuses
    .filter((status) =>
      ["BOOKED", "COLLECTED", "IN_PROGRESS", "QUALITY_CHECK"].includes(
        status.value,
      ),
    )
    .map((status) => ({
      ...status,
      count: allItems.filter((item) => item.status === status.value).length,
    }));
  const weeklyRevenue = orders
    .filter((order) => order.orderDate >= weekStart)
    .reduce(
      (sum, order) =>
        sum +
        order.items.reduce(
          (itemSum, item) => itemSum + Number(item.price.toString()),
          0,
        ),
      0,
    );
  const pendingBalance = orders
    .filter((order) => !isCancelledOrder(order))
    .reduce((sum, order) => sum + calculateOrderTotals(order).balanceDue, 0);
  const todayCollections = todayPayments.reduce(
    (total, payment) => total + Number(payment.amount),
    0,
  );
  const todayCash = todayPayments
    .filter((payment) => payment.method === "CASH")
    .reduce((total, payment) => total + Number(payment.amount), 0);
  const todayUpi = todayPayments
    .filter((payment) => payment.method === "UPI")
    .reduce((total, payment) => total + Number(payment.amount), 0);
  const newCustomersThisWeek = customers.filter(
    (customer) => customer.dateAdded >= weekStart,
  ).length;
  const upcomingBirthdays = customers.filter((customer) =>
    isDateInNextDays(customer.birthdayDate, now, 7),
  ).length;
  const topReferrer = customers
    .map((customer) => ({
      name: customer.name,
      count: customer.referrals.length,
    }))
    .sort((left, right) => right.count - left.count)[0];

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-5xl px-4 py-5">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-stone-950">Dashboard</h1>
          <p className="text-sm text-stone-600">Daily order operations</p>
        </div>

        <DashboardSection title="Needs Attention">
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
        </DashboardSection>

        <DashboardSection title="Status Overview">
          {statusCounts.map((status) => (
            <DashboardCard
              key={status.value}
              href={`/orders?status=${status.value}`}
              label={status.label}
              value={String(status.count)}
              tone="stone"
              detail="Active work only"
            />
          ))}
        </DashboardSection>

        <DashboardSection title="Financial">
          <DashboardCard
            href="/payments"
            label="Pending Dues"
            value={formatCurrency(pendingBalance)}
            tone="stone"
            detail="Open non-cancelled orders"
          />
          <DashboardCard
            href="/payments"
            label="Today's Collections"
            value={formatCurrency(todayCollections)}
            tone="teal"
            detail={`Cash ${formatCurrency(todayCash)} - UPI ${formatCurrency(todayUpi)}`}
          />
          <DashboardCard
            href="/orders"
            label="This Week's Revenue"
            value={formatCurrency(weeklyRevenue)}
            tone="teal"
            detail={`Since ${formatDate(weekStart)}`}
          />
        </DashboardSection>

        <DashboardSection title="Customers & Growth">
          <DashboardCard
            href="/customers"
            label="New Customers This Week"
            value={String(newCustomersThisWeek)}
            tone="stone"
            detail={`Since ${formatDate(weekStart)}`}
          />
          <DashboardCard
            href="/customers"
            label="Upcoming Birthdays"
            value={String(upcomingBirthdays)}
            tone="stone"
            detail="Next 7 days"
          />
          <DashboardCard
            href="/customers"
            label="Top Referrer This Month"
            value={topReferrer?.count ? topReferrer.name : "None"}
            tone="stone"
            detail={`${topReferrer?.count ?? 0} referral${
              topReferrer?.count === 1 ? "" : "s"
            }`}
          />
        </DashboardSection>
      </main>
    </>
  );
}

function DashboardSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-5">
      <h2 className="mb-3 text-lg font-semibold text-stone-950">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
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
