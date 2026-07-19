import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { calculateOrderTotals, formatCurrency, formatDate } from "@/lib/orders";
import { getWhatsAppHref } from "@/lib/order-status";

export const dynamic = "force-dynamic";

type PaymentsPageProps = {
  searchParams: Promise<{ sort?: string }>;
};

function isCancelledOrder(order: { items: Array<{ status: string }> }) {
  return (
    order.items.length > 0 &&
    order.items.every((item) => item.status === "CANCELLED")
  );
}

function buildPaymentReminderMessage({
  customerName,
  orderId,
  balanceDue,
}: {
  customerName: string;
  orderId: number;
  balanceDue: number;
}) {
  return `Hi ${customerName}

Quick reminder - balance due of ${formatCurrency(balanceDue)} for Order #${orderId}.

Thank you!`;
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const sortMode = params.sort === "oldest" ? "oldest" : "amount";
  const orders = await getPrisma().order.findMany({
    include: {
      customer: {
        select: {
          name: true,
          phoneNumber: true,
        },
      },
      items: {
        orderBy: { neededBy: "asc" },
      },
      payments: true,
    },
    orderBy: { orderDate: "asc" },
  });
  const dueOrders = orders
    .filter((order) => !isCancelledOrder(order))
    .map((order) => {
      const totals = calculateOrderTotals(order);

      return {
        ...order,
        ...totals,
      };
    })
    .filter((order) => order.balanceDue > 0)
    .sort((left, right) =>
      sortMode === "oldest"
        ? left.orderDate.getTime() - right.orderDate.getTime()
        : right.balanceDue - left.balanceDue,
    );
  const totalDue = dueOrders.reduce((sum, order) => sum + order.balanceDue, 0);

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-5xl px-4 py-5">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-stone-950">Dues Ledger</h1>
            <p className="text-sm text-stone-600">
              {dueOrders.length} order{dueOrders.length === 1 ? "" : "s"} with
              balance due
            </p>
          </div>
          <div className="rounded-md border border-stone-200 bg-white px-3 py-2 text-right">
            <p className="text-xs font-bold uppercase text-stone-500">
              Running Total
            </p>
            <p className="text-lg font-bold text-stone-950">
              {formatCurrency(totalDue)}
            </p>
          </div>
        </div>

        <div className="mb-4 flex rounded-md border border-stone-200 bg-white p-1">
          <Link
            href="/payments?sort=amount"
            className={`flex-1 rounded px-3 py-2 text-center text-sm font-bold ${
              sortMode === "amount"
                ? "bg-teal-700 text-white"
                : "text-stone-700 hover:bg-stone-50"
            }`}
          >
            Largest due
          </Link>
          <Link
            href="/payments?sort=oldest"
            className={`flex-1 rounded px-3 py-2 text-center text-sm font-bold ${
              sortMode === "oldest"
                ? "bg-teal-700 text-white"
                : "text-stone-700 hover:bg-stone-50"
            }`}
          >
            Oldest order
          </Link>
        </div>

        <div className="overflow-hidden rounded-md border border-stone-200 bg-white">
          {dueOrders.length > 0 ? (
            dueOrders.map((order) => {
              const reminderHref = getWhatsAppHref({
                phoneNumber: order.customer.phoneNumber,
                message: buildPaymentReminderMessage({
                  customerName: order.customer.name,
                  orderId: order.id,
                  balanceDue: order.balanceDue,
                }),
              });

              return (
                <div
                  key={order.id}
                  className="grid gap-3 border-b border-stone-100 px-3 py-4 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <Link href={`/orders/${order.id}`} className="block min-w-0">
                    <p className="text-sm font-bold text-stone-950">
                      Order #{order.id} - {order.customer.name}
                    </p>
                    <p className="mt-1 text-xs text-stone-600">
                      Ordered {formatDate(order.orderDate)} - Paid{" "}
                      {formatCurrency(order.totalPaid)} of{" "}
                      {formatCurrency(order.totalPrice)}
                    </p>
                  </Link>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-bold uppercase text-stone-500">
                        Balance Due
                      </p>
                      <p className="text-lg font-bold text-red-700">
                        {formatCurrency(order.balanceDue)}
                      </p>
                    </div>
                    <a
                      href={reminderHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 items-center rounded-md border border-teal-200 bg-teal-50 px-3 text-sm font-bold text-teal-700 hover:bg-teal-100"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-3 py-8 text-center text-sm text-stone-600">
              No pending dues.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
