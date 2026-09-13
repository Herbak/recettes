import { load } from "@tauri-apps/plugin-store";
import {
  emptyState,
  uid,
  type AppState,
  type Category,
  type CustomShoppingItem,
  type Item,
  type Meal,
  type MealItem,
  type Note,
} from "./types";
import { randomizePlan } from "./random";
import { buildShoppingList } from "./shopping";
import {
  normalizeName,
  serializeExport,
  type ExportBundle,
  type ImportSummary,
} from "./transfer";

const STORE_FILE = "recettes.json";
const STORE_KEY = "state";

type StoreHandle = Awaited<ReturnType<typeof load>>;

class AppStore {
  state = $state<AppState>(emptyState());
  ready = $state(false);

  #store: StoreHandle | null = null;
  #useFs = false;
  #saveTimer: ReturnType<typeof setTimeout> | undefined;

  itemById = $derived(new Map(this.state.items.map((i) => [i.id, i])));
  categoryById = $derived(new Map(this.state.categories.map((c) => [c.id, c])));
  mealById = $derived(new Map(this.state.meals.map((m) => [m.id, m])));

  chosenMeals = $derived(
    this.state.plan
      .map((d) => d.chosen)
      .filter((id): id is string => !!id)
      .map((id) => this.mealById.get(id))
      .filter((m): m is Meal => !!m),
  );

  shoppingGroups = $derived(
    buildShoppingList(
      this.chosenMeals,
      this.itemById,
      this.categoryById,
      this.state.customShopping,
    ),
  );

  shoppingTotal = $derived(
    this.shoppingGroups.reduce((n, g) => n + g.lines.length, 0),
  );

  shoppingRemaining = $derived(
    this.shoppingGroups.reduce(
      (n, g) =>
        n +
        g.lines.filter(
          (l) => !this.state.shoppingChecked.includes(`${l.itemId}\u0000${l.unit}`),
        ).length,
      0,
    ),
  );

  shoppingDone = $derived(
    this.shoppingTotal > 0 && this.shoppingRemaining === 0,
  );

  async init() {
    const data = await this.#load();
    if (data) this.state = this.#normalize(data);
    this.ready = true;
    $effect.root(() => {
      $effect(() => {
        JSON.stringify(this.state);
        this.#scheduleSave();
      });
    });
  }

