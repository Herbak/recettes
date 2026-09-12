<script lang="ts">
  import PlusIcon from "@lucide/svelte/icons/plus";
  import XIcon from "@lucide/svelte/icons/x";
  import { app } from "$lib/store.svelte";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Select from "$lib/components/ui/select/index.js";
  import * as Table from "$lib/components/ui/table/index.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";

  const NONE_CAT = "__none__";

  let newCategory = $state("");
  let newItemName = $state("");
  let newItemCategory = $state("");
  let newItemUnit = $state("");

  function addCategory() {
    if (!newCategory.trim()) return;
    app.addCategory(newCategory);
    newCategory = "";
  }

  function addItem() {
    if (!newItemName.trim()) return;
    app.addItem(newItemName, newItemCategory, newItemUnit);
    newItemName = "";
    newItemUnit = "";
  }

  function countFor(categoryId: string) {
    return app.state.items.filter((i) => i.categoryId === categoryId).length;
  }
</script>

<div class="mb-5 flex flex-wrap items-center gap-3">
  <h1 class="text-xl font-semibold">Ingrédients</h1>
</div>

<div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
  <Card.Root>
    <Card.Header>
      <Card.Title>Catégories</Card.Title>
    </Card.Header>
    <Card.Content class="flex flex-col gap-3">
      <div class="flex gap-2">
        <Input
          bind:value={newCategory}
          placeholder="Ex : Fromage"
          onkeydown={(e) => e.key === "Enter" && addCategory()}
        />
        <Button
          size="icon"
          onclick={addCategory}
          disabled={!newCategory.trim()}
          aria-label="Ajouter"
        >
          <PlusIcon />
        </Button>
      </div>

      <ul class="flex flex-col gap-2">
        {#each app.state.categories as category (category.id)}
          <li class="flex items-center gap-2">
            <Input bind:value={category.name} class="flex-1" />
            <span class="w-16 shrink-0 text-right text-xs text-muted-foreground">
              {countFor(category.id)} ing.
            </span>
            <AlertDialog.Root>
              <AlertDialog.Trigger
                class={buttonVariants({ variant: "ghost", size: "icon-sm" })}
                aria-label="Supprimer"
              >
                <XIcon />
              </AlertDialog.Trigger>
              <AlertDialog.Content>
                <AlertDialog.Header>
                  <AlertDialog.Title>Supprimer « {category.name} » ?</AlertDialog.Title>
                  <AlertDialog.Description>
                    Les ingrédients liés ne seront plus classés.
                  </AlertDialog.Description>
                </AlertDialog.Header>
                <AlertDialog.Footer>
                  <AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
                  <AlertDialog.Action
                    variant="destructive"
                    onclick={() => app.removeCategory(category.id)}
                  >
                    Supprimer
                  </AlertDialog.Action>
                </AlertDialog.Footer>
              </AlertDialog.Content>
            </AlertDialog.Root>
          </li>
        {/each}
        {#if app.state.categories.length === 0}
          <li class="text-xs text-muted-foreground">Aucune catégorie.</li>
        {/if}
      </ul>
    </Card.Content>
  </Card.Root>

  <div class="flex flex-col gap-4 lg:col-span-2">
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
      <Card.Content class="pt-0">
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
            {#each app.state.items as item (item.id)}
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
            {/if}
          </Table.Body>
        </Table.Root>
      </Card.Content>
    </Card.Root>
  </div>
</div>
