<script lang="ts">
  import XIcon from "@lucide/svelte/icons/x";
  import SearchIcon from "@lucide/svelte/icons/search";
  import { app } from "$lib/store.svelte";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";

  const NONE_CAT = "__none__";

  let newItemName = $state("");
  let newItemCategory = $state("");
  let newItemUnit = $state("");

  let search = $state("");

  const filtered = $derived(
    app.state.items.filter((item) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const category = app.categoryById.get(item.categoryId)?.name ?? "";
      return (
        item.name.toLowerCase().includes(q) ||
        category.toLowerCase().includes(q)
      );
    }),
  );

  function addItem() {
    if (!newItemName.trim()) return;
    app.addItem(newItemName, newItemCategory, newItemUnit);
    newItemName = "";
    newItemUnit = "";
  }
</script>

<div class="mb-5 flex flex-wrap items-center gap-3">
  <h1 class="text-xl font-semibold">Ingrédients</h1>
</div>

<div class="flex flex-col gap-4">
  <Card.Root>
    <Card.Header>
      <Card.Title>Ajouter un ingrédient</Card.Title>
    </Card.Header>
    <Card.Content>
      <div class="flex flex-wrap gap-2">
        <Input
          bind:value={newItemName}
          placeholder="Nom (ex : Cheddar)"
          class="min-w-0 flex-1"
        />
        <Select.Root
          type="single"
          value={newItemCategory || NONE_CAT}
          items={[
            { value: NONE_CAT, label: "Non classé" },
            ...app.state.categories.map((category) => ({
              value: category.id,
              label: category.name,
            })),
          ]}
          onValueChange={(value) =>
            (newItemCategory = !value || value === NONE_CAT ? "" : value)}
        >
          <Select.Trigger>
            <Select.Value placeholder="Non classé" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value={NONE_CAT} label="Non classé">Non classé</Select.Item>
            {#each app.state.categories as category (category.id)}
              <Select.Item value={category.id} label={category.name}>
                {category.name}
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        <Input
          bind:value={newItemUnit}
          placeholder="Unité(s)"
          title="Plusieurs unités possibles, séparées par des virgules (ex : g, unité)"
          class="w-28"
        />
        <Button onclick={addItem} disabled={!newItemName.trim()}>Ajouter</Button>
      </div>
    </Card.Content>
  </Card.Root>

  <Card.Root>
    <Card.Content>
      <div class="relative mb-4 max-w-md">
        <SearchIcon
          class="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          bind:value={search}
          placeholder="Rechercher un ingrédient…"
          class="pl-8"
        />
      </div>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.Head>Ingrédient</Table.Head>
            <Table.Head>Catégorie</Table.Head>
            <Table.Head>Unités</Table.Head>
            <Table.Head></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {#each filtered as item (item.id)}
            <Table.Row>
              <Table.Cell>
                <Input bind:value={item.name} />
              </Table.Cell>
              <Table.Cell>
                <Select.Root
                  type="single"
                  value={item.categoryId || NONE_CAT}
                  items={[
                    { value: NONE_CAT, label: "Non classé" },
                    ...app.state.categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    })),
                  ]}
                  onValueChange={(value) =>
                    (item.categoryId = !value || value === NONE_CAT ? "" : value)}
                >
                  <Select.Trigger>
                    <Select.Value placeholder="Non classé" />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value={NONE_CAT} label="Non classé">Non classé</Select.Item>
                    {#each app.state.categories as category (category.id)}
                      <Select.Item value={category.id} label={category.name}>
                        {category.name}
                      </Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              </Table.Cell>
              <Table.Cell>
                <Input
                  bind:value={item.unit}
                  placeholder="g, unité"
                  title="Plusieurs unités possibles, séparées par des virgules"
                  class="w-28"
                />
              </Table.Cell>
              <Table.Cell class="text-right">
                <AlertDialog.Root>
                  <AlertDialog.Trigger
                    class={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                    aria-label="Supprimer"
                  >
                    <XIcon />
                  </AlertDialog.Trigger>
                  <AlertDialog.Content>
                    <AlertDialog.Header>
                      <AlertDialog.Title>Supprimer « {item.name} » ?</AlertDialog.Title>
                      <AlertDialog.Description>
                        L'ingrédient sera retiré de tous les repas.
                      </AlertDialog.Description>
                    </AlertDialog.Header>
                    <AlertDialog.Footer>
                      <AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
                      <AlertDialog.Action
                        variant="destructive"
                        onclick={() => app.removeItem(item.id)}
                      >
                        Supprimer
                      </AlertDialog.Action>
                    </AlertDialog.Footer>
                  </AlertDialog.Content>
                </AlertDialog.Root>
              </Table.Cell>
            </Table.Row>
          {/each}
          {#if app.state.items.length === 0}
            <Table.Row>
              <Table.Cell colspan={4} class="py-4 text-center text-muted-foreground">
                Aucun ingrédient.
              </Table.Cell>
            </Table.Row>
          {:else if filtered.length === 0}
            <Table.Row>
              <Table.Cell colspan={4} class="py-4 text-center text-muted-foreground">
                Aucun ingrédient ne correspond à « {search} ».
              </Table.Cell>
            </Table.Row>
          {/if}
        </Table.Body>
      </Table.Root>
    </Card.Content>
  </Card.Root>
</div>
