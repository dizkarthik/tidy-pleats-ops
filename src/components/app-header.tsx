"use client";

import Link from "next/link";
import { KeyRound, LogOut, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/lib/actions";
import type { AuthUser } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { HeaderSearch } from "@/components/header-search";

type AppHeaderProps = {
  user: AuthUser;
};

export function AppHeader({ user }: AppHeaderProps) {
  void user;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto grid h-16 max-w-5xl grid-cols-[2.5rem_1fr_2.5rem] items-center gap-3 px-4">
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              title={isMenuOpen ? "Close menu" : "Menu"}
            >
              {isMenuOpen ? (
                <X aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Menu aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
            {isMenuOpen ? (
              <div className="absolute left-0 top-12 w-56 overflow-hidden rounded-md border border-stone-200 bg-white shadow-xl shadow-stone-950/15">
                <Link
                  href="/account/password"
                  className="flex min-h-12 items-center gap-3 border-b border-stone-100 px-3 text-sm font-semibold text-stone-800 hover:bg-stone-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <KeyRound aria-hidden="true" className="h-5 w-5 text-teal-700" />
                  Change Password
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="flex min-h-12 w-full items-center gap-3 px-3 text-left text-sm font-semibold text-stone-800 hover:bg-stone-50"
                  >
                    <LogOut aria-hidden="true" className="h-5 w-5 text-teal-700" />
                    Logout
                  </button>
                </form>
              </div>
            ) : null}
          </div>

          <Link href="/dashboard" className="min-w-0 text-center">
            <p className="truncate text-sm font-bold uppercase tracking-wide text-teal-700">
              Tidy Pleats Ops
            </p>
          </Link>

          <HeaderSearch />
        </div>
      </header>
      <BottomNav />
    </>
  );
}
