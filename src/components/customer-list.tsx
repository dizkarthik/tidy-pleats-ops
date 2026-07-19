"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Search, UserRound } from "lucide-react";

type CustomerListItem = {
  id: string;
  name: string;
  phoneNumber: string;
  location: string | null;
};

type CustomerListProps = {
  customers: CustomerListItem[];
  initialQuery?: string;
};

function matchesNameStart(customerName: string, query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return customerName
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .some((namePart) => namePart.startsWith(normalizedQuery));
}

export function CustomerList({ customers, initialQuery = "" }: CustomerListProps) {
  const [query, setQuery] = useState(initialQuery);
  const filteredCustomers = customers.filter((customer) =>
    matchesNameStart(customer.name, query),
  );

  return (
    <>
      <div className="mb-4">
        <label className="relative block">
          <Search
            aria-hidden="true"
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search first or last name"
            className="h-11 w-full rounded-md border border-stone-300 bg-white pl-9 pr-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
        </label>
      </div>

      <p className="mb-3 text-sm text-stone-600">
        {filteredCustomers.length} shown
      </p>

      <div className="overflow-hidden rounded-md border border-stone-200 bg-white">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="flex items-center gap-3 border-b border-stone-100 px-3 py-4 last:border-b-0 hover:bg-stone-50"
            >
              <Link
                href={`/customers/${customer.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
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
              <Link
                href={`/customers/${customer.id}/edit`}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                aria-label={`Edit ${customer.name}`}
                title={`Edit ${customer.name}`}
              >
                <Pencil aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          ))
        ) : (
          <div className="px-4 py-10 text-center text-sm text-stone-500">
            No customers found.
          </div>
        )}
      </div>
    </>
  );
}
