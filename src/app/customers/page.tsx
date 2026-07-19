import Link from "next/link";
import { Download } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { CustomerList } from "@/components/customer-list";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type CustomersPageProps = {
  searchParams: Promise<{ letter?: string; q?: string }>;
};

const alphabetFilters = ["All", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

function getCustomersHref(letter: string) {
  const params = new URLSearchParams();

  if (letter !== "All") {
    params.set("letter", letter);
  }

  const search = params.toString();

  return `/customers${search ? `?${search}` : ""}`;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const requestedLetter = params.letter?.trim().toUpperCase() ?? "All";
  const initialQuery = params.q?.trim() ?? "";
  const selectedLetter = alphabetFilters.includes(requestedLetter)
    ? requestedLetter
    : "All";

  const customers = await getPrisma().customer.findMany({
    where: {
      ...(selectedLetter !== "All"
        ? { name: { startsWith: selectedLetter, mode: "insensitive" } }
        : {}),
    },
    orderBy: [{ name: "asc" }, { dateAdded: "desc" }],
    take: 100,
  });

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-5xl px-4 py-5">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-stone-950">Customers</h1>
            <p className="text-sm text-stone-600">
              {selectedLetter === "All"
                ? "All customers"
                : `${selectedLetter} customers`}
            </p>
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

        <div
          className="mb-4 flex gap-2 overflow-x-auto pb-1"
          aria-label="Filter customers by first letter"
        >
          {alphabetFilters.map((letter) => {
            const isSelected = selectedLetter === letter;

            return (
              <Link
                key={letter}
                href={getCustomersHref(letter)}
                className={`flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-bold ${
                  isSelected
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                }`}
              >
                {letter}
              </Link>
            );
          })}
        </div>

        <CustomerList customers={customers} initialQuery={initialQuery} />
      </main>
    </>
  );
}
