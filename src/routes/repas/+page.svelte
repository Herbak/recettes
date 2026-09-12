<script lang="ts">
  import { toast } from "svelte-sonner";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import XIcon from "@lucide/svelte/icons/x";
  import { app } from "$lib/store.svelte";
  import type { Meal, MealItem } from "$lib/types";
  import { formatQty } from "$lib/shopping";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Alert from "$lib/components/ui/alert/index.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import * as Select from "$lib/components/ui/select/index.js";

  let editingId = $state<string | null>(null);
  let formName = $state("");
  let formItems = $state<MealItem[]>([]);

  function resetForm() {
    editingId = null;
    formName = "";
    formItems = [];
  }

  function startCreate() {
    resetForm();
    if (app.state.items.length > 0) addLine();
  }

  function startEdit(meal: Meal) {
    editingId = meal.id;
    formName = meal.name;
    formItems = meal.items.map((item) => ({ ...item }));
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
  }

  function remove(meal: Meal) {
    app.removeMeal(meal.id);
    if (editingId === meal.id) resetForm();
    toast.success(`« ${meal.name} » supprimé`);
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

<div class="grid grid-cols-1 gap-5 lg:grid-cols-5">
  <Card.Root class="lg:col-span-3">
    <Card.Header>
      <Card.Title>{editingId ? "Modifier le repas" : "Nouveau repas"}</Card.Title>
    </Card.Header>
    <Card.Content class="flex flex-col gap-4">
      <div class="grid gap-1.5">
        <Label for="meal-name">Nom</Label>
        <Input
          id="meal-name"
          bind:value={formName}
          placeholder="Ex : Pâtes bolognaise"
        />
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
            <PlusIcon /> Ajouter un ingrédient
          </Button>
        </div>

        {#each formItems as line, index (index)}
          <div class="flex items-center gap-2">
            <Select.Root
              type="single"
              bind:value={line.itemId}
              items={app.state.items.map((item) => ({
                value: item.id,
                label: item.name,
              }))}
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
            <Input
              type="number"
              min="0"
              step="any"
              bind:value={line.quantity}
              class="w-20"
            />
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

      <div class="flex gap-2">
        <Button onclick={save} disabled={!formName.trim()}>
          {editingId ? "Enregistrer" : "Créer le repas"}
        </Button>
        {#if editingId}
          <Button variant="outline" onclick={resetForm}>Annuler</Button>
        {/if}
      </div>
    </Card.Content>
  </Card.Root>

  <section class="lg:col-span-2">
    <h2 class="mb-3 font-semibold">Mes repas ({app.state.meals.length})</h2>
    <div class="flex flex-col gap-3">
      {#each app.state.meals as meal (meal.id)}
        <Card.Root size="sm">
          <Card.Header>
            <Card.Title class="flex items-start justify-between gap-2">
              {meal.name}
              <div class="flex shrink-0 gap-1">
                <Button variant="ghost" size="sm" onclick={() => startEdit(meal)}>
                  Modifier
                </Button>
                <AlertDialog.Root>
                  <AlertDialog.Trigger
                    class={buttonVariants({ variant: "destructive", size: "sm" })}
                  >
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
                      <AlertDialog.Action
                        variant="destructive"
                        onclick={() => remove(meal)}
                      >
                        Supprimer
                      </AlertDialog.Action>
                    </AlertDialog.Footer>
                  </AlertDialog.Content>
                </AlertDialog.Root>
              </div>
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <ul class="flex flex-col gap-0.5 text-sm text-muted-foreground">
              {#each meal.items as line (line.itemId + line.quantity)}
                <li>
                  {app.itemById.get(line.itemId)?.name ?? "?"} :
                  {formatQty(line.quantity)}
                  {app.itemById.get(line.itemId)?.unit ?? ""}
                </li>
              {/each}
              {#if meal.items.length === 0}
                <li>Aucun ingrédient</li>
              {/if}
            </ul>
          </Card.Content>
        </Card.Root>
      {/each}
      {#if app.state.meals.length === 0}
        <p class="text-sm text-muted-foreground">Aucun repas enregistré.</p>
      {/if}
    </div>
  </section>
</div>
