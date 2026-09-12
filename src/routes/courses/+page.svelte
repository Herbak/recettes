<script lang="ts">
  import { toast } from "svelte-sonner";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import { app } from "$lib/store.svelte";
  import { buildShoppingList, formatQty, shoppingListToText } from "$lib/shopping";
  import { DAYS, type Meal } from "$lib/types";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import * as Card from "$lib/components/ui/card/index.js";

  const chosenMeals = $derived(
    app.state.plan
      .map((d) => d.chosen)
      .filter((id): id is string => !!id)
      .map((id) => app.mealById.get(id))
      .filter((m): m is Meal => !!m),
  );

  const groups = $derived(
    buildShoppingList(chosenMeals, app.itemById, app.categoryById),
  );

  let checked = $state<string[]>([]);

  function toggle(itemId: string) {
    checked = checked.includes(itemId)
      ? checked.filter((id) => id !== itemId)
      : [...checked, itemId];
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shoppingListToText(groups));
      toast.success("Liste copiée dans le presse-papiers");
    } catch {
      toast.error("Impossible de copier la liste");
    }
  }
</script>

<div class="mb-5 flex flex-wrap items-center gap-3">
  <h1 class="text-xl font-semibold">Liste de courses</h1>
  <Badge variant="secondary">{chosenMeals.length} repas</Badge>
  {#if app.state.validated}
    <Badge class="bg-emerald-600 text-white">Validée</Badge>
  {:else if chosenMeals.length > 0}
    <Badge class="bg-amber-100 text-amber-700">Semaine non validée</Badge>
  {/if}

  <Button variant="outline" class="ml-auto" onclick={copy} disabled={groups.length === 0}>
    <CopyIcon /> Copier la liste
  </Button>
</div>

{#if chosenMeals.length === 0}
  <Card.Root>
    <Card.Content class="py-6 text-center text-sm text-muted-foreground">
      Aucun repas sélectionné. Rendez-vous dans
      <a href="/" class="font-medium text-primary underline">Semaine</a>
      pour randomiser votre menu.
    </Card.Content>
  </Card.Root>
{:else}
  <Card.Root class="mb-5">
    <Card.Header>
      <Card.Title class="text-sm text-muted-foreground">Menu de la semaine</Card.Title>
    </Card.Header>
    <Card.Content class="flex flex-wrap gap-2">
      {#each app.state.plan as day (day.day)}
        {#if day.chosen}
          <Badge variant="secondary">
            <span class="font-medium">{DAYS[day.day]}</span> · {app.mealById.get(day.chosen)?.name ?? "?"}
          </Badge>
        {/if}
      {/each}
    </Card.Content>
  </Card.Root>

  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {#each groups as group (group.categoryName)}
      <Card.Root>
        <Card.Header>
          <Card.Title>{group.categoryName}</Card.Title>
        </Card.Header>
        <Card.Content>
          <ul class="flex flex-col gap-3">
            {#each group.lines as line (line.itemId)}
              <li class="flex items-start gap-2">
                <Checkbox
                  class="mt-0.5"
                  checked={checked.includes(line.itemId)}
                  onCheckedChange={() => toggle(line.itemId)}
                />
                <div class="min-w-0 flex-1">
                  <div class="flex items-baseline justify-between gap-2">
                    <span
                      class="text-sm font-medium {checked.includes(line.itemId)
                        ? 'line-through text-muted-foreground'
                        : ''}"
                    >
                      {line.itemName}
                    </span>
                    <span class="shrink-0 text-sm text-muted-foreground">
                      {formatQty(line.total)}
                      {line.unit}
                    </span>
                  </div>
                  <p class="truncate text-xs text-muted-foreground">
                    {line.meals.join(", ")}
                  </p>
                </div>
              </li>
            {/each}
          </ul>
        </Card.Content>
      </Card.Root>
    {/each}
  </div>
{/if}
