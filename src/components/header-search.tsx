"use client";

import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function HeaderSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div className="justify-self-end">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
        aria-label="Open search"
        title="Search"
      >
        <Search aria-hidden="true" className="h-5 w-5" />
      </button>

      {isOpen ? (
        <div className="absolute inset-x-0 top-full border-b border-stone-200 bg-white px-4 py-3 shadow-sm">
          <form
            className="mx-auto flex max-w-5xl items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const query = String(formData.get("q") ?? "").trim();

              setIsOpen(false);
              router.push(
                query ? `/customers?q=${encodeURIComponent(query)}` : "/customers",
              );
            }}
          >
            <label className="relative block min-w-0 flex-1">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500"
              />
              <input
                ref={inputRef}
                name="q"
                placeholder="Search orders or customers"
                className="h-11 w-full rounded-md border border-stone-300 bg-stone-50 pl-9 pr-3 text-base outline-none focus:border-teal-700 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
              aria-label="Close search"
              title="Close search"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
