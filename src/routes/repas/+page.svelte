<script lang="ts">
  import { toast } from "svelte-sonner";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import XIcon from "@lucide/svelte/icons/x";
  import SearchIcon from "@lucide/svelte/icons/search";
  import { app } from "$lib/store.svelte";
  import type { Meal, MealItem } from "$lib/types";
  import { formatQty } from "$lib/shopping";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Alert from "$lib/components/ui/alert/index.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as Select from "$lib/components/ui/select/index.js";

  let search = $state("");
  let dialogOpen = $state(false);
  let editingId = $state<string | null>(null);
  let formName = $state("");
  let formItems = $state<MealItem[]>([]);

  const filtered = $derived(
    app.state.meals.filter((meal) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      if (meal.name.toLowerCase().includes(q)) return true;
      return meal.items.some((line) =>
        (app.itemById.get(line.itemId)?.name ?? "").toLowerCase().includes(q),
      );
    }),
  );

  function resetForm() {
    editingId = null;
    formName = "";
    formItems = [];
  }

  function startCreate() {
    resetForm();
    if (app.state.items.length > 0) addLine();
    dialogOpen = true;
  }

  function startEdit(meal: Meal) {
    editingId = meal.id;
    formName = meal.name;
    formItems = meal.items.map((item) => ({ ...item }));
    dialogOpen = true;
  }

  function addLine() {
    formItems.push({ itemId: app.state.items[0]?.id ?? "", quantity: 1 });
  }

  function removeLine(index: number) {
    formItems.splice(index, 1);
  }

  function save() {
    if (!formName.trim()) return;
    const items = formItems.filter((line) => line.itemId);
    if (editingId) {
      app.updateMeal(editingId, formName, items);
      toast.success("Repas modifié");
    } else {
      app.addMeal(formName, items);
      toast.success("Repas créé");
    }
    resetForm();
    dialogOpen = false;
  }

  function remove(meal: Meal) {
    app.removeMeal(meal.id);
    if (editingId === meal.id) resetForm();
    toast.success(`« ${meal.name} » supprimé`);
  }

  function summary(meal: Meal): string {
    return meal.items
      .map((line) => {
        const item = app.itemById.get(line.itemId);
        return `${formatQty(line.quantity)} ${item?.unit ?? ""} ${item?.name ?? "?"}`.trim();
      })
      .join(" · ");
  }
</script>

<div class="mb-5 flex items-center gap-3">
  <h1 class="text-xl font-semibold">Repas</h1>
  <Button class="ml-auto" onclick={startCreate}>
    <PlusIcon /> Nouveau repas
  </Button>
</div>

{#if app.state.items.length === 0}
  <Alert.Root class="mb-5 border-amber-300 bg-amber-50 text-amber-800">
    <Alert.Title>Ajoutez d'abord des ingrédients</Alert.Title>
    <Alert.Description>
      Rendez-vous dans l'onglet
      <a href="/ingredients" class="font-medium underline">Ingrédients</a>.
    </Alert.Description>
  </Alert.Root>
{/if}

<div class="relative mb-4 max-w-md">
  <SearchIcon class="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
  <Input bind:value={search} placeholder="Rechercher un repas ou un ingrédient…" class="pl-8" />
</div>

<div class="flex flex-col gap-3">
  {#each filtered as meal (meal.id)}
    <Card.Root>
      <Card.Content class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <div class="font-medium">{meal.name}</div>
          {#if meal.items.length > 0}
            <div class="mt-0.5 text-sm text-muted-foreground">{summary(meal)}</div>
          {:else}
            <div class="mt-0.5 text-sm text-muted-foreground">Aucun ingrédient</div>
          {/if}
        </div>
        <div class="flex shrink-0 gap-1">
          <Button variant="ghost" size="sm" onclick={() => startEdit(meal)}>Modifier</Button>
          <AlertDialog.Root>
            <AlertDialog.Trigger class={buttonVariants({ variant: "destructive", size: "sm" })}>
              Suppr.
            </AlertDialog.Trigger>
            <AlertDialog.Content>
              <AlertDialog.Header>
                <AlertDialog.Title>Supprimer « {meal.name} » ?</AlertDialog.Title>
                <AlertDialog.Description>
                  Cette action est irréversible.
                </AlertDialog.Description>
              </AlertDialog.Header>
              <AlertDialog.Footer>
                <AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
                <AlertDialog.Action variant="destructive" onclick={() => remove(meal)}>
                  Supprimer
                </AlertDialog.Action>
              </AlertDialog.Footer>
            </AlertDialog.Content>
          </AlertDialog.Root>
        </div>
      </Card.Content>
    </Card.Root>
  {/each}
  {#if app.state.meals.length === 0}
    <p class="text-sm text-muted-foreground">Aucun repas enregistré.</p>
  {:else if filtered.length === 0}
    <p class="text-sm text-muted-foreground">Aucun repas ne correspond à « {search} ».</p>
  {/if}
</div>

<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Content class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{editingId ? "Modifier le repas" : "Nouveau repas"}</Dialog.Title>
      <Dialog.Description>
        Ajoutez un nom et les ingrédients avec leurs quantités.
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-0.5 py-1">
      <div class="grid gap-1.5">
        <Label for="meal-name">Nom</Label>
        <Input id="meal-name" bind:value={formName} placeholder="Ex : Pâtes bolognaise" />
      </div>

      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium">Ingrédients</span>
          <Button
            variant="outline"
            size="sm"
            onclick={addLine}
            disabled={app.state.items.length === 0}
          >
            <PlusIcon /> Ajouter
          </Button>
        </div>

        {#each formItems as line, index (index)}
          <div class="flex items-center gap-2">
            <Select.Root
              type="single"
              bind:value={line.itemId}
              items={app.state.items.map((item) => ({ value: item.id, label: item.name }))}
            >
              <Select.Trigger class="w-full flex-1">
                <Select.Value placeholder="Ingrédient" />
              </Select.Trigger>
              <Select.Content>
                {#each app.state.items as item (item.id)}
                  <Select.Item value={item.id} label={item.name}>{item.name}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
            <Input type="number" min="0" step="any" bind:value={line.quantity} class="w-20" />
            <span class="w-12 text-xs text-muted-foreground">
              {app.itemById.get(line.itemId)?.unit ?? ""}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onclick={() => removeLine(index)}
              aria-label="Retirer la ligne"
            >
              <XIcon />
            </Button>
          </div>
        {/each}
        {#if formItems.length === 0}
          <p class="text-xs text-muted-foreground">Aucun ingrédient dans ce repas.</p>
        {/if}
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (dialogOpen = false)}>Annuler</Button>
      <Button onclick={save} disabled={!formName.trim()}>
        {editingId ? "Enregistrer" : "Créer le repas"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
