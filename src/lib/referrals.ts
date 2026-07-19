export const referralSources = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "WHATSAPP_STATUS", label: "WhatsApp Status" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "GOOGLE", label: "Google" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "OTHER", label: "Other" },
] as const;

export const referralKinds = [
  { value: "SOCIAL_MEDIA", label: "Social media source" },
  { value: "EXISTING_CUSTOMER", label: "Existing customer" },
] as const;

export type ReferralSourceValue = (typeof referralSources)[number]["value"];
export type ReferralKindValue = (typeof referralKinds)[number]["value"];

export function formatReferralSource(value?: string | null) {
  return referralSources.find((source) => source.value === value)?.label ?? "Not set";
}

export function formatReferralKind(value?: string | null) {
  return referralKinds.find((kind) => kind.value === value)?.label ?? "Not set";
}
