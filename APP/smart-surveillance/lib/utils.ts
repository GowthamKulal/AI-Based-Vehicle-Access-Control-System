import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, toZonedTime } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function nextInt(): number {
  const MAX_INT = 2147483648; // 2^31
  return Math.floor(Math.random() * MAX_INT);
}

export function formatLogDate(rawTimestamp: string) {
  try {
    // Remove microseconds
    const trimmed = rawTimestamp.split(".")[0]; // e.g., "2025-06-11T06:23:52"
    // Parse as UTC date
    const utcDate = new Date(trimmed + "Z"); // Explicitly mark as UTC
    if (isNaN(utcDate.getTime())) return "Invalid date";

    // Convert to IST (Asia/Kolkata)
    const zonedDate = toZonedTime(utcDate, "Asia/Kolkata");
    return format(zonedDate, "dd MMM yyyy, h:mm a");
  } catch (e) {
    return "Invalid date";
  }
}
