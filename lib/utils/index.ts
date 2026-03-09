import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(function(part) { return part.length > 0; })
    .slice(0, 2)
    .map(function(part) { return part.charAt(0); })
    .join("")
    .toUpperCase();
}

export function getAvatarColor(name: string): string {
  var colors = [
    "bg-violet-500", "bg-brand-500", "bg-pink-500",
    "bg-rose-500",   "bg-orange-500", "bg-amber-500",
    "bg-emerald-500","bg-teal-500",   "bg-sky-500",
    "bg-indigo-500", "bg-cyan-500",   "bg-purple-500"
  ];
  if (name.length === 0) { return "bg-brand-500"; }
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  var index = Math.abs(hash) % colors.length;
  return colors[index] || "bg-brand-500";
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) { return str; }
  return str.slice(0, maxLength) + "\u2026";
}

export function isValidUrl(str: string): boolean {
  if (!str) { return false; }
  try {
    new URL(str);
    return true;
  } catch(e) {
    return false;
  }
}

export function formatCount(n: number): string {
  if (n >= 1000000) { return (n / 1000000).toFixed(1) + "M"; }
  if (n >= 1000)    { return (n / 1000).toFixed(1) + "K"; }
  return String(n);
}
