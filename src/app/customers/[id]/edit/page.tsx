import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { CustomerForm } from "@/components/customer-form";
import { updateCustomerAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type EditCustomerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const prisma = getPrisma();
  const [customer, referralCustomers] = await Promise.all([
    prisma.customer.findUnique({ where: { id } }),
    prisma.customer.findMany({
      where: { id: { not: id } },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        location: true,
      },
    }),
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-3xl px-4 py-5">
        <Link
          href={`/customers/${customer.id}`}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-950"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Customer profile
        </Link>
        <div className="rounded-md border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
          <h1 className="mb-5 text-2xl font-semibold text-stone-950">
            Edit customer
          </h1>
          <CustomerForm
            action={updateCustomerAction}
            customer={customer}
            referralCustomers={referralCustomers}
          />
        </div>
      </main>
    </>
  );
}
