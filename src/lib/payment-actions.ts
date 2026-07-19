"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export type PaymentActionState = {
  error?: string;
  success?: string;
};

const paymentSchema = z.object({
  orderId: z.coerce.number().int().positive(),
  amount: z.coerce.number().min(0.01, "Enter the payment amount."),
  method: z.enum(["CASH", "UPI"]),
  paymentDate: z.string().trim().min(1, "Payment date is required."),
  notes: z.string().trim().optional(),
});

function optionalText(value?: string) {
  return value && value.length > 0 ? value : null;
}

export async function recordPaymentAction(
  _state: PaymentActionState,
  formData: FormData,
) {
  const user = await requireUser();
  const parsed = paymentSchema.safeParse({
    orderId: formData.get("orderId"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    paymentDate: formData.get("paymentDate"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the payment fields.",
    };
  }

  try {
    await getPrisma().payment.create({
      data: {
        orderId: parsed.data.orderId,
        amount: parsed.data.amount.toFixed(2),
        method: parsed.data.method,
        paymentDate: new Date(parsed.data.paymentDate),
        recordedById: user.id,
        notes: optionalText(parsed.data.notes),
      },
    });
  } catch (error) {
    console.error(error);
    return { error: "Could not record payment. Please try again." };
  }

  revalidatePath("/orders");
  revalidatePath(`/orders/${parsed.data.orderId}`);
  revalidatePath("/payments");
  revalidatePath("/dashboard");

  return { success: "Payment recorded." };
}
