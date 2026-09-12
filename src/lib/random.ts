import type { DayPlan } from "./types";

export function pickOne<T>(list: T[]): T | null {
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function pickWeighted(
  ids: string[],
  usage: Record<string, number>,
): string | null {
  if (ids.length === 0) return null;
  const weights = ids.map((id) => 1 / (1 + (usage[id] ?? 0)));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return pickOne(ids);

  let threshold = Math.random() * total;
  for (let i = 0; i < ids.length; i++) {
    threshold -= weights[i];
    if (threshold <= 0) return ids[i];
  }
  return ids[ids.length - 1];
}

export function randomizePlan(
  plan: DayPlan[],
  usage: Record<string, number> = {},
): DayPlan[] {
  return plan.map((day) => {
    if (day.candidates.length === 0) {
      return { ...day, chosen: null };
    }
    return { ...day, chosen: pickWeighted(day.candidates, usage) };
  });
}
