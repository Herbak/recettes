import {
  lineUnit,
  type Category,
  type CustomShoppingItem,
  type Item,
  type Meal,
} from "./types";

export interface ShoppingLine {
  itemId: string;
  itemName: string;
  unit: string;
  total: number;
  meals: string[];
  custom?: boolean;
}

export interface ShoppingGroup {
  categoryId: string | null;
  categoryName: string;
  lines: ShoppingLine[];
}

export function formatQty(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2).replace(/\.?0+$/, "");
}

export function buildShoppingList(
  chosenMeals: Meal[],
  items: Map<string, Item>,
  categories: Map<string, Category>,
  customItems: CustomShoppingItem[] = [],
): ShoppingGroup[] {
  const agg = new Map<
    string,
    { itemId: string; unit: string; total: number; meals: Set<string> }
  >();

  for (const meal of chosenMeals) {
    for (const line of meal.items) {
      const item = items.get(line.itemId);
      const unit = lineUnit(line.unit, item);
      const key = `${line.itemId}\u0000${unit}`;
      const entry =
        agg.get(key) ??
        { itemId: line.itemId, unit, total: 0, meals: new Set<string>() };
      entry.total += line.quantity;
      entry.meals.add(meal.name);
      agg.set(key, entry);
    }
  }

  const groups = new Map<string, ShoppingGroup>();

  for (const category of categories.values()) {
    groups.set(category.id, {
      categoryId: category.id,
      categoryName: category.name,
      lines: [],
    });
  }

  for (const { itemId, unit, total, meals } of agg.values()) {
    const item = items.get(itemId);
    const catId = item?.categoryId ?? "";
    const catName = catId
      ? (categories.get(catId)?.name ?? "Autres")
      : "Non classé";
    const key = catId || "__none__";

    const group =
      groups.get(key) ??
      ({ categoryId: catId || null, categoryName: catName, lines: [] } as ShoppingGroup);

    group.lines.push({
      itemId,
      itemName: item?.name ?? "Ingrédient inconnu",
      unit,
      total,
      meals: [...meals],
    });
    groups.set(key, group);
  }

  for (const custom of customItems) {
    const catId = custom.categoryId;
    const catName = catId
      ? (categories.get(catId)?.name ?? "Autres")
      : "Non classé";
    const key = catId || "__none__";

    const group =
      groups.get(key) ??
      ({ categoryId: catId || null, categoryName: catName, lines: [] } as ShoppingGroup);

    group.lines.push({
      itemId: custom.id,
      itemName: custom.name,
      unit: "",
      total: 0,
      meals: [],
      custom: true,
    });
    groups.set(key, group);
  }

  const result = [...groups.values()];
  result.sort((a, b) => a.categoryName.localeCompare(b.categoryName, "fr"));
  for (const group of result) {
    group.lines.sort(
      (a, b) =>
        a.itemName.localeCompare(b.itemName, "fr") || a.unit.localeCompare(b.unit, "fr"),
    );
  }
  return result;
}

export function shoppingListToText(groups: ShoppingGroup[]): string {
  const lines: string[] = ["Liste de courses", ""];
  for (const group of groups) {
    if (group.lines.length === 0) continue;
    lines.push(`${group.categoryName}`);
    for (const line of group.lines) {
      if (line.custom) {
        lines.push(`  - ${line.itemName}`);
        continue;
      }
      const qty = `${formatQty(line.total)}${line.unit ? " " + line.unit : ""}`;
      lines.push(`  - ${line.itemName} : ${qty}`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}
