"use client";

import { useActionState, useMemo, useState } from "react";
import {
  Camera,
  Minus,
  Plus,
  Save,
  Search,
  Trash2,
} from "lucide-react";
import {
  createOrderAction,
  type OrderActionState,
} from "@/lib/order-actions";
import {
  advancePaymentMethods,
  calculateBalanceDue,
  calculateDiscountAmount,
  deliveryTypes,
  formatCurrency,
  pickupDropOptions,
} from "@/lib/orders";

type CustomerOption = {
  id: string;
  name: string;
  phoneNumber: string;
  location: string | null;
};

type OrderItemDraft = {
  palluPleats: number;
  centerPleats: number;
  photoUrl: string;
  sareeNotes: string;
  damageNoticed: boolean;
  damageNotes: string;
  informedToCustomer: boolean;
  price: string;
  neededBy: string;
  pickupDrop: string;
  address: string;
};

type OrderFormProps = {
  customers: CustomerOption[];
};

function getTomorrowDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().slice(0, 10);
}

function getDateTimeInputValue() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function createItemDraft(common: {
  neededBy: string;
  pickupDrop: string;
  address: string;
}): OrderItemDraft {
  return {
    palluPleats: 5,
    centerPleats: 5,
    photoUrl: "",
    sareeNotes: "",
    damageNoticed: false,
    damageNotes: "",
    informedToCustomer: false,
    price: "",
    neededBy: common.neededBy,
    pickupDrop: common.pickupDrop,
    address: common.address,
  };
}

async function compressImage(file: File) {
  const imageUrl = URL.createObjectURL(file);
  const image = new Image();
  image.src = imageUrl;
  await image.decode();

  const scale = Math.min(1, 1200 / image.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare image.");
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(imageUrl);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.75);
  });

  if (!blob) {
    throw new Error("Could not compress image.");
  }

  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
  });
}

