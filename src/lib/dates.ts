export function startOfDay(date = new Date()): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date = new Date()): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + 1);
  return next;
}

export function startOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export function parseDateInput(input?: string | null): Date {
  if (!input) {
    return new Date();
  }

  return new Date(`${input}T00:00:00`);
}

export function parseMonthInput(input?: string | null): Date {
  if (!input) {
    return startOfMonth(new Date());
  }

  const [year, month] = input.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

export function formatDateLabel(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatMonthLabel(date: Date): string {
  return date.toISOString().slice(0, 7);
}
