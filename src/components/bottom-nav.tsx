"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ClipboardPlus,
  CreditCard,
  LayoutDashboard,
  List,
  PackageSearch,
  Plus,
  UserPlus,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: List },
  { href: "/orders", label: "Orders", icon: PackageSearch },
  { href: "/payments", label: "Payments", icon: CreditCard },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const [dashboard, customers, orders, payments] = navItems;

  useEffect(() => {
    setIsActionMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setIsActionMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(28,25,23,0.08)] backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-5 items-end gap-1">
        {[dashboard, customers].map((item) => {
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

        <div ref={actionMenuRef} className="relative mx-auto">
          {isActionMenuOpen ? (
            <div className="absolute bottom-20 left-1/2 w-48 -translate-x-1/2 overflow-hidden rounded-md border border-stone-200 bg-white shadow-xl shadow-stone-950/15">
              <Link
                href="/customers/new"
                className="flex min-h-12 items-center gap-3 border-b border-stone-100 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
              >
                <UserPlus aria-hidden="true" className="h-5 w-5 text-teal-700" />
                Add Customer
              </Link>
              <Link
                href="/orders/new"
                className="flex min-h-12 items-center gap-3 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
              >
                <ClipboardPlus
                  aria-hidden="true"
                  className="h-5 w-5 text-teal-700"
                />
                New Order
              </Link>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setIsActionMenuOpen((isOpen) => !isOpen)}
            className="flex h-16 w-16 -translate-y-3 items-center justify-center rounded-full bg-teal-700 text-white shadow-lg shadow-teal-900/25 ring-4 ring-white hover:bg-teal-800"
            aria-label={isActionMenuOpen ? "Close actions" : "Open actions"}
            aria-expanded={isActionMenuOpen}
            title={isActionMenuOpen ? "Close" : "Add"}
          >
            {isActionMenuOpen ? (
              <X aria-hidden="true" className="h-8 w-8" />
            ) : (
              <Plus aria-hidden="true" className="h-8 w-8" />
            )}
          </button>
        </div>

        {[orders, payments].map((item) => {
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
