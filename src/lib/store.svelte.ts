import { load } from "@tauri-apps/plugin-store";
import {
  emptyState,
  uid,
  type AppState,
  type Category,
  type Item,
  type Meal,
  type MealItem,
} from "./types";
import { randomizePlan } from "./random";
import { DEFAULT_CATALOG } from "./seed";

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

  async init() {
    const data = await this.#load();
    if (data) {
      this.state = this.#normalize(data);
    } else {
      this.loadDefaultCatalog();
    }
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
    return {
      categories: data.categories ?? [],
      items: data.items ?? [],
      meals: data.meals ?? [],
      plan,
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

  loadDefaultCatalog() {
    for (const seedCategory of DEFAULT_CATALOG) {
      let category = this.state.categories.find(
        (c) => c.name.toLowerCase() === seedCategory.name.toLowerCase(),
      );
      if (!category) {
        category = { id: uid(), name: seedCategory.name };
        this.state.categories.push(category);
      }
      for (const seedItem of seedCategory.items) {
        const exists = this.state.items.some(
          (i) => i.name.toLowerCase() === seedItem.name.toLowerCase(),
        );
        if (!exists) {
          this.state.items.push({
            id: uid(),
            name: seedItem.name,
            categoryId: category.id,
            unit: seedItem.unit,
          });
        }
      }
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
    this.state.plan = randomizePlan(this.state.plan);
    this.state.validated = false;
  }

  resetWeek() {
    for (const day of this.state.plan) {
      day.candidates = [];
      day.chosen = null;
    }
    this.state.validated = false;
  }

  validate() {
    this.state.validated = true;
  }
}

export const app = new AppStore();
