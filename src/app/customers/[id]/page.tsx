import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { formatReferralKind, formatReferralSource } from "@/lib/referrals";

export const dynamic = "force-dynamic";

type CustomerProfilePageProps = {
  params: Promise<{ id: string }>;
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

export default async function CustomerProfilePage({
  params,
}: CustomerProfilePageProps) {
  const user = await requireUser();
  const { id } = await params;
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

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-3xl px-4 py-5">
        <Link
          href="/customers"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-950"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Customers
        </Link>
        <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5">
            <h1 className="text-2xl font-semibold text-stone-950">
              {customer.name}
            </h1>
            <p className="text-sm text-stone-600">{customer.phoneNumber}</p>
          </div>

          <dl>
            <Detail label="Location" value={customer.location ?? "Not set"} />
            <Detail label="Address" value={customer.address ?? "Not set"} />
            <Detail
              label="Birthday date"
              value={formatDate(customer.birthdayDate)}
            />
            <Detail
              label="Referral type"
              value={formatReferralKind(customer.referralKind)}
            />
            <Detail label="Referred by" value={referral} />
            <Detail label="Notes" value={customer.notes ?? "Not set"} />
            <Detail label="Date added" value={formatDate(customer.dateAdded)} />
          </dl>
        </section>
      </main>
    </>
  );
}
