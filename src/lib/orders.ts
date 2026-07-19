export const orderTypes = [
  { value: "SINGLE", label: "Single" },
  { value: "MULTI", label: "Multi" },
] as const;

export const deliveryTypes = [
  { value: "ONE_TIME", label: "One-time" },
  { value: "MULTIPLE", label: "Multiple" },
] as const;

export const discountTypes = [
  { value: "RUPEE", label: "Rupee" },
  { value: "PERCENT", label: "Percent" },
] as const;

export const paymentMethods = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
] as const;

export const pickupDropOptions = [
  { value: "NO", label: "No" },
  { value: "PICKUP", label: "Pickup" },
  { value: "DROP", label: "Drop" },
  { value: "PICKUP_AND_DROP", label: "Pickup and Drop" },
] as const;

export function formatOrderType(value?: string | null) {
  return orderTypes.find((type) => type.value === value)?.label ?? "Not set";
}

export function formatDeliveryType(value?: string | null) {
  return deliveryTypes.find((type) => type.value === value)?.label ?? "Not set";
}

export function formatDiscountType(value?: string | null) {
  return discountTypes.find((type) => type.value === value)?.label ?? "Not set";
}

export function formatPaymentMethod(value?: string | null) {
  return paymentMethods.find((method) => method.value === value)?.label ?? "Not set";
}

export function formatPickupDrop(value?: string | null) {
  return pickupDropOptions.find((option) => option.value === value)?.label ?? "No";
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function formatDateTime(value: Date | null | undefined) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function calculateDiscountAmount(
  totalPrice: number,
  discountValue: number,
  discountType: string,
) {
  if (discountType === "PERCENT") {
    return Math.min(totalPrice, (totalPrice * discountValue) / 100);
  }

  return Math.min(totalPrice, discountValue);
}

export function calculateBalanceDue({
  totalPrice,
  discountValue,
  discountType,
  totalPaid,
}: {
  totalPrice: number;
  discountValue: number;
  discountType: string;
  totalPaid: number;
}) {
  const discountAmount = calculateDiscountAmount(
    totalPrice,
    discountValue,
    discountType,
  );

  return Math.max(0, totalPrice - discountAmount - totalPaid);
}

export function calculateOrderTotals(order: {
  discountValue: { toString: () => string };
  discountType: string;
  items: Array<{ price: { toString: () => string } }>;
  payments?: Array<{ amount: { toString: () => string } }>;
}) {
  const totalPrice = order.items.reduce(
    (sum, item) => sum + Number(item.price.toString()),
    0,
  );
  const totalPaid =
    order.payments?.reduce(
      (sum, payment) => sum + Number(payment.amount.toString()),
      0,
    ) ?? 0;
  const discountValue = Number(order.discountValue.toString());
  const discountAmount = calculateDiscountAmount(
    totalPrice,
    discountValue,
    order.discountType,
  );
  const balanceDue = calculateBalanceDue({
    totalPrice,
    discountValue,
    discountType: order.discountType,
    totalPaid,
  });

  return {
    totalPrice,
    totalPaid,
    discountValue,
    discountAmount,
    balanceDue,
  };
}
