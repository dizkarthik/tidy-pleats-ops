"use client";

import { useActionState, useMemo, useState } from "react";
import { Save, Search } from "lucide-react";
import { createCustomerAction, type ActionState } from "@/lib/actions";
import { customerSizes, referralKinds, referralSources } from "@/lib/referrals";

type ReferralCustomer = {
  id: string;
  name: string;
  phoneNumber: string;
  location: string | null;
};

type CustomerFormProps = {
  action?: (
    state: ActionState,
    formData: FormData,
  ) => Promise<ActionState>;
  customer?: {
    id: string;
    name: string;
    phoneNumber: string;
    location: string | null;
    address: string | null;
    birthdayDate: Date | null;
    size: string | null;
    referralKind: string;
    referralSource: string | null;
    referredByCustomerId: string | null;
    notes: string | null;
  };
  referralCustomers: ReferralCustomer[];
};

function getDateInputValue(value?: Date | null) {
  if (!value) {
    return "";
  }

  return value.toISOString().slice(0, 10);
}

export function CustomerForm({
  action = createCustomerAction,
  customer,
  referralCustomers,
}: CustomerFormProps) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    {},
  );
  const initialSelectedCustomer = referralCustomers.find(
    (referralCustomer) =>
      referralCustomer.id === customer?.referredByCustomerId,
  );
  const [referralKind, setReferralKind] = useState(
    customer?.referralKind ?? "SOCIAL_MEDIA",
  );
  const [customerQuery, setCustomerQuery] = useState(
    initialSelectedCustomer?.name ?? "",
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState(
    customer?.referredByCustomerId ?? "",
  );
  const selectedCustomer = referralCustomers.find(
    (customer) => customer.id === selectedCustomerId,
  );

  const filteredCustomers = useMemo(() => {
    const query = customerQuery.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return referralCustomers
      .filter((customer) =>
        [customer.name, customer.phoneNumber, customer.location ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 8);
  }, [customerQuery, referralCustomers]);

  return (
    <form action={formAction} className="space-y-5">
      {customer ? <input type="hidden" name="customerId" value={customer.id} /> : null}

      {state.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-stone-800">Customer name</span>
          <input
            name="name"
            required
            defaultValue={customer?.name ?? ""}
            className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-stone-800">Phone number</span>
          <input
            name="phoneNumber"
            required
            inputMode="tel"
            defaultValue={customer?.phoneNumber ?? ""}
            className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-stone-800">Location</span>
          <input
            name="location"
            placeholder="Area or locality"
            defaultValue={customer?.location ?? ""}
            className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-sm font-medium text-stone-800">Birthday date</span>
          <input
            name="birthdayDate"
            type="date"
            defaultValue={getDateInputValue(customer?.birthdayDate)}
            className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
        </label>
      </div>

      <label className="space-y-1.5">
        <span className="text-sm font-medium text-stone-800">Size</span>
        <select
          name="size"
          defaultValue={customer?.size ?? ""}
          className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        >
          {customerSizes.map((size) => (
            <option key={size.value || "none"} value={size.value}>
              {size.label}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1.5">
        <span className="text-sm font-medium text-stone-800">Address</span>
        <textarea
          name="address"
          rows={3}
          defaultValue={customer?.address ?? ""}
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        />
      </label>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-stone-800">Referred by</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {referralKinds.map((kind) => (
            <label
              key={kind.value}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-stone-300 px-3 text-sm has-[:checked]:border-teal-700 has-[:checked]:bg-teal-50"
            >
              <input
                type="radio"
                name="referralKind"
                value={kind.value}
                checked={referralKind === kind.value}
                onChange={() => setReferralKind(kind.value)}
                className="h-4 w-4 accent-teal-700"
              />
              {kind.label}
            </label>
          ))}
        </div>
      </fieldset>

      {referralKind === "SOCIAL_MEDIA" ? (
        <label className="space-y-1.5">
          <span className="text-sm font-medium text-stone-800">Referral source</span>
          <select
            name="referralSource"
            defaultValue={customer?.referralSource ?? "INSTAGRAM"}
            className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          >
            {referralSources.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="space-y-2">
          <input
            type="hidden"
            name="referredByCustomerId"
            value={selectedCustomerId}
          />
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-stone-800">
              Search existing customers
            </span>
            <div className="relative">
              <Search
                aria-hidden="true"
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500"
              />
              <input
                value={customerQuery}
                onChange={(event) => {
                  setCustomerQuery(event.target.value);
                  setSelectedCustomerId("");
                }}
                placeholder="Name, phone, or location"
                className="h-11 w-full rounded-md border border-stone-300 bg-white pl-9 pr-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </label>

          {selectedCustomer ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-teal-200 bg-teal-50 px-3 py-3">
              <span>
                <span className="block text-sm font-medium text-stone-900">
                  {selectedCustomer.name}
                </span>
                <span className="block text-xs text-stone-600">
                  {selectedCustomer.phoneNumber}
                  {selectedCustomer.location
                    ? ` - ${selectedCustomer.location}`
                    : ""}
                </span>
              </span>
              <span className="text-xs font-bold text-teal-700">Selected</span>
            </div>
          ) : customerQuery.trim() ? (
            <div className="max-h-64 overflow-y-auto rounded-md border border-stone-200 bg-white">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <button
                    type="button"
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomerId(customer.id);
                      setCustomerQuery(customer.name);
                    }}
                    className="flex w-full items-center justify-between gap-3 border-b border-stone-100 bg-white px-3 py-3 text-left last:border-b-0 hover:bg-stone-50"
                  >
                    <span>
                      <span className="block text-sm font-medium text-stone-900">
                        {customer.name}
                      </span>
                      <span className="block text-xs text-stone-500">
                        {customer.phoneNumber}
                        {customer.location ? ` - ${customer.location}` : ""}
                      </span>
                    </span>
                    <span className="text-xs font-bold text-teal-700">
                      Choose
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-stone-500">
                  No existing customer matches this search.
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      <label className="space-y-1.5">
        <span className="text-sm font-medium text-stone-800">Notes</span>
        <textarea
          name="notes"
          rows={5}
          defaultValue={customer?.notes ?? ""}
          className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      >
        <Save aria-hidden="true" className="h-4 w-4" />
        {isPending
          ? "Saving..."
          : customer
            ? "Update customer"
            : "Save customer"}
      </button>
    </form>
  );
}
