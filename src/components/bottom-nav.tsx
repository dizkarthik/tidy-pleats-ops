"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  List,
  PackageSearch,
  Plus,
  ReceiptText,
} from "lucide-react";

const navItems = [
  { href: "/customers", label: "Customers", icon: List },
  { href: "/orders", label: "Orders", icon: PackageSearch },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/menu5", label: "Menu5", icon: ReceiptText },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  const [customers, orders, payments, menu5] = navItems;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(28,25,23,0.08)] backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-5 items-end gap-1">
        {[customers, orders].map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-xs font-semibold ${
                active ? "text-teal-700" : "text-stone-600 hover:text-stone-950"
              }`}
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        <Link
          href="/customers/new"
          className="mx-auto flex h-16 w-16 -translate-y-3 items-center justify-center rounded-full bg-teal-700 text-white shadow-lg shadow-teal-900/25 ring-4 ring-white hover:bg-teal-800"
          aria-label="Add customer"
          title="Add customer"
        >
          <Plus aria-hidden="true" className="h-8 w-8" />
        </Link>

        {[payments, menu5].map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-xs font-semibold ${
                active ? "text-teal-700" : "text-stone-600 hover:text-stone-950"
              }`}
            >
              <Icon aria-hidden="true" className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
