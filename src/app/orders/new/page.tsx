import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { OrderForm } from "@/components/order-form";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export default async function NewOrderPage() {
  const user = await requireUser();
  const customers = await getPrisma().customer.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      phoneNumber: true,
      location: true,
    },
  });

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-3xl px-4 py-5">
        <Link
          href="/orders"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-950"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Orders
        </Link>
        <div className="rounded-md border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
          <h1 className="mb-5 text-2xl font-semibold text-stone-950">
            New Order
          </h1>
          <OrderForm customers={customers} />
        </div>
      </main>
    </>
  );
}
