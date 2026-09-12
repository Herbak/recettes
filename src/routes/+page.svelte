<script lang="ts">
  import { app } from "$lib/store.svelte";
  import { DAYS } from "$lib/types";

  const hasMeals = $derived(app.state.plan.some((d) => d.chosen));
</script>

<div class="mx-auto flex h-full w-full max-w-xl flex-col justify-center pb-12">
  <h1 class="mb-5 text-xl font-semibold">Cette semaine</h1>

  <ul class="overflow-hidden rounded-xl border">
    {#each app.state.plan as day (day.day)}
      {@const meal = day.chosen ? app.mealById.get(day.chosen) : undefined}
      <li class="flex items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0">
        <span class="font-medium">{DAYS[day.day]}</span>
        {#if meal}
          <span class="text-right">{meal.name}</span>
        {:else}
          <span class="text-right text-sm text-muted-foreground">Aucun repas</span>
        {/if}
      </li>
    {/each}
  </ul>

  {#if !hasMeals}
    <p class="mt-4 text-center text-sm text-muted-foreground">
      Aucun menu pour le moment. Va dans
      <a href="/creation-du-menu" class="font-medium text-primary underline">
        Création du menu
      </a>
      pour en générer un.
    </p>
  {/if}
</div>
