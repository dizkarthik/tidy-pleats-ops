import Link from "next/link";
import { LogOut, Plus } from "lucide-react";
import { logoutAction } from "@/lib/actions";
import type { AuthUser } from "@/lib/auth";

type AppHeaderProps = {
  user: AuthUser;
};

export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/customers" className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
            Tidy Pleats Ops
          </p>
          <p className="truncate text-sm text-stone-600">{user.name}</p>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/customers/new"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-teal-700 text-white hover:bg-teal-800"
            aria-label="Add customer"
            title="Add customer"
          >
            <Plus aria-hidden="true" className="h-5 w-5" />
          </Link>
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
      </div>
    </header>
  );
}
