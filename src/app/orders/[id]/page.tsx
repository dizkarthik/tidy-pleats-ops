import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  calculateBalanceDue,
  calculateDiscountAmount,
  formatAdvancePaymentMethod,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDeliveryType,
  formatDiscountType,
  formatOrderType,
  formatPickupDrop,
} from "@/lib/orders";

export const dynamic = "force-dynamic";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

function numberValue(value: { toString: () => string }) {
  return Number(value.toString());
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-stone-100 py-3 last:border-b-0">
      <dt className="text-xs font-medium uppercase text-stone-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm text-stone-950">{value}</dd>
    </div>
  );
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const orderId = Number(id);

  if (!Number.isInteger(orderId)) {
    notFound();
  }

  const order = await getPrisma().order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      items: {
        orderBy: { sareeNumber: "asc" },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const totalPrice = order.items.reduce(
    (sum, item) => sum + numberValue(item.price),
    0,
  );
  const discountValue = numberValue(order.discountValue);
  const advancePaid = numberValue(order.advancePaid);
  const discountAmount = calculateDiscountAmount(
    totalPrice,
    discountValue,
    order.discountType,
  );
  const balanceDue = calculateBalanceDue({
    totalPrice,
    discountValue,
    discountType: order.discountType,
    advancePaid,
  });

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-4xl px-4 py-5">
        <Link
          href="/orders"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-950"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Orders
        </Link>

        <section className="mb-4 rounded-md border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5">
            <h1 className="text-2xl font-semibold text-stone-950">
              Order #{order.id}
            </h1>
            <p className="text-sm text-stone-600">
              {formatDateTime(order.orderDate)}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <dl>
              <Detail label="Order Type" value={formatOrderType(order.orderType)} />
              <Detail
                label="Delivery Type"
                value={formatDeliveryType(order.deliveryType)}
              />
              <Detail
                label="Customer"
                value={`${order.customer.name}\n${order.customer.phoneNumber}`}
              />
            </dl>
            <div className="rounded-md bg-stone-50 p-3">
              <Link
                href={`/customers/${order.customer.id}`}
                className="text-sm font-bold text-teal-700 hover:text-teal-800"
              >
                View Customer Profile
              </Link>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <SummaryTile label="Total" value={formatCurrency(totalPrice)} />
                <SummaryTile
                  label="Discount"
                  value={formatCurrency(discountAmount)}
                />
                <SummaryTile
                  label="Advance"
                  value={formatCurrency(advancePaid)}
                />
                <SummaryTile label="Due" value={formatCurrency(balanceDue)} />
              </div>
              <p className="mt-3 text-xs text-stone-600">
                Discount: {discountValue} {formatDiscountType(order.discountType)}.
                Advance: {formatAdvancePaymentMethod(order.advancePaymentMethod)}.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {order.items.map((item) => (
            <article
              key={item.id}
              className="rounded-md border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-stone-950">
                    Saree #{item.sareeNumber}
                  </h2>
                  <p className="text-sm font-bold text-teal-700">
                    {formatCurrency(numberValue(item.price))}
                  </p>
                </div>
                {item.photoUrl ? (
                  <img
                    src={item.photoUrl}
                    alt={`Saree ${item.sareeNumber}`}
                    className="h-24 w-24 rounded-md object-cover"
                  />
                ) : null}
              </div>
              <dl className="grid gap-x-4 sm:grid-cols-2">
                <Detail label="Pallu Pleats" value={String(item.palluPleats)} />
                <Detail
                  label="Center Pleats"
                  value={String(item.centerPleats)}
                />
                <Detail label="Needed By" value={formatDate(item.neededBy)} />
                <Detail
                  label="Pickup and Drop"
                  value={formatPickupDrop(item.pickupDrop)}
                />
                <Detail label="Address" value={item.address ?? "Not set"} />
                <Detail label="Saree Notes" value={item.sareeNotes ?? "Not set"} />
                <Detail
                  label="Damage Noticed"
                  value={item.damageNoticed ? "Yes" : "No"}
                />
                {item.damageNoticed ? (
                  <>
                    <Detail
                      label="Damage Notes"
                      value={item.damageNotes ?? "Not set"}
                    />
                    <Detail
                      label="Informed to Customer"
                      value={item.informedToCustomer ? "Yes" : "No"}
                    />
                  </>
                ) : null}
              </dl>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white px-3 py-2">
      <p className="text-xs font-medium uppercase text-stone-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-stone-950">{value}</p>
    </div>
  );
}
