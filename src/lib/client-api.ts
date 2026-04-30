import type { ApiErrorResponse } from "@/lib/types";

export async function apiFetch<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers
    }
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new Error(payload?.error ?? `Request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

export function formToObject(form: HTMLFormElement) {
  const entries: Record<string, FormDataEntryValue> = {};
  const formData = new FormData(form);

  for (const [key, value] of formData.entries()) {
    entries[key] = value;
  }

  return entries;
}

export function formatNumber(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "N/A";
  }

  return `${new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value)}${suffix}`;
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(new Date(value));
}
