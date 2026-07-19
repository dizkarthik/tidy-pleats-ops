import Link from "next/link";
import { Search, UserRound } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type CustomersPageProps = {
  searchParams: Promise<{ letter?: string; q?: string }>;
};

const alphabetFilters = ["All", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")];

function getCustomersHref(letter: string, query: string) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (letter !== "All") {
    params.set("letter", letter);
  }

  const search = params.toString();

  return `/customers${search ? `?${search}` : ""}`;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const user = await requireUser();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const requestedLetter = params.letter?.trim().toUpperCase() ?? "All";
  const selectedLetter = alphabetFilters.includes(requestedLetter)
    ? requestedLetter
    : "All";

  const customers = await getPrisma().customer.findMany({
    where: {
      AND: [
        query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { phoneNumber: { contains: query, mode: "insensitive" } },
                { location: { contains: query, mode: "insensitive" } },
              ],
            }
          : {},
        selectedLetter !== "All"
          ? { name: { startsWith: selectedLetter, mode: "insensitive" } }
          : {},
      ],
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
            <p className="text-sm text-stone-600">{customers.length} shown</p>
          </div>
          <Link
            href="/customers/new"
            className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Add
          </Link>
        </div>

        <form className="mb-4">
          {selectedLetter !== "All" ? (
            <input type="hidden" name="letter" value={selectedLetter} />
          ) : null}
          <label className="relative block">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500"
            />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search name, phone, or location"
              className="h-11 w-full rounded-md border border-stone-300 bg-white pl-9 pr-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </label>
        </form>

        <div
          className="mb-4 flex gap-2 overflow-x-auto pb-1"
          aria-label="Filter customers by first letter"
        >
          {alphabetFilters.map((letter) => {
            const isSelected = selectedLetter === letter;

            return (
              <Link
                key={letter}
                href={getCustomersHref(letter, query)}
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

        <div className="overflow-hidden rounded-md border border-stone-200 bg-white">
          {customers.length > 0 ? (
            customers.map((customer) => (
              <Link
                key={customer.id}
                href={`/customers/${customer.id}`}
                className="flex items-center gap-3 border-b border-stone-100 px-3 py-4 last:border-b-0 hover:bg-stone-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-700">
                  <UserRound aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-stone-950">
                    {customer.name}
                  </span>
                  <span className="block truncate text-sm text-stone-600">
                    {customer.phoneNumber}
                    {customer.location ? ` - ${customer.location}` : ""}
                  </span>
                </span>
              </Link>
            ))
          ) : (
            <div className="px-4 py-10 text-center text-sm text-stone-500">
              No customers found.
            </div>
          )}
        </div>
      </main>
    </>
  );
}
