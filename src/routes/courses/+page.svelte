<script lang="ts">
  import { toast } from "svelte-sonner";
  import CopyIcon from "@lucide/svelte/icons/copy";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import PencilIcon from "@lucide/svelte/icons/pencil";
  import TrashIcon from "@lucide/svelte/icons/trash-2";
  import { app } from "$lib/store.svelte";
  import { formatQty, shoppingListToText, type ShoppingLine } from "$lib/shopping";
  import { type Meal } from "$lib/types";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";

  const chosenMeals = $derived(
    app.state.plan
      .map((d) => d.chosen)
      .filter((id): id is string => !!id)
      .map((id) => app.mealById.get(id))
      .filter((m): m is Meal => !!m),
  );

  const groups = $derived(app.shoppingGroups);

  let customOpen = $state(false);
  let customEditingId = $state<string | null>(null);
  let customName = $state("");
  let customCategoryId = $state("");

  function startAddCustom(categoryId: string | null) {
    customEditingId = null;
    customName = "";
    customCategoryId = categoryId ?? "";
    customOpen = true;
  }

  function startEditCustom(line: ShoppingLine) {
    customEditingId = line.itemId;
    customName = line.itemName;
    customCategoryId = "";
    customOpen = true;
  }

  function saveCustom() {
    if (!customName.trim()) return;
    if (customEditingId) {
      app.updateCustomShopping(customEditingId, customName);
      toast.success("Article modifié");
    } else {
      app.addCustomShopping(customName, customCategoryId);
      toast.success("Article ajouté");
    }
    customOpen = false;
  }

  function removeCustom(line: ShoppingLine) {
    app.removeCustomShopping(line.itemId);
    toast.success(`« ${line.itemName} » supprimé`);
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

{#if groups.length === 0}
  <Card.Root>
    <Card.Content class="py-6 text-center text-sm text-muted-foreground">
      Aucun repas sélectionné. Rendez-vous dans
      <a href="/creation-du-menu" class="font-medium text-primary underline">Création du menu</a>
      pour randomiser votre menu.
    </Card.Content>
  </Card.Root>
{:else}
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {#each groups as group (group.categoryName)}
      <Card.Root>
        <Card.Header>
          <Card.Title>{group.categoryName}</Card.Title>
          <Card.Action>
            <Button
              variant="ghost"
              size="icon-sm"
              onclick={() => startAddCustom(group.categoryId)}
              aria-label="Ajouter un article"
              title="Ajouter un article"
            >
              <PlusIcon />
            </Button>
          </Card.Action>
        </Card.Header>
        <Card.Content>
          <ul class="flex flex-col gap-3">
            {#each group.lines as line (line.itemId + "\u0000" + line.unit)}
              <li class="flex items-start gap-2">
                <Checkbox
                  class="mt-0.5"
                  checked={app.isShoppingChecked(line.itemId, line.unit)}
                  onCheckedChange={() => app.toggleShopping(line.itemId, line.unit)}
                />
                <div class="min-w-0 flex-1">
                  {#if line.custom}
                    <div class="flex items-center justify-between gap-2">
                      <span
                        class="min-w-0 truncate text-sm font-medium {app.isShoppingChecked(
                          line.itemId,
                          line.unit,
                        )
                          ? 'line-through text-muted-foreground'
                          : ''}"
                      >
                        {line.itemName}
                      </span>
                      <ButtonGroup.Root class="shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onclick={() => startEditCustom(line)}
                          aria-label="Modifier l'article"
                          title="Modifier"
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onclick={() => removeCustom(line)}
                          aria-label="Supprimer l'article"
                          title="Supprimer"
                        >
                          <TrashIcon />
                        </Button>
                      </ButtonGroup.Root>
                    </div>
                  {:else}
                    <div class="flex items-baseline justify-between gap-2">
                      <span
                        class="text-sm font-medium {app.isShoppingChecked(line.itemId, line.unit)
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
                    <div class="text-xs text-muted-foreground">
                      {#each line.meals as meal (meal)}
                        <span class="block truncate">{meal}</span>
                      {/each}
                    </div>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        </Card.Content>
      </Card.Root>
    {/each}
  </div>
{/if}

<Dialog.Root bind:open={customOpen}>
  <Dialog.Content class="sm:max-w-md">
    <Dialog.Header>
      <Dialog.Title>
        {customEditingId ? "Modifier l'article" : "Ajouter un article"}
      </Dialog.Title>
      <Dialog.Description>
        Un ajout libre à la liste de courses, sans unité ni plat.
      </Dialog.Description>
    </Dialog.Header>

    <div class="grid gap-1.5 py-1">
      <Label for="custom-item-name">Article</Label>
      <Input
        id="custom-item-name"
        bind:value={customName}
        placeholder="Ex : Papier essuie-tout"
        onkeydown={(event) => {
          if (event.key === "Enter" && !event.isComposing) {
            event.preventDefault();
            saveCustom();
          }
        }}
      />
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (customOpen = false)}>Annuler</Button>
      <Button onclick={saveCustom} disabled={!customName.trim()}>
        {customEditingId ? "Enregistrer" : "Ajouter"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
