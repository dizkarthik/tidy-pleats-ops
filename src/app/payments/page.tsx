import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/auth";

export default async function PaymentsPage() {
  const user = await requireUser();

  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto w-full max-w-5xl px-4 py-5">
        <h1 className="text-2xl font-semibold text-stone-950">Payments</h1>
        <p className="mt-2 text-sm text-stone-600">
          Payments will be added in a later phase.
        </p>
      </main>
    </>
  );
}
