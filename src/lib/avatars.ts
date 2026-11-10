import type { GoatAccessory } from "@/components/Goat";

export type AvatarPreset = {
  id: string;
  accessory: GoatAccessory;
  fur: string;
  background: string;
};

/** Preset avatars a user can pick instead of uploading a photo. */
export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: "classic", accessory: "none", fur: "#F1E4CF", background: "#3B3355" },
  { id: "sombrero", accessory: "sombrero", fur: "#C79A6B", background: "#5A3A2E" },
  { id: "beret", accessory: "beret", fur: "#F1E4CF", background: "#2C4A6E" },
  { id: "beanie", accessory: "beanie", fur: "#BFC3C9", background: "#1F4E7A" },
  { id: "alpine", accessory: "alpine", fur: "#D9B48F", background: "#2F4A36" },
  { id: "laurel", accessory: "laurel", fur: "#EDE3D1", background: "#5B2F3F" },
  { id: "crown", accessory: "crown", fur: "#F1E4CF", background: "#6B4E12" },
  { id: "night", accessory: "headphones", fur: "#6E6480", background: "#1D1A2B" },
];

export function getPreset(id: string | null | undefined) {
  return AVATAR_PRESETS.find((p) => p.id === id) ?? AVATAR_PRESETS[0];
}
