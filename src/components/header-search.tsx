"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function HeaderSearch() {
  const router = useRouter();

  return (
    <form
      className="min-w-0 flex-1"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const query = String(formData.get("q") ?? "").trim();

        router.push(query ? `/customers?q=${encodeURIComponent(query)}` : "/customers");
      }}
    >
      <label className="relative block">
        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500"
        />
        <input
          name="q"
          placeholder="Search orders or customers"
          className="h-10 w-full rounded-md border border-stone-300 bg-stone-50 pl-9 pr-3 text-sm outline-none focus:border-teal-700 focus:bg-white focus:ring-2 focus:ring-teal-100"
        />
      </label>
    </form>
  );
}
