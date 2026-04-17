import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Devuelve "YYYY-MM-DD" usando la hora LOCAL del dispositivo (evita desfase UTC). */
export function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Retrocede hasta el Lunes de la semana del día dado. */
export function getMonthGridStart(firstDayOfMonth: Date): Date {
  const start = new Date(firstDayOfMonth);
  const pad = (start.getDay() + 6) % 7; // Lun=0, Mar=1, ..., Dom=6
  start.setDate(start.getDate() - pad);
  return start;
}

/** Avanza hasta el Domingo de la semana del día dado. */
export function getMonthGridEnd(lastDayOfMonth: Date): Date {
  const end = new Date(lastDayOfMonth);
  const trail = (7 - end.getDay()) % 7; // Dom=0 (no añade), Lun=6, Sáb=1
  end.setDate(end.getDate() + trail);
  return end;
}
