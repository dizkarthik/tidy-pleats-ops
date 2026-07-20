import Link from "next/link";
import { Download } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { CustomerList } from "@/components/customer-list";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type CustomersPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const initialQuery = params.q?.trim() ?? "";

  const [customers, totalCustomers] = await Promise.all([
    getPrisma().customer.findMany({
      orderBy: [{ name: "asc" }, { dateAdded: "desc" }],
      take: 100,
    }),
    getPrisma().customer.count(),
  ]);

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-5xl px-4 py-5">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-stone-950">
                Customers
              </h1>
              <span className="inline-flex h-7 items-center rounded-full border border-teal-200 bg-teal-50 px-2.5 text-sm font-bold text-teal-700">
                {totalCustomers}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/customers/export"
              className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              Export
            </Link>
            <Link
              href="/customers/new"
              className="inline-flex h-10 items-center rounded-md bg-teal-700 px-3 text-sm font-semibold text-white hover:bg-teal-800"
            >
              Add
            </Link>
          </div>
        </div>

        <CustomerList customers={customers} initialQuery={initialQuery} />
      </main>
    </>
  );
}
