export const orderItemStatuses = [
  { value: "BOOKED", label: "Booked" },
  { value: "COLLECTED", label: "Collected" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "QUALITY_CHECK", label: "Quality Check" },
  { value: "READY", label: "Ready" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export const activeOrderItemStatuses = orderItemStatuses.filter(
  (status) => status.value !== "CANCELLED",
);

export type OrderItemStatusValue = (typeof orderItemStatuses)[number]["value"];

const statusSequence: OrderItemStatusValue[] = [
  "BOOKED",
  "COLLECTED",
  "IN_PROGRESS",
  "QUALITY_CHECK",
  "READY",
  "DELIVERED",
];

// Order status is intentionally item-level. Multi-delivery orders can have
// sarees finishing at different times, so the order badge is derived from item
// statuses instead of stored separately.
export function formatOrderItemStatus(value?: string | null) {
  return (
    orderItemStatuses.find((status) => status.value === value)?.label ??
    "Not set"
  );
}

// The common path only advances through the main state machine. CANCELLED is
// available through the manual correction dropdown because it is an exception
// state reachable from any stage.
export function getNextStatus(value: string): OrderItemStatusValue | null {
  if (value === "CANCELLED") {
    return null;
  }

  const currentIndex = statusSequence.indexOf(value as OrderItemStatusValue);

  if (currentIndex < 0 || currentIndex === statusSequence.length - 1) {
    return null;
  }

  return statusSequence[currentIndex + 1];
}

export function getOrderStatusSummary(
  items: Array<{ status: string }>,
): { label: string; tone: "stone" | "teal" | "red"; value?: string } {
  if (items.length === 0) {
    return { label: "No items", tone: "stone" };
  }

  const firstStatus = items[0].status;

  if (items.every((item) => item.status === firstStatus)) {
    return {
      label: formatOrderItemStatus(firstStatus),
      tone: getStatusTone(firstStatus),
      value: firstStatus,
    };
  }

  const readyCount = items.filter((item) => item.status === "READY").length;

  if (readyCount > 0) {
    return {
      label: `Partially Ready (${readyCount}/${items.length})`,
      tone: "teal",
      value: "READY",
    };
  }

  const deliveredCount = items.filter(
    (item) => item.status === "DELIVERED",
  ).length;

  if (deliveredCount > 0) {
    return {
      label: `Partially Delivered (${deliveredCount}/${items.length})`,
      tone: "teal",
      value: "DELIVERED",
    };
  }

  const nonCancelled = items.filter((item) => item.status !== "CANCELLED");
  const target =
    statusSequence
      .slice()
      .reverse()
      .find((status) => nonCancelled.some((item) => item.status === status)) ??
    "CANCELLED";
  const targetCount = items.filter((item) => item.status === target).length;

  return {
    label: `Partially ${formatOrderItemStatus(target)} (${targetCount}/${items.length})`,
    tone: getStatusTone(target),
    value: target,
  };
}

export function getStatusTone(status: string): "stone" | "teal" | "red" {
  if (status === "CANCELLED") {
    return "red";
  }

  if (status === "READY" || status === "DELIVERED") {
    return "teal";
  }

  return "stone";
}

export function getStatusBadgeClass(tone: "stone" | "teal" | "red") {
  if (tone === "red") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (tone === "teal") {
    return "border-teal-200 bg-teal-50 text-teal-700";
  }

  return "border-stone-200 bg-stone-50 text-stone-700";
}

export function getPickupDropMessage(value: string) {
  return value === "DROP" || value === "PICKUP_AND_DROP"
    ? "we'll drop it off to you shortly"
    : "for you to pick up";
}

// WhatsApp is only opened from Collected/Ready UI states. This helper builds a
// plain wa.me deep link so the owner can review and send manually; no API key or
// WhatsApp Business integration is needed.
export function getWhatsAppHref({
  phoneNumber,
  message,
}: {
  phoneNumber: string;
  message: string;
}) {
  const digits = phoneNumber.replace(/\D/g, "");
  const normalizedPhone = digits.length === 10 ? `91${digits}` : digits;

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
