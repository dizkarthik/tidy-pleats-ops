"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import {
  recordPaymentAction,
  type PaymentActionState,
} from "@/lib/payment-actions";
import { paymentMethods } from "@/lib/orders";

type PaymentFormProps = {
  orderId: number;
};

function getDateTimeInputValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

export function PaymentForm({ orderId }: PaymentFormProps) {
  const [state, formAction, isPending] = useActionState<
    PaymentActionState,
    FormData
  >(recordPaymentAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="orderId" value={orderId} />
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
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-stone-800">Amount</span>
          <span className="relative block">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-stone-500">
              ₹
            </span>
            <input
              name="amount"
              required
              inputMode="decimal"
              className="h-11 w-full rounded-md border border-stone-300 bg-white pl-8 pr-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </span>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-stone-800">Method</span>
          <select
            name="method"
            defaultValue="CASH"
            className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          >
            {paymentMethods.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="space-y-2">
        <span className="text-sm font-medium text-stone-800">Payment Date</span>
        <input
          name="paymentDate"
          type="datetime-local"
          defaultValue={getDateTimeInputValue()}
          className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium text-stone-800">Notes</span>
        <textarea
          name="notes"
          rows={3}
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        <Save aria-hidden="true" className="h-4 w-4" />
        {isPending ? "Recording..." : "Record Payment"}
      </button>
    </form>
  );
}
