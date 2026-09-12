import type { DayPlan } from "./types";

export function pickOne<T>(list: T[]): T | null {
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

export function randomizePlan(plan: DayPlan[]): DayPlan[] {
  return plan.map((day) => {
    if (day.candidates.length === 0) {
      return { ...day, chosen: null };
    }
    return { ...day, chosen: pickOne(day.candidates) };
  });
}
