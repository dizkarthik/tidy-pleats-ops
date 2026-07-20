"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import {
  changePasswordAction,
  type ActionState,
} from "@/lib/actions";

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    changePasswordAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
          {state.error}
        </div>
      ) : null}
      {state.success ? (
        <div className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-bold text-teal-700">
          {state.success}
        </div>
      ) : null}

      <label className="space-y-2">
        <span className="text-sm font-medium text-stone-800">
          Current Password
        </span>
        <input
          name="currentPassword"
          type="password"
          required
          className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-stone-800">New Password</span>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-medium text-stone-800">
          Confirm New Password
        </span>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        <Save aria-hidden="true" className="h-4 w-4" />
        {isPending ? "Saving..." : "Change Password"}
      </button>
    </form>
  );
}
