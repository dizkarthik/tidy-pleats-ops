import Link from "next/link";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions";
import type { AuthUser } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { HeaderSearch } from "@/components/header-search";

type AppHeaderProps = {
  user: AuthUser;
};

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link href="/customers" className="min-w-0 shrink-0">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
              Tidy Pleats Ops
            </p>
            <p className="truncate text-xs text-stone-600">{user.name}</p>
          </Link>
          <HeaderSearch />
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut aria-hidden="true" className="h-5 w-5" />
            </button>
          </form>
        </div>
      </header>
      <BottomNav />
    </>
  );
}
