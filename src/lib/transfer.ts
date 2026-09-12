import type { AppState, Category, Item, Meal, MealItem } from "./types";

export const EXPORT_APP = "recettes";
export const EXPORT_VERSION = 1;

export interface ExportBundle {
  app: string;
  version: number;
  exportedAt: string;
  categories: Category[];
  items: Item[];
  meals: Meal[];
}

export interface ImportSummary {
  categories: number;
  items: number;
  meals: number;
}

export function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

export function serializeExport(state: AppState): string {
  const bundle: ExportBundle = {
    app: EXPORT_APP,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    categories: state.categories.map((category) => ({ ...category })),
    items: state.items.map((item) => ({ ...item })),
    meals: state.meals.map((meal) => ({
      ...meal,
      items: meal.items.map((line) => ({ ...line })),
    })),
  };
  return JSON.stringify(bundle, null, 2);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function parseExport(text: string): ExportBundle {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Fichier JSON illisible.");
  }

  const root = asRecord(data);
  if (root.app !== EXPORT_APP) {
    throw new Error("Ce fichier ne provient pas de l'application Recettes.");
  }

  const categories: Category[] = [];
  for (const raw of asArray(root.categories)) {
    const record = asRecord(raw);
    const id = asString(record.id);
    const name = asString(record.name);
    if (!id || !name) throw new Error("Catégorie invalide dans le fichier.");
    categories.push({ id, name });
  }

  const items: Item[] = [];
  for (const raw of asArray(root.items)) {
    const record = asRecord(raw);
    const id = asString(record.id);
    const name = asString(record.name);
    if (!id || !name) throw new Error("Ingrédient invalide dans le fichier.");
    items.push({
      id,
      name,
      categoryId: asString(record.categoryId) ?? "",
      unit: asString(record.unit) ?? "",
    });
  }

  const meals: Meal[] = [];
  for (const raw of asArray(root.meals)) {
    const record = asRecord(raw);
    const id = asString(record.id);
    const name = asString(record.name);
    if (!id || !name) throw new Error("Repas invalide dans le fichier.");

    const lines: MealItem[] = [];
    for (const rawLine of asArray(record.items)) {
      const line = asRecord(rawLine);
      const itemId = asString(line.itemId);
      const quantity =
        typeof line.quantity === "number" ? line.quantity : Number(line.quantity);
      const unit = asString(line.unit);
      if (!itemId || !Number.isFinite(quantity)) {
        throw new Error(`Ingrédient invalide dans le repas « ${name} ».`);
      }
      lines.push({ itemId, quantity, ...(unit ? { unit } : {}) });
    }
    meals.push({ id, name, items: lines });
  }

  const categoryIds = new Set(categories.map((category) => category.id));
  for (const item of items) {
    if (item.categoryId && !categoryIds.has(item.categoryId)) {
      throw new Error(`L'ingrédient « ${item.name} » référence une catégorie inconnue.`);
    }
  }

  const itemIds = new Set(items.map((item) => item.id));
  for (const meal of meals) {
    for (const line of meal.items) {
      if (!itemIds.has(line.itemId)) {
        throw new Error(`Le repas « ${meal.name} » référence un ingrédient inconnu.`);
      }
    }
  }

  return {
    app: EXPORT_APP,
    version: typeof root.version === "number" ? root.version : EXPORT_VERSION,
    exportedAt: asString(root.exportedAt) ?? new Date().toISOString(),
    categories,
    items,
    meals,
  };
}