export function OrderForm({ customers: initialCustomers }: OrderFormProps) {
  const [state, formAction, isPending] = useActionState<
    OrderActionState,
    FormData
  >(createOrderAction, {});
  const customers = initialCustomers;
  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [orderType, setOrderType] = useState("SINGLE");
  const [deliveryType, setDeliveryType] = useState("ONE_TIME");
  const [commonNeededBy, setCommonNeededBy] = useState(getTomorrowDate());
  const [commonPickupDrop, setCommonPickupDrop] = useState("NO");
  const [commonAddress, setCommonAddress] = useState("");
  const [items, setItems] = useState([
    createItemDraft({
      neededBy: commonNeededBy,
      pickupDrop: commonPickupDrop,
      address: commonAddress,
    }),
  ]);
  const [discountValue, setDiscountValue] = useState("0");
  const [discountType, setDiscountType] = useState("RUPEE");
  const [advancePaid, setAdvancePaid] = useState("0");
  const [uploadingItemIndex, setUploadingItemIndex] = useState<number | null>(
    null,
  );

  const selectedCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId,
  );
  const filteredCustomers = useMemo(() => {
    const query = customerQuery.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return customers
      .filter((customer) =>
        [customer.name, customer.phoneNumber, customer.location ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 8);
  }, [customerQuery, customers]);
  const isOneTime = orderType === "SINGLE" || deliveryType === "ONE_TIME";
  const totalPrice = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0),
    0,
  );
  const discountAmount = calculateDiscountAmount(
    totalPrice,
    Number(discountValue) || 0,
    discountType,
  );
  const balanceDue = calculateBalanceDue({
    totalPrice,
    discountValue: Number(discountValue) || 0,
    discountType,
    advancePaid: Number(advancePaid) || 0,
  });
  const formItems = items.map((item) => ({
    ...item,
    neededBy: isOneTime ? commonNeededBy : item.neededBy,
    pickupDrop: isOneTime ? commonPickupDrop : item.pickupDrop,
    address: isOneTime ? commonAddress : item.address,
    price: Number(item.price) || 0,
  }));

  function updateItem(index: number, next: Partial<OrderItemDraft>) {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...next } : item,
      ),
    );
  }

  function resetForOrderType(nextOrderType: string) {
    setOrderType(nextOrderType);

    if (nextOrderType === "SINGLE") {
      setDeliveryType("ONE_TIME");
      setItems((currentItems) => [currentItems[0] ?? createItemDraft({
        neededBy: commonNeededBy,
        pickupDrop: commonPickupDrop,
        address: commonAddress,
      })]);
    }
  }

  async function handlePhotoChange(index: number, file?: File) {
    if (!file) {
      return;
    }

    setUploadingItemIndex(index);

    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.set("file", compressed);

      const response = await fetch("/api/orders/photo-upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Could not upload image.");
      }

      updateItem(index, { photoUrl: result.url });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not upload image.");
    } finally {
      setUploadingItemIndex(null);
    }
  }

  return (
    <>
      <form action={formAction} className="space-y-8">
        <input type="hidden" name="customerId" value={selectedCustomerId} />
        <input type="hidden" name="orderType" value={orderType} />
        <input type="hidden" name="deliveryType" value={deliveryType} />
        <input type="hidden" name="items" value={JSON.stringify(formItems)} />

        {state.error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {state.error}
          </div>
        ) : null}

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-stone-800">
            Order Type
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "SINGLE", label: "Single" },
              { value: "MULTI", label: "Multi" },
            ].map((type) => (
              <button
                type="button"
                key={type.value}
                onClick={() => resetForOrderType(type.value)}
                className={`h-11 rounded-md border text-sm font-bold ${
                  orderType === type.value
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-stone-300 bg-white text-stone-700"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </fieldset>

        {orderType === "MULTI" ? (
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-800">
              Delivery Type
            </span>
            <select
              value={deliveryType}
              onChange={(event) => setDeliveryType(event.target.value)}
              className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            >
              {deliveryTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="space-y-2">
          <span className="text-sm font-medium text-stone-800">
            Order Date & Time
          </span>
          <input
            name="orderDate"
            type="datetime-local"
            defaultValue={getDateTimeInputValue()}
            className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
        </label>

        <div className="space-y-3">
          <div>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-800">
                Customer
              </span>
              <span className="relative block">
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
                  placeholder="Search name, phone, or location"
                  className="h-11 w-full rounded-md border border-stone-300 bg-white pl-9 pr-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                />
              </span>
            </label>
          </div>

          {selectedCustomer ? (
            <div className="rounded-md border border-teal-200 bg-teal-50 px-3 py-3">
              <p className="text-sm font-bold text-stone-900">
                {selectedCustomer.name}
              </p>
              <p className="text-xs text-stone-600">
                {selectedCustomer.phoneNumber}
                {selectedCustomer.location ? ` - ${selectedCustomer.location}` : ""}
              </p>
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
                    className="flex w-full items-center justify-between gap-3 border-b border-stone-100 px-3 py-3 text-left last:border-b-0 hover:bg-stone-50"
                  >
                    <span>
                      <span className="block text-sm font-bold text-stone-900">
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
                  No customer matches this search.
                </div>
              )}
            </div>
          ) : null}
        </div>

        {isOneTime ? (
          <DeliveryFields
            neededBy={commonNeededBy}
            pickupDrop={commonPickupDrop}
            address={commonAddress}
            onChange={(next) => {
              if (next.neededBy !== undefined) setCommonNeededBy(next.neededBy);
              if (next.pickupDrop !== undefined) {
                setCommonPickupDrop(next.pickupDrop);
                if (next.pickupDrop === "NO") setCommonAddress("");
              }
              if (next.address !== undefined) setCommonAddress(next.address);
            }}
          />
        ) : null}

        <section className="space-y-5">
          {orderType === "MULTI" ? (
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-stone-950">Sarees</h2>
              <button
                type="button"
                onClick={() =>
                  setItems((currentItems) => [
                    ...currentItems,
                    createItemDraft({
                      neededBy: commonNeededBy,
                      pickupDrop: commonPickupDrop,
                      address: commonAddress,
                    }),
                  ])
                }
                className="inline-flex h-10 items-center gap-2 rounded-md bg-teal-700 px-3 text-sm font-bold text-white hover:bg-teal-800"
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Add Saree #{items.length + 1}
              </button>
            </div>
          ) : null}

          {items.map((item, index) => (
            <div
              key={index}
              className="space-y-8 rounded-md border border-stone-200 bg-white p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-stone-900">
                  {orderType === "MULTI" ? `Saree #${index + 1}` : "Saree"}
                </h3>
                {orderType === "MULTI" && items.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setItems((currentItems) =>
                        currentItems.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 text-stone-700 hover:bg-stone-50"
                    aria-label={`Remove saree ${index + 1}`}
                  >
                    <Trash2 aria-hidden="true" className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Stepper
                  label="Pallu Pleats"
                  value={item.palluPleats}
                  onChange={(value) => updateItem(index, { palluPleats: value })}
                />
                <Stepper
                  label="Center Pleats"
                  value={item.centerPleats}
                  onChange={(value) =>
                    updateItem(index, { centerPleats: value })
                  }
                />
              </div>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-800">
                  Saree Photo
                </span>
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-stone-300 bg-white px-3 text-sm font-bold text-stone-700 hover:bg-stone-50">
                    <Camera aria-hidden="true" className="h-4 w-4" />
                    {uploadingItemIndex === index ? "Uploading..." : "Upload"}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) =>
                        handlePhotoChange(index, event.target.files?.[0])
                      }
                    />
                  </span>
                  {item.photoUrl ? (
                    <span className="truncate text-xs font-bold text-teal-700">
                      Photo uploaded
                    </span>
                  ) : null}
                </span>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-800">Price</span>
                <span className="relative block">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-stone-500">
                    ₹
                  </span>
                  <input
                    value={item.price}
                    onChange={(event) =>
                      updateItem(index, { price: event.target.value })
                    }
                    inputMode="decimal"
                    placeholder="0"
                    className="h-11 w-full rounded-md border border-stone-300 bg-white pl-8 pr-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                  />
                </span>
              </label>

              {!isOneTime ? (
                <DeliveryFields
                  neededBy={item.neededBy}
                  pickupDrop={item.pickupDrop}
                  address={item.address}
                  onChange={(next) => {
                    const nextItem: Partial<OrderItemDraft> = { ...next };

                    if (next.pickupDrop === "NO") {
                      nextItem.address = "";
                    }

                    updateItem(index, nextItem);
                  }}
                />
              ) : null}

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-800">
                  Saree Notes
                </span>
                <textarea
                  value={item.sareeNotes}
                  onChange={(event) =>
                    updateItem(index, { sareeNotes: event.target.value })
                  }
                  rows={3}
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                />
              </label>

              <label className="flex min-h-11 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800">
                <input
                  type="checkbox"
                  checked={item.damageNoticed}
                  onChange={(event) =>
                    updateItem(index, {
                      damageNoticed: event.target.checked,
                      damageNotes: event.target.checked ? item.damageNotes : "",
                      informedToCustomer: event.target.checked
                        ? item.informedToCustomer
                        : false,
                    })
                  }
                  className="h-4 w-4 accent-teal-700"
                />
                Damage Noticed
              </label>

              {item.damageNoticed ? (
                <div className="space-y-4">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-stone-800">
                      Damage Notes
                    </span>
                    <textarea
                      value={item.damageNotes}
                      onChange={(event) =>
                        updateItem(index, { damageNotes: event.target.value })
                      }
                      rows={3}
                      className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
                    />
                  </label>
                  <label className="flex min-h-11 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800">
                    <input
                      type="checkbox"
                      checked={item.informedToCustomer}
                      onChange={(event) =>
                        updateItem(index, {
                          informedToCustomer: event.target.checked,
                        })
                      }
                      className="h-4 w-4 accent-teal-700"
                    />
                    Informed to Customer
                  </label>
                </div>
              ) : null}
            </div>
          ))}
        </section>

        <section className="space-y-5 rounded-md border border-stone-200 bg-white p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-stone-950">Payment</h2>
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <input type="hidden" name="discountType" value={discountType} />
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-800">
                Discount
              </span>
              <span className="relative block">
                {discountType === "RUPEE" ? (
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-stone-500">
                    ₹
                  </span>
                ) : null}
                <input
                  name="discountValue"
                  value={discountValue}
                  onChange={(event) => setDiscountValue(event.target.value)}
                  inputMode="decimal"
                  className={`h-11 w-full rounded-md border border-stone-300 bg-white pr-8 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100 ${
                    discountType === "RUPEE" ? "pl-8" : "pl-3"
                  }`}
                />
                {discountType === "PERCENT" ? (
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-base font-bold text-stone-500">
                    %
                  </span>
                ) : null}
              </span>
            </label>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-stone-800">
                Discount Type
              </legend>
              <div className="grid h-11 grid-cols-2 overflow-hidden rounded-md border border-stone-300 bg-white">
                {[
                  { value: "PERCENT", label: "%" },
                  { value: "RUPEE", label: "₹" },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setDiscountType(type.value)}
                    className={`w-14 text-sm font-bold ${
                      discountType === type.value
                        ? "bg-teal-700 text-white"
                        : "bg-white text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-800">
                Advance Paid
              </span>
              <input
                name="advancePaid"
                value={advancePaid}
                onChange={(event) => setAdvancePaid(event.target.value)}
                inputMode="decimal"
                className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-800">
                Payment Method
              </span>
              <select
                name="advancePaymentMethod"
                defaultValue="CASH"
                className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
              >
                {advancePaymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <SummaryTile label="Total Price" value={formatCurrency(totalPrice)} />
            <SummaryTile
              label="Discount"
              value={formatCurrency(discountAmount)}
            />
            <SummaryTile
              label="Balance Due"
              value={formatCurrency(balanceDue)}
            />
          </div>
        </section>

        <button
          type="submit"
          disabled={isPending || uploadingItemIndex !== null}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white shadow-sm hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          <Save aria-hidden="true" className="h-4 w-4" />
          {isPending ? "Saving..." : "Save Order"}
        </button>
      </form>

    </>
  );
}

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-stone-800">{label}</p>
      <div className="grid h-11 grid-cols-[2.75rem_1fr_2.75rem] overflow-hidden rounded-md border border-stone-300 bg-white">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="inline-flex items-center justify-center border-r border-stone-300 text-stone-700 hover:bg-stone-50"
          aria-label={`Decrease ${label}`}
        >
          <Minus aria-hidden="true" className="h-4 w-4" />
        </button>
        <span className="flex items-center justify-center text-base font-bold text-stone-950">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="inline-flex items-center justify-center border-l border-stone-300 text-stone-700 hover:bg-stone-50"
          aria-label={`Increase ${label}`}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DeliveryFields({
  neededBy,
  pickupDrop,
  address,
  onChange,
}: {
  neededBy: string;
  pickupDrop: string;
  address: string;
  onChange: (next: Partial<Pick<OrderItemDraft, "neededBy" | "pickupDrop" | "address">>) => void;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="space-y-2">
        <span className="text-sm font-medium text-stone-800">Delivery date</span>
        <input
          type="date"
          value={neededBy}
          onChange={(event) => onChange({ neededBy: event.target.value })}
          className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium text-stone-800">
          Pickup and Drop
        </span>
        <select
          value={pickupDrop}
          onChange={(event) => onChange({ pickupDrop: event.target.value })}
          className="h-11 w-full rounded-md border border-stone-300 bg-white px-3 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
        >
          {pickupDropOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {pickupDrop !== "NO" ? (
        <label className="space-y-2 sm:col-span-2">
          <span className="text-sm font-medium text-stone-800">Address</span>
          <textarea
            value={address}
            onChange={(event) => onChange({ address: event.target.value })}
            rows={3}
            className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-base outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
          />
        </label>
      ) : null}
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-stone-50 px-3 py-2">
      <p className="text-xs font-medium uppercase text-stone-500">{label}</p>
      <p className="mt-1 text-base font-bold text-stone-950">{value}</p>
    </div>
  );
}
