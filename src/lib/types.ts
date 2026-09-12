export interface Category {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  name: string;
  categoryId: string;
  unit: string;
}

export interface MealItem {
  itemId: string;
  quantity: number;
  unit?: string;
}

export interface Meal {
  id: string;
  name: string;
  items: MealItem[];
}

export interface DayPlan {
  day: number;
  candidates: string[];
  chosen: string | null;
}

export interface AppState {
  categories: Category[];
  items: Item[];
  meals: Meal[];
  plan: DayPlan[];
  validated: boolean;
}

export const DAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
] as const;

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function itemUnits(item?: Item): string[] {
  if (!item?.unit) return [];
  return item.unit
    .split(",")
    .map((unit) => unit.trim())
    .filter(Boolean);
}

export function primaryUnit(item?: Item): string {
  return itemUnits(item)[0] ?? "";
}

export function lineUnit(unit: string | undefined, item?: Item): string {
  const trimmed = unit?.trim();
  return trimmed || primaryUnit(item);
}

export function emptyState(): AppState {
  return {
    categories: [],
    items: [],
    meals: [],
    plan: Array.from({ length: 7 }, (_, day) => ({
      day,
      candidates: [],
      chosen: null,
    })),
    validated: false,
  };
}
