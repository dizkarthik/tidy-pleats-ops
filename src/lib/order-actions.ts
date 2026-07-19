"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export type OrderActionState = {
  error?: string;
};

const orderTypeValues = ["SINGLE", "MULTI"] as const;
const deliveryTypeValues = ["ONE_TIME", "MULTIPLE"] as const;
const discountTypeValues = ["RUPEE", "PERCENT"] as const;
const advancePaymentMethodValues = ["CASH", "UPI"] as const;
const pickupDropValues = ["NO", "PICKUP", "DROP", "PICKUP_AND_DROP"] as const;

function blankToUndefined(value: unknown) {
  return typeof value === "string" && value.trim().length === 0
    ? undefined
    : value;
}

const orderItemSchema = z.object({
  palluPleats: z.coerce.number().int().min(0),
  centerPleats: z.coerce.number().int().min(0),
  photoUrl: z.preprocess(blankToUndefined, z.string().trim().url().optional()),
  sareeNotes: z.preprocess(blankToUndefined, z.string().trim().optional()),
  damageNoticed: z.boolean().default(false),
  damageNotes: z.preprocess(blankToUndefined, z.string().trim().optional()),
  informedToCustomer: z.boolean().default(false),
  price: z.coerce.number().min(0.01, "Enter the saree price."),
  neededBy: z.string().trim().min(1, "Needed-by date is required."),
  pickupDrop: z.enum(pickupDropValues),
  address: z.preprocess(blankToUndefined, z.string().trim().optional()),
});

const orderSchema = z
  .object({
    customerId: z.string().trim().min(1, "Choose a customer."),
    orderDate: z.string().trim().min(1, "Order date is required."),
    orderType: z.enum(orderTypeValues),
    deliveryType: z.enum(deliveryTypeValues),
    discountValue: z.coerce.number().min(0).default(0),
    discountType: z.enum(discountTypeValues),
    advancePaid: z.coerce.number().min(0).default(0),
    advancePaymentMethod: z.enum(advancePaymentMethodValues),
    items: z.array(orderItemSchema).min(1, "Add at least one saree."),
  })
  .superRefine((data, context) => {
    if (data.orderType === "SINGLE" && data.items.length !== 1) {
      context.addIssue({
        code: "custom",
        path: ["items"],
        message: "Single orders must have exactly one saree.",
      });
    }

    data.items.forEach((item, index) => {
      if (item.pickupDrop !== "NO" && !item.address) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "address"],
          message: "Address is required for pickup or drop.",
        });
      }

      if (item.damageNoticed && !item.damageNotes) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "damageNotes"],
          message: "Add damage notes when damage is noticed.",
        });
      }
    });
  });

function parseDateTime(value: string) {
  return new Date(value);
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function optionalText(value?: string) {
  return value && value.length > 0 ? value : null;
}

export async function createOrderAction(
  _state: OrderActionState,
  formData: FormData,
) {
  await requireUser();

  const rawItems = String(formData.get("items") ?? "[]");
  let parsedItems: unknown;

  try {
    parsedItems = JSON.parse(rawItems);
  } catch {
    return { error: "Could not read saree details. Please try again." };
  }

  const parsed = orderSchema.safeParse({
    customerId: formData.get("customerId"),
    orderDate: formData.get("orderDate"),
    orderType: formData.get("orderType"),
    deliveryType: formData.get("deliveryType"),
    discountValue: formData.get("discountValue") || 0,
    discountType: formData.get("discountType"),
    advancePaid: formData.get("advancePaid") || 0,
    advancePaymentMethod: formData.get("advancePaymentMethod"),
    items: parsedItems,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the order form." };
  }

  const data = parsed.data;
  let orderId: number;

  try {
    const customer = await getPrisma().customer.findUnique({
      where: { id: data.customerId },
      select: { id: true },
    });

    if (!customer) {
      return { error: "Choose an existing customer." };
    }

    const order = await getPrisma().order.create({
      data: {
        customerId: data.customerId,
        orderDate: parseDateTime(data.orderDate),
        orderType: data.orderType,
        deliveryType: data.orderType === "SINGLE" ? "ONE_TIME" : data.deliveryType,
        discountValue: data.discountValue.toFixed(2),
        discountType: data.discountType,
        advancePaid: data.advancePaid.toFixed(2),
        advancePaymentMethod: data.advancePaymentMethod,
        items: {
          create: data.items.map((item, index) => ({
            sareeNumber: index + 1,
            palluPleats: item.palluPleats,
            centerPleats: item.centerPleats,
            photoUrl: item.photoUrl ?? null,
            sareeNotes: optionalText(item.sareeNotes),
            damageNoticed: item.damageNoticed,
            damageNotes: item.damageNoticed ? optionalText(item.damageNotes) : null,
            informedToCustomer: item.damageNoticed
              ? item.informedToCustomer
              : false,
            price: item.price.toFixed(2),
            neededBy: parseDate(item.neededBy),
            pickupDrop: item.pickupDrop,
            address: item.pickupDrop === "NO" ? null : optionalText(item.address),
          })),
        },
      },
      select: { id: true },
    });

    orderId = order.id;
  } catch (error) {
    console.error(error);
    return { error: "Could not save order. Please try again." };
  }

  revalidatePath("/orders");
  redirect(`/orders/${orderId}`);
}
