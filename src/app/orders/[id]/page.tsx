import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
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
import {
  formatOrderItemStatus,
  getNextStatus,
  getOrderStatusSummary,
  getPickupDropMessage,
  getStatusBadgeClass,
  getWhatsAppHref,
  orderItemStatuses,
} from "@/lib/order-status";
import {
  advanceOrderItemStatusAction,
  bulkAdvanceOrderStatusAction,
  updateOrderItemStatusAction,
} from "@/lib/status-actions";

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

function buildOrderWhatsAppMessage({
  status,
  customerName,
  itemCount,
  neededBy,
  pickupDrop,
  balanceDue,
}: {
  status: string;
  customerName: string;
  itemCount: number;
  neededBy: Date;
  pickupDrop: string;
  balanceDue: number;
}) {
  if (status === "COLLECTED") {
    return `Hi ${customerName}

Here's your quick order info,
No of Sarees: ${itemCount}
Delivery Date: ${formatDate(neededBy)}
Balance Due: ${formatCurrency(balanceDue)}

We'll begin pleating shortly!`;
  }

  return `Hi ${customerName}

Your order is ready ${getPickupDropMessage(pickupDrop)}
No of Sarees: ${itemCount}
Balance Due: ${formatCurrency(balanceDue)}`;
}

function buildItemWhatsAppMessage({
  status,
  customerName,
  orderId,
  sareeNumber,
  neededBy,
  pickupDrop,
}: {
  status: string;
  customerName: string;
  orderId: number;
  sareeNumber: number;
  neededBy: Date;
  pickupDrop: string;
}) {
  if (status === "COLLECTED") {
    return `Hi ${customerName}

Saree #${sareeNumber} (Order #${orderId}) received.
Delivery Date: ${formatDate(neededBy)}
We'll begin pleating shortly!`;
  }

  return `Hi ${customerName}

Saree #${sareeNumber} (Order #${orderId}) is ready ${getPickupDropMessage(pickupDrop)}!`;
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
        include: {
          statusHistory: {
            orderBy: { changedAt: "desc" },
            include: {
              changedBy: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
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
  const statusSummary = getOrderStatusSummary(order.items);
  const allItemsShareStatus = order.items.every(
    (item) => item.status === order.items[0]?.status,
  );
  const bulkNextStatus =
    allItemsShareStatus && order.items[0]
      ? getNextStatus(order.items[0].status)
      : null;
  const oneTimeWhatsAppStatus =
    order.deliveryType === "ONE_TIME" &&
    (order.items.every((item) => item.status === "READY")
      ? "READY"
      : order.items.every((item) => item.status === "COLLECTED")
        ? "COLLECTED"
        : null);
  const orderWhatsAppHref =
    oneTimeWhatsAppStatus && order.items[0]
      ? getWhatsAppHref({
          phoneNumber: order.customer.phoneNumber,
          message: buildOrderWhatsAppMessage({
            status: oneTimeWhatsAppStatus,
            customerName: order.customer.name,
            itemCount: order.items.length,
            neededBy: order.items[0].neededBy,
            pickupDrop: order.items[0].pickupDrop,
            balanceDue,
          }),
        })
      : null;

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
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-stone-950">
                Order #{order.id}
              </h1>
              <span
                className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-bold ${getStatusBadgeClass(statusSummary.tone)}`}
              >
                {statusSummary.label}
              </span>
            </div>
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
              <div className="mt-4 flex flex-wrap gap-2">
                {bulkNextStatus ? (
                  <form action={bulkAdvanceOrderStatusAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <input
                      type="hidden"
                      name="currentStatus"
                      value={order.items[0].status}
                    />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center rounded-md bg-teal-700 px-3 text-sm font-bold text-white hover:bg-teal-800"
                    >
                      Mark all as {formatOrderItemStatus(bulkNextStatus)}
                    </button>
                  </form>
                ) : null}
                {orderWhatsAppHref ? (
                  <a
                    href={orderWhatsAppHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-bold text-stone-700 hover:bg-stone-50"
                  >
                    <MessageCircle aria-hidden="true" className="h-4 w-4" />
                    Send WhatsApp Update
                  </a>
                ) : null}
              </div>
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
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-stone-950">
                      Saree #{item.sareeNumber}
                    </h2>
                    <span
                      className={`inline-flex h-7 items-center rounded-md border px-2 text-xs font-bold ${getStatusBadgeClass(
                        item.status === "CANCELLED"
                          ? "red"
                          : item.status === "READY" || item.status === "DELIVERED"
                            ? "teal"
                            : "stone",
                      )}`}
                    >
                      {formatOrderItemStatus(item.status)}
                    </span>
                  </div>
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
              <div className="mb-4 flex flex-wrap gap-2">
                {getNextStatus(item.status) ? (
                  <form action={advanceOrderItemStatusAction}>
                    <input type="hidden" name="itemId" value={item.id} />
                    <input
                      type="hidden"
                      name="currentStatus"
                      value={item.status}
                    />
                    <button
                      type="submit"
                      className="inline-flex h-10 items-center rounded-md bg-teal-700 px-3 text-sm font-bold text-white hover:bg-teal-800"
                    >
                      Mark as {formatOrderItemStatus(getNextStatus(item.status))}
                    </button>
                  </form>
                ) : null}
                <form action={updateOrderItemStatusAction} className="flex gap-2">
                  <input type="hidden" name="itemId" value={item.id} />
                  <select
                    name="status"
                    defaultValue={item.status}
                    className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                  >
                    {orderItemStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-bold text-stone-700 hover:bg-stone-50"
                  >
                    Update
                  </button>
                </form>
                {order.deliveryType === "MULTIPLE" &&
                (item.status === "COLLECTED" || item.status === "READY") ? (
                  <a
                    href={getWhatsAppHref({
                      phoneNumber: order.customer.phoneNumber,
                      message: buildItemWhatsAppMessage({
                        status: item.status,
                        customerName: order.customer.name,
                        orderId: order.id,
                        sareeNumber: item.sareeNumber,
                        neededBy: item.neededBy,
                        pickupDrop: item.pickupDrop,
                      }),
                    })}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-bold text-stone-700 hover:bg-stone-50"
                  >
                    <MessageCircle aria-hidden="true" className="h-4 w-4" />
                    WhatsApp
                  </a>
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
              <details className="mt-4 rounded-md border border-stone-200 bg-stone-50 px-3 py-2">
                <summary className="cursor-pointer text-sm font-bold text-stone-700">
                  Status History
                </summary>
                <div className="mt-3 space-y-2">
                  {item.statusHistory.length > 0 ? (
                    item.statusHistory.map((history) => (
                      <div
                        key={history.id}
                        className="rounded-md bg-white px-3 py-2 text-sm"
                      >
                        <p className="font-bold text-stone-950">
                          {formatOrderItemStatus(history.status)}
                        </p>
                        <p className="text-xs text-stone-500">
                          {formatDateTime(history.changedAt)} by{" "}
                          {history.changedBy.name}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-stone-500">
                      No status changes recorded yet.
                    </p>
                  )}
                </div>
              </details>
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
