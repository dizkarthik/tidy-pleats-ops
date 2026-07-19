"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn, signOut, requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { referralKinds, referralSources } from "@/lib/referrals";

export type ActionState = {
  error?: string;
};

const referralKindValues = referralKinds.map((kind) => kind.value);
const referralSourceValues = referralSources.map((source) => source.value);

const customerSchema = z
  .object({
    name: z.string().trim().min(1, "Customer name is required."),
    phoneNumber: z.string().trim().min(1, "Phone number is required."),
    location: z.string().trim().optional(),
    address: z.string().trim().optional(),
    birthdayDate: z.string().trim().optional(),
    referralKind: z.enum(referralKindValues),
    referralSource: z.enum(referralSourceValues).optional(),
    referredByCustomerId: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  })
  .superRefine((data, context) => {
    if (data.referralKind === "SOCIAL_MEDIA" && !data.referralSource) {
      context.addIssue({
        code: "custom",
        path: ["referralSource"],
        message: "Choose a referral source.",
      });
    }

    if (data.referralKind === "EXISTING_CUSTOMER" && !data.referredByCustomerId) {
      context.addIssue({
        code: "custom",
        path: ["referredByCustomerId"],
        message: "Choose the referring customer.",
      });
    }
  });

function optionalText(value?: string) {
  return value && value.length > 0 ? value : null;
}

function parseBirthday(value?: string) {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

export async function loginAction(_state: ActionState, formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const user = await signIn(username, password);

  if (!user) {
    return { error: "Invalid username or password." };
  }

  redirect("/customers");
}

export async function logoutAction() {
  await signOut();
  redirect("/login");
}

export async function createCustomerAction(
  _state: ActionState,
  formData: FormData,
) {
  await requireUser();

  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    phoneNumber: formData.get("phoneNumber"),
    location: formData.get("location"),
    address: formData.get("address"),
    birthdayDate: formData.get("birthdayDate"),
    referralKind: formData.get("referralKind"),
    referralSource: formData.get("referralSource") || undefined,
    referredByCustomerId: formData.get("referredByCustomerId") || undefined,
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form fields." };
  }

  const data = parsed.data;
  let customerId: string;

  try {
    const customer = await getPrisma().customer.create({
      data: {
        name: data.name,
        phoneNumber: data.phoneNumber,
        location: optionalText(data.location),
        address: optionalText(data.address),
        birthdayDate: parseBirthday(data.birthdayDate),
        referralKind: data.referralKind,
        referralSource:
          data.referralKind === "SOCIAL_MEDIA" ? data.referralSource : null,
        referredByCustomerId:
          data.referralKind === "EXISTING_CUSTOMER"
            ? data.referredByCustomerId
            : null,
        notes: optionalText(data.notes),
      },
    });

    customerId = customer.id;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { error: "A customer with this phone number already exists." };
    }

    return { error: "Could not save customer. Please try again." };
  }

  revalidatePath("/customers");
  redirect(`/customers/${customerId}`);
}
