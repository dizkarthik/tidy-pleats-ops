import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { ChangePasswordForm } from "@/components/change-password-form";
import { requireUser } from "@/lib/auth";

export default async function ChangePasswordPage() {
  const user = await requireUser();

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-2xl px-4 py-5">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-950"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Dashboard
        </Link>

        <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
          <h1 className="mb-7 text-2xl font-semibold text-stone-950">
            Change Password
          </h1>
          <ChangePasswordForm />
        </section>
      </main>
    </>
  );
}
