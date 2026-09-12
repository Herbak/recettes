<script lang="ts">
  import { goto } from "$app/navigation";
  import { toast } from "svelte-sonner";
  import ShuffleIcon from "@lucide/svelte/icons/shuffle";
  import CalendarPlusIcon from "@lucide/svelte/icons/calendar-plus";
  import CheckIcon from "@lucide/svelte/icons/check";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import XIcon from "@lucide/svelte/icons/x";
  import { app } from "$lib/store.svelte";
  import { DAYS } from "$lib/types";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { Badge } from "$lib/components/ui/badge/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Select from "$lib/components/ui/select/index.js";

  const NONE = "__none__";

  let pending = $state<string[]>(Array(7).fill(""));
  let newWeekOpen = $state(false);

  const filledDays = $derived(app.state.plan.filter((d) => d.chosen).length);
  const hasCandidates = $derived(
    app.state.plan.some((d) => d.candidates.length > 0),
  );

  function mealName(id: string): string {
    return app.mealById.get(id)?.name ?? "?";
  }

  function usageCount(mealId: string): number {
    return app.state.usage[mealId] ?? 0;
  }

  function usageClass(count: number): string {
    if (count <= 0) return "";
    if (count === 1)
      return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300";
    if (count === 2)
      return "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300";
    return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300";
  }

  function optionsFor(day: number) {
    const plan = app.state.plan[day];
    return app.state.meals.filter((m) => !plan.candidates.includes(m.id));
  }

  function add(day: number) {
    if (!pending[day]) return;
    app.addCandidate(day, pending[day]);
    pending[day] = "";
  }

  function randomize() {
    app.randomize();
    toast.success("Menu de la semaine généré");
  }

  function newWeek() {
    app.newWeek();
    newWeekOpen = false;
    toast.success("Nouvelle semaine créée");
  }

  function validate() {
    app.validate();
    toast.success("Semaine validée");
    goto("/courses");
  }
</script>

<div class="mb-5 flex flex-wrap items-center gap-3">
  <h1 class="text-xl font-semibold">Création du menu</h1>
  <Badge variant="secondary">{filledDays}/7 jours</Badge>
  {#if app.state.validated}
    <Badge class="bg-emerald-600 text-white">Semaine validée</Badge>
  {/if}

  <div class="ml-auto flex flex-wrap gap-2">
    <Button onclick={randomize} disabled={!hasCandidates}>
      <ShuffleIcon /> Randomiser
    </Button>
    <AlertDialog.Root bind:open={newWeekOpen}>
      <AlertDialog.Trigger
        class={buttonVariants({ variant: "outline" })}
        title="Clôt la semaine : vide les repas choisis (candidats conservés) et réarme le comptage"
      >
        <CalendarPlusIcon /> Créer une nouvelle semaine
      </AlertDialog.Trigger>
      <AlertDialog.Content>
        <AlertDialog.Header>
          <AlertDialog.Title>Créer une nouvelle semaine ?</AlertDialog.Title>
          <AlertDialog.Description>
            Les repas choisis pour chaque jour seront effacés (les listes de
            candidats sont conservées), les articles ajoutés à la main dans la
            liste de courses seront supprimés, et le comptage des repas
            consommés sera réarmé.
          </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
          <AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
          <AlertDialog.Action onclick={newWeek}>
            Créer une nouvelle semaine
          </AlertDialog.Action>
        </AlertDialog.Footer>
      </AlertDialog.Content>
    </AlertDialog.Root>
    <Button
      class="bg-emerald-600 text-white hover:bg-emerald-600/80"
      onclick={validate}
      disabled={filledDays === 0}
    >
      <CheckIcon /> Valider la semaine
    </Button>
  </div>
</div>

{#if app.state.meals.length === 0}
  <div class="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
    Aucun repas pour l'instant. Commencez par en créer dans l'onglet
    <a href="/repas" class="font-medium underline">Repas</a>.
  </div>
{/if}

<div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
  {#each app.state.plan as day (day.day)}
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center justify-between">
          {DAYS[day.day]}
          {#if day.chosen}
            <Badge class="bg-emerald-600 text-white">défini</Badge>
          {:else}
            <Badge variant="outline">vide</Badge>
          {/if}
        </Card.Title>
      </Card.Header>

      <Card.Content class="flex flex-col gap-3">
        {#if day.candidates.length > 0}
          <div class="grid gap-1.5">
            <Label for="day-{day.day}">Repas du jour</Label>
            <Select.Root
              type="single"
              value={day.chosen ?? NONE}
              items={[
                { value: NONE, label: "— Aucun —" },
                ...day.candidates.map((cid) => ({
                  value: cid,
                  label: mealName(cid),
                })),
              ]}
              onValueChange={(value) =>
                app.setChosen(day.day, !value || value === NONE ? null : value)}
            >
              <Select.Trigger id="day-{day.day}" class="w-full min-w-0 overflow-hidden">
                <Select.Value class="truncate" placeholder="— Aucun —" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value={NONE} label="— Aucun —">— Aucun —</Select.Item>
                {#each day.candidates as cid (cid)}
                  <Select.Item value={cid} label={mealName(cid)}>
                    {mealName(cid)}
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        {/if}

        <div class="flex flex-wrap gap-1.5">
          {#each day.candidates as cid (cid)}
            {@const count = usageCount(cid)}
            <Badge variant="secondary" class="gap-1 pr-1 {usageClass(count)}">
              {app.mealById.get(cid)?.name ?? "?"}
              {#if count > 0}
                <span class="rounded-full px-1 text-[10px] font-semibold tabular-nums">
                  ×{count}
                </span>
              {/if}
              <button
                class="rounded-full p-0.5 hover:bg-background"
                onclick={() => app.removeCandidate(day.day, cid)}
                aria-label="Retirer"
              >
                <XIcon class="size-3" />
              </button>
            </Badge>
          {/each}
          {#if day.candidates.length === 0}
            <span class="text-xs text-muted-foreground">Aucun repas candidat</span>
          {/if}
        </div>

        <div class="flex gap-2">
          <Select.Root
            type="single"
            bind:value={pending[day.day]}
            items={optionsFor(day.day).map((meal) => ({
              value: meal.id,
              label: meal.name,
            }))}
          >
            <Select.Trigger class="w-full min-w-0 flex-1 overflow-hidden">
              <Select.Value class="truncate" placeholder="Ajouter un repas…" />
            </Select.Trigger>
            <Select.Content>
              {#each optionsFor(day.day) as meal (meal.id)}
                <Select.Item value={meal.id} label={meal.name}>{meal.name}</Select.Item>
              {/each}
            </Select.Content>
          </Select.Root>
          <Button
            variant="outline"
            size="icon"
            onclick={() => add(day.day)}
            disabled={!pending[day.day]}
            aria-label="Ajouter"
          >
            <PlusIcon />
          </Button>
        </div>
      </Card.Content>
    </Card.Root>
  {/each}
</div>
