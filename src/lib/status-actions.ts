"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import {
  getNextStatus,
  orderItemStatuses,
  type OrderItemStatusValue,
} from "@/lib/order-status";

const statusValues = orderItemStatuses.map((status) => status.value);

async function updateItemStatus({
  itemId,
  status,
  changedById,
}: {
  itemId: string;
  status: OrderItemStatusValue;
  changedById: string;
}) {
  const item = await getPrisma().orderItem.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      orderId: true,
      status: true,
    },
  });

  if (!item || item.status === status) {
    return item?.orderId ?? null;
  }

  await getPrisma().orderItem.update({
    where: { id: itemId },
    data: {
      status,
      statusUpdatedAt: new Date(),
      statusHistory: {
        create: {
          status,
          changedById,
        },
      },
    },
  });

  return item.orderId;
}

export async function advanceOrderItemStatusAction(formData: FormData) {
  const user = await requireUser();
  const itemId = String(formData.get("itemId") ?? "");
  const currentStatus = String(formData.get("currentStatus") ?? "");
  const nextStatus = getNextStatus(currentStatus);

  if (!itemId || !nextStatus) {
    return;
  }

  const orderId = await updateItemStatus({
    itemId,
    status: nextStatus,
    changedById: user.id,
  });

  revalidatePath("/orders");

  if (orderId) {
    revalidatePath(`/orders/${orderId}`);
  }
}

export async function updateOrderItemStatusAction(formData: FormData) {
  const user = await requireUser();
  const itemId = String(formData.get("itemId") ?? "");
  const status = String(formData.get("status") ?? "") as OrderItemStatusValue;

  if (!itemId || !statusValues.includes(status)) {
    return;
  }

  const orderId = await updateItemStatus({
    itemId,
    status,
    changedById: user.id,
  });

  revalidatePath("/orders");

  if (orderId) {
    revalidatePath(`/orders/${orderId}`);
  }
}

export async function bulkAdvanceOrderStatusAction(formData: FormData) {
  const user = await requireUser();
  const orderId = Number(formData.get("orderId"));
  const currentStatus = String(formData.get("currentStatus") ?? "");
  const nextStatus = getNextStatus(currentStatus);

  if (!Number.isInteger(orderId) || !nextStatus) {
    return;
  }

  const order = await getPrisma().order.findUnique({
    where: { id: orderId },
    select: {
      items: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (
    !order ||
    order.items.length === 0 ||
    !order.items.every((item) => item.status === currentStatus)
  ) {
    return;
  }

  await getPrisma().$transaction(
    order.items.map((item) =>
      getPrisma().orderItem.update({
        where: { id: item.id },
        data: {
          status: nextStatus,
          statusUpdatedAt: new Date(),
          statusHistory: {
            create: {
              status: nextStatus,
              changedById: user.id,
            },
          },
        },
      }),
    ),
  );

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
}

