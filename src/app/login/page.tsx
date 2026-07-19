"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { loginAction, type ActionState } from "@/lib/actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    loginAction,
    {},
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-4 py-8">
      <div className="w-full max-w-sm rounded-md border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Tidy Pleats Ops
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-stone-950">
            Internal login
          </h1>
        </div>

        <form action={formAction} className="space-y-4">
          {state.error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </div>
          ) : null}

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-stone-800">Username</span>
            <input
              name="username"
              autoComplete="username"
              required
              className="h-11 w-full rounded-md border border-stone-300 px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-sm font-medium text-stone-800">Password</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-11 w-full rounded-md border border-stone-300 px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LogIn aria-hidden="true" className="h-4 w-4" />
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
