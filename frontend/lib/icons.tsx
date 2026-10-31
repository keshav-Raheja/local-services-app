import React from "react";
import {
  Zap,
  Wrench,
  GraduationCap,
  Laptop,
  Paintbrush,
  Sparkles,
  AirVent,
  KeyRound,
  Hammer,
  ShieldCheck,
  Briefcase,
  LucideIcon,
} from "lucide-react";

export const SERVICE_ICON_MAP: Record<string, LucideIcon> = {
  electrician: Zap,
  plumber: Wrench,
  tutor: GraduationCap,
  "home tutor": GraduationCap,
  "laptop repair": Laptop,
  painter: Paintbrush,
  cleaner: Sparkles,
  "ac repair": AirVent,
  locksmith: KeyRound,
  "shuttering (sattering)": Hammer,
  carpenter: Hammer,
};

export function getServiceIcon(serviceName?: string): LucideIcon {
  if (!serviceName) return Briefcase;
  const normalized = serviceName.trim().toLowerCase();
  for (const [key, icon] of Object.entries(SERVICE_ICON_MAP)) {
    if (normalized.includes(key)) {
      return icon;
    }
  }
  return Briefcase;
}
