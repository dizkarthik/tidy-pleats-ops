import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  formatCurrency,
  formatOrderType,
  formatPaymentMethod,
} from "@/lib/orders";
import { getOrderStatusSummary, getStatusBadgeClass } from "@/lib/order-status";
import {
  formatCustomerSize,
  formatReferralKind,
  formatReferralSource,
} from "@/lib/referrals";

export const dynamic = "force-dynamic";

type CustomerProfilePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-stone-100 py-3 last:border-b-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-stone-950">{value}</dd>
    </div>
  );
}

const tabs = [
  { value: "details", label: "Details" },
  { value: "orders", label: "Order History" },
  { value: "payments", label: "Payment" },
];

export default async function CustomerProfilePage({
  params,
  searchParams,
}: CustomerProfilePageProps) {
  const user = await requireUser();
  const { id } = await params;
  const { tab } = await searchParams;
  const activeTab =
    tab === "orders" || tab === "payments" || tab === "details"
      ? tab
      : "details";
  const customer = await getPrisma().customer.findUnique({
    where: { id },
    include: {
      referredByCustomer: {
        select: {
          id: true,
          name: true,
          phoneNumber: true,
        },
      },
      orders: {
        orderBy: { orderDate: "desc" },
        include: {
          items: {
            orderBy: { neededBy: "asc" },
          },
          payments: {
            orderBy: { paymentDate: "desc" },
          },
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const referral =
    customer.referralKind === "EXISTING_CUSTOMER"
      ? customer.referredByCustomer
        ? `${customer.referredByCustomer.name} (${customer.referredByCustomer.phoneNumber})`
        : "Customer link removed"
      : formatReferralSource(customer.referralSource);
  const payments = customer.orders
    .flatMap((order) =>
      order.payments.map((payment) => ({
        ...payment,
        orderId: order.id,
      })),
    )
    .sort(
      (left, right) =>
        right.paymentDate.getTime() - left.paymentDate.getTime(),
    );
  const totalReceived = payments.reduce(
    (sum, payment) => sum + Number(payment.amount.toString()),
    0,
  );

  return (
    <>
      <AppHeader
        user={user}
        title={customer.name}
        backHref="/customers"
        editHref={`/customers/${customer.id}/edit`}
      />
      <div className="sticky top-16 z-20 border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-3xl grid-cols-3 px-4">
          {tabs.map((item) => (
            <Link
              key={item.value}
              href={`/customers/${customer.id}?tab=${item.value}`}
              className={`border-b-2 px-2 py-3 text-center text-sm font-bold ${
                activeTab === item.value
                  ? "border-teal-700 text-teal-700"
                  : "border-transparent text-stone-600 hover:text-stone-950"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <main className="mx-auto w-full max-w-3xl px-4 py-5">
        {activeTab === "details" ? (
          <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <dl>
              <Detail label="Phone number" value={customer.phoneNumber} />
              <Detail label="Location" value={customer.location ?? "Not set"} />
              <Detail label="Address" value={customer.address ?? "Not set"} />
              <Detail
                label="Birthday date"
                value={formatDate(customer.birthdayDate)}
              />
              <Detail label="Size" value={formatCustomerSize(customer.size)} />
              <Detail
                label="Referral type"
                value={formatReferralKind(customer.referralKind)}
              />
              <Detail label="Referred by" value={referral} />
              <Detail label="Notes" value={customer.notes ?? "Not set"} />
              <Detail label="Date added" value={formatDate(customer.dateAdded)} />
            </dl>
          </section>
        ) : null}

        {activeTab === "orders" ? (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <h1 className="text-xl font-semibold text-stone-950">
                Order History
              </h1>
              <span className="inline-flex h-7 items-center rounded-full border border-teal-200 bg-teal-50 px-2.5 text-sm font-bold text-teal-700">
                {customer.orders.length}
              </span>
            </div>
            <div className="overflow-hidden rounded-md border border-stone-200 bg-white">
              {customer.orders.length > 0 ? (
                customer.orders.map((order) => {
                  const statusSummary = getOrderStatusSummary(order.items);
                  const nearestNeededBy = order.items[0]?.neededBy;

                  return (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="block border-b border-stone-100 px-3 py-4 last:border-b-0 hover:bg-stone-50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-stone-950">
                          Order #{order.id}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex h-6 items-center rounded-md border px-2 text-xs font-bold ${getStatusBadgeClass(
                              statusSummary.tone,
                            )}`}
                          >
                            {statusSummary.label}
                          </span>
                          <p className="text-xs text-stone-600">
                            {formatOrderType(order.orderType)} -{" "}
                            {order.items.length} saree
                            {order.items.length === 1 ? "" : "s"} - Delivery{" "}
                            {formatDate(nearestNeededBy)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="px-4 py-10 text-center text-sm text-stone-500">
                  No orders received from this customer yet.
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "payments" ? (
          <section>
            <div className="mb-4 rounded-md border border-teal-200 bg-teal-50 p-4">
              <p className="text-xs font-bold uppercase text-teal-700">
                Total Payment Received
              </p>
              <p className="mt-1 text-2xl font-bold text-teal-900">
                {formatCurrency(totalReceived)}
              </p>
            </div>
            <div className="overflow-hidden rounded-md border border-stone-200 bg-white">
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <Link
                    key={payment.id}
                    href={`/orders/${payment.orderId}`}
                    className="block border-b border-stone-100 px-3 py-4 last:border-b-0 hover:bg-stone-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-stone-950">
                          Order #{payment.orderId}
                        </p>
                        <p className="mt-1 text-xs text-stone-600">
                          {formatDate(payment.paymentDate)} -{" "}
                          {formatPaymentMethod(payment.method)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-stone-950">
                        {formatCurrency(Number(payment.amount.toString()))}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-4 py-10 text-center text-sm text-stone-500">
                  No payments received from this customer yet.
                </div>
              )}
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
