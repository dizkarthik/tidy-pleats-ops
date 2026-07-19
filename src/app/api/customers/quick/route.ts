import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

const quickCustomerSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required."),
  phoneNumber: z.string().trim().min(1, "Phone number is required."),
  location: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

function optionalText(value?: string) {
  return value && value.length > 0 ? value : null;
}

export async function POST(request: Request) {
  await requireUser();

  const parsed = quickCustomerSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check customer details." },
      { status: 400 },
    );
  }

  try {
    const customer = await getPrisma().customer.create({
      data: {
        name: parsed.data.name,
        phoneNumber: parsed.data.phoneNumber,
        location: optionalText(parsed.data.location),
        address: optionalText(parsed.data.address),
        referralKind: "SOCIAL_MEDIA",
        referralSource: "OTHER",
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        location: true,
      },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A customer with this phone number already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Could not save customer. Please try again." },
      { status: 500 },
    );
  }
}