  #normalize(data: AppState): AppState {
    const base = emptyState();
    const plan = base.plan.map((d) => {
      const found = data.plan?.find((p) => p.day === d.day);
      return found
        ? {
            day: d.day,
            candidates: found.candidates ?? [],
            chosen: found.chosen ?? null,
          }
        : d;
    });
    const mealIds = new Set((data.meals ?? []).map((meal) => meal.id));
    const usage: Record<string, number> = {};
    for (const [id, count] of Object.entries(data.usage ?? {})) {
      if (mealIds.has(id) && typeof count === "number") usage[id] = count;
    }
    return {
      categories: data.categories ?? [],
      items: data.items ?? [],
      meals: data.meals ?? [],
      plan,
      customShopping: Array.isArray(data.customShopping) ? data.customShopping : [],
      notes: Array.isArray(data.notes) ? data.notes : [],
      usage,
      counted: Array.isArray(data.counted)
        ? data.counted.filter((id) => mealIds.has(id))
        : [],
      shoppingChecked: Array.isArray(data.shoppingChecked)
        ? data.shoppingChecked
        : [],
      validated: data.validated ?? false,
    };
  }

  async #load(): Promise<AppState | null> {
    try {
      const store = await load(STORE_FILE, { autoSave: false });
      this.#store = store;
      this.#useFs = true;
      return (await store.get<AppState>(STORE_KEY)) ?? null;
    } catch {
      try {
        const raw = localStorage.getItem(STORE_KEY);
        return raw ? (JSON.parse(raw) as AppState) : null;
      } catch {
        return null;
      }
    }
  }

  #scheduleSave() {
    if (!this.ready) return;
    clearTimeout(this.#saveTimer);
    this.#saveTimer = setTimeout(() => void this.#save(), 300);
  }

  async #save() {
    if (this.#useFs && this.#store) {
      await this.#store.set(STORE_KEY, this.state);
      await this.#store.save();
    } else {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.state));
    }
  }

  // --- Categories ---
  addCategory(name: string): Category {
    const category: Category = { id: uid(), name: name.trim() };
    this.state.categories.push(category);
    return category;
  }

  renameCategory(id: string, name: string) {
    const category = this.state.categories.find((c) => c.id === id);
    if (category) category.name = name.trim();
  }

  removeCategory(id: string) {
    this.state.categories = this.state.categories.filter((c) => c.id !== id);
    for (const item of this.state.items) {
      if (item.categoryId === id) item.categoryId = "";
    }
    for (const custom of this.state.customShopping) {
      if (custom.categoryId === id) custom.categoryId = "";
    }
  }

  // --- Items ---
  addItem(name: string, categoryId: string, unit: string): Item {
    const item: Item = {
      id: uid(),
      name: name.trim(),
      categoryId,
      unit: unit.trim(),
    };
    this.state.items.push(item);
    return item;
  }

  updateItem(id: string, patch: Partial<Omit<Item, "id">>) {
    const item = this.state.items.find((i) => i.id === id);
    if (item) Object.assign(item, patch);
  }

  removeItem(id: string) {
    this.state.items = this.state.items.filter((i) => i.id !== id);
    for (const meal of this.state.meals) {
      meal.items = meal.items.filter((mi) => mi.itemId !== id);
    }
  }

  // --- Meals ---
  addMeal(name: string, items: MealItem[]): Meal {
    const meal: Meal = { id: uid(), name: name.trim(), items };
    this.state.meals.push(meal);
    return meal;
  }

  updateMeal(id: string, name: string, items: MealItem[]) {
    const meal = this.state.meals.find((m) => m.id === id);
    if (!meal) return;
    meal.name = name.trim();
    meal.items = items;
  }

  removeMeal(id: string) {
    this.state.meals = this.state.meals.filter((m) => m.id !== id);
    for (const day of this.state.plan) {
      day.candidates = day.candidates.filter((c) => c !== id);
      if (day.chosen === id) day.chosen = null;
    }
    delete this.state.usage[id];
    this.state.counted = this.state.counted.filter((c) => c !== id);
  }

  // --- Plan ---
  addCandidate(day: number, mealId: string) {
    const plan = this.state.plan[day];
    if (!plan || plan.candidates.includes(mealId)) return;
    plan.candidates.push(mealId);
    this.state.validated = false;
  }

  removeCandidate(day: number, mealId: string) {
    const plan = this.state.plan[day];
    if (!plan) return;
    plan.candidates = plan.candidates.filter((c) => c !== mealId);
    if (plan.chosen === mealId) plan.chosen = null;
    this.state.validated = false;
  }

  setChosen(day: number, mealId: string | null) {
    const plan = this.state.plan[day];
    if (!plan) return;
    plan.chosen = mealId;
    this.state.validated = false;
  }

  randomize() {
    this.state.plan = randomizePlan(this.state.plan, this.state.usage);
    this.state.validated = false;
  }

  newWeek() {
    for (const day of this.state.plan) {
      day.chosen = null;
    }
    this.state.customShopping = [];
    this.state.counted = [];
    this.state.validated = false;
    this.state.shoppingChecked = [];
  }

  validate() {
    const chosen = new Set(
      this.state.plan
        .map((day) => day.chosen)
        .filter((id): id is string => !!id),
    );

    for (const id of chosen) {
      if (!this.state.counted.includes(id)) {
        this.state.usage[id] = (this.state.usage[id] ?? 0) + 1;
      }
    }

    for (const id of this.state.counted) {
      if (chosen.has(id)) continue;
      const next = (this.state.usage[id] ?? 0) - 1;
      if (next > 0) this.state.usage[id] = next;
      else delete this.state.usage[id];
    }

    this.state.counted = [...chosen];

    const customIds = new Set(this.state.customShopping.map((item) => item.id));
    this.state.shoppingChecked = this.state.shoppingChecked.filter((key) =>
      customIds.has(key.split("\u0000")[0]),
    );

    this.state.validated = true;
  }

  // --- Shopping list ---
  isShoppingChecked(itemId: string, unit: string): boolean {
    return this.state.shoppingChecked.includes(`${itemId}\u0000${unit}`);
  }

  toggleShopping(itemId: string, unit: string) {
    const key = `${itemId}\u0000${unit}`;
    this.state.shoppingChecked = this.state.shoppingChecked.includes(key)
      ? this.state.shoppingChecked.filter((k) => k !== key)
      : [...this.state.shoppingChecked, key];
  }

  resetShopping() {
    this.state.shoppingChecked = [];
  }

  // --- Custom shopping items ---
  addCustomShopping(name: string, categoryId: string): CustomShoppingItem | null {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const item: CustomShoppingItem = { id: uid(), name: trimmed, categoryId };
    this.state.customShopping.push(item);
    return item;
  }

  updateCustomShopping(id: string, name: string) {
    const item = this.state.customShopping.find((c) => c.id === id);
    if (item) item.name = name.trim();
  }

  removeCustomShopping(id: string) {
    this.state.customShopping = this.state.customShopping.filter((c) => c.id !== id);
    this.state.shoppingChecked = this.state.shoppingChecked.filter(
      (k) => !k.startsWith(`${id}\u0000`),
    );
  }

  // --- Notes ---
  addNote(text: string): Note | null {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const note: Note = { id: uid(), text: trimmed, createdAt: Date.now() };
    this.state.notes.push(note);
    return note;
  }

  updateNote(id: string, text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const note = this.state.notes.find((n) => n.id === id);
    if (note) note.text = trimmed;
  }

  removeNote(id: string) {
    this.state.notes = this.state.notes.filter((n) => n.id !== id);
  }

  // --- Export / Import ---
  exportContent(): string {
    return serializeExport(this.state);
  }

  replaceContent(bundle: ExportBundle) {
    this.state.categories = bundle.categories.map((category) => ({ ...category }));
    this.state.items = bundle.items.map((item) => ({ ...item }));
    this.state.meals = bundle.meals.map((meal) => ({
      ...meal,
      items: meal.items.map((line) => ({ ...line })),
    }));
    this.state.plan = emptyState().plan;
    this.state.customShopping = [];
    this.state.usage = this.#pruneUsage(bundle.meals.map((m) => m.id));
    this.state.counted = [];
    this.state.validated = false;
    this.state.shoppingChecked = [];
  }

  resetUsage() {
    this.state.usage = {};
    this.state.counted = [];
  }

  #pruneUsage(mealIds: string[]): Record<string, number> {
    const ids = new Set(mealIds);
    const usage: Record<string, number> = {};
    for (const [id, count] of Object.entries(this.state.usage)) {
      if (ids.has(id)) usage[id] = count;
    }
    return usage;
  }

  mergeContent(bundle: ExportBundle): ImportSummary {
    const categoryMap = new Map<string, string>();
    let categories = 0;
    for (const category of bundle.categories) {
      const existing = this.state.categories.find(
        (c) => normalizeName(c.name) === normalizeName(category.name),
      );
      if (existing) {
        categoryMap.set(category.id, existing.id);
      } else {
        const created: Category = { id: uid(), name: category.name };
        this.state.categories.push(created);
        categoryMap.set(category.id, created.id);
        categories++;
      }
    }

    const itemMap = new Map<string, string>();
    let items = 0;
    for (const item of bundle.items) {
      const existing = this.state.items.find(
        (i) => normalizeName(i.name) === normalizeName(item.name),
      );
      if (existing) {
        itemMap.set(item.id, existing.id);
      } else {
        const created: Item = {
          id: uid(),
          name: item.name,
          categoryId: categoryMap.get(item.categoryId) ?? "",
          unit: item.unit,
        };
        this.state.items.push(created);
        itemMap.set(item.id, created.id);
        items++;
      }
    }

    let meals = 0;
    for (const meal of bundle.meals) {
      if (
        this.state.meals.some(
          (m) => normalizeName(m.name) === normalizeName(meal.name),
        )
      ) {
        continue;
      }
      const lines = meal.items
        .map((line) => ({
          itemId: itemMap.get(line.itemId) ?? "",
          quantity: line.quantity,
          ...(line.unit ? { unit: line.unit } : {}),
        }))
        .filter((line) => line.itemId);
      this.state.meals.push({ id: uid(), name: meal.name, items: lines });
      meals++;
    }

    return { categories, items, meals };
  }
}

export const app = new AppStore();
