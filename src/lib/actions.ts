"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { signIn, signOut, requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { referralKinds, referralSources } from "@/lib/referrals";

export type ActionState = {
  error?: string;
  success?: string;
};

const referralKindValues = referralKinds.map((kind) => kind.value);
const referralSourceValues = referralSources.map((source) => source.value);
const customerSizeValues = ["S", "M", "L", "XL", "XXL"] as const;
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm the new password."),
  })
  .superRefine((data, context) => {
    if (data.newPassword !== data.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "New password and confirmation do not match.",
      });
    }
  });

const customerSchema = z
  .object({
    name: z.string().trim().min(1, "Customer name is required."),
    phoneNumber: z.string().trim().min(1, "Phone number is required."),
    location: z.string().trim().optional(),
    address: z.string().trim().optional(),
    birthdayDate: z.string().trim().optional(),
    size: z.enum(customerSizeValues).optional(),
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

function parseCustomerForm(formData: FormData) {
  return customerSchema.safeParse({
    name: formData.get("name"),
    phoneNumber: formData.get("phoneNumber"),
    location: formData.get("location"),
    address: formData.get("address"),
    birthdayDate: formData.get("birthdayDate"),
    size: formData.get("size") || undefined,
    referralKind: formData.get("referralKind"),
    referralSource: formData.get("referralSource") || undefined,
    referredByCustomerId: formData.get("referredByCustomerId") || undefined,
    notes: formData.get("notes"),
  });
}

function getCustomerData(data: z.infer<typeof customerSchema>) {
  return {
    name: data.name,
    phoneNumber: data.phoneNumber,
    location: optionalText(data.location),
    address: optionalText(data.address),
    birthdayDate: parseBirthday(data.birthdayDate),
    size: data.size ?? null,
    referralKind: data.referralKind,
    referralSource:
      data.referralKind === "SOCIAL_MEDIA" ? data.referralSource : null,
    referredByCustomerId:
      data.referralKind === "EXISTING_CUSTOMER"
        ? data.referredByCustomerId
        : null,
    notes: optionalText(data.notes),
  };
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

export async function changePasswordAction(
  _state: ActionState,
  formData: FormData,
) {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form fields." };
  }

  const account = await getPrisma().user.findUnique({
    where: { id: user.id },
  });

  if (
    !account ||
    !(await bcrypt.compare(parsed.data.currentPassword, account.passwordHash))
  ) {
    return { error: "Current password is incorrect." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  await getPrisma().user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return { success: "Password updated." };
}

export async function createCustomerAction(
  _state: ActionState,
  formData: FormData,
) {
  await requireUser();

  const parsed = parseCustomerForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form fields." };
  }

  const data = parsed.data;
  let customerId: string;

  try {
    const customer = await getPrisma().customer.create({
      data: getCustomerData(data),
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

export async function updateCustomerAction(
  _state: ActionState,
  formData: FormData,
) {
  await requireUser();

  const customerId = String(formData.get("customerId") ?? "").trim();

  if (!customerId) {
    return { error: "Customer id is missing." };
  }

  const parsed = parseCustomerForm(formData);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form fields." };
  }

  const data = parsed.data;

  if (data.referredByCustomerId === customerId) {
    return { error: "A customer cannot refer themselves." };
  }

  try {
    await getPrisma().customer.update({
      where: { id: customerId },
      data: getCustomerData(data),
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return { error: "A customer with this phone number already exists." };
    }

    return { error: "Could not update customer. Please try again." };
  }

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}`);
}
