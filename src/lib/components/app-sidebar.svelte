<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { page } from "$app/state";
  import { app } from "$lib/store.svelte";
  import CalendarDaysIcon from "@lucide/svelte/icons/calendar-days";
  import CalendarCheckIcon from "@lucide/svelte/icons/calendar-check";
  import UtensilsIcon from "@lucide/svelte/icons/utensils";
  import CarrotIcon from "@lucide/svelte/icons/carrot";
  import TagsIcon from "@lucide/svelte/icons/tags";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import DatabaseIcon from "@lucide/svelte/icons/database";
  import CheckIcon from "@lucide/svelte/icons/check";
  import ChefHatIcon from "@lucide/svelte/icons/chef-hat";

  const items = [
    { title: "Menu", url: "/creation-du-menu", icon: CalendarDaysIcon },
    { title: "Repas", url: "/repas", icon: UtensilsIcon },
    { title: "Catégories", url: "/categories", icon: TagsIcon },
    { title: "Ingrédients", url: "/ingredients", icon: CarrotIcon },
  ];
</script>

<Sidebar.Root collapsible="icon" class="border-t">
  <Sidebar.Header>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton size="lg" class="cursor-default hover:bg-transparent">
          <div
            class="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
          >
            <ChefHatIcon class="size-4" />
          </div>
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-semibold">Recettes</span>
            <span class="truncate text-xs text-muted-foreground">Menus &amp; courses</span>
          </div>
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Header>

  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton
            isActive={page.url.pathname === "/"}
            tooltipContent="Cette semaine"
          >
            {#snippet child({ props })}
              <a href="/" {...props}>
                <CalendarCheckIcon />
                <span>Cette semaine</span>
              </a>
            {/snippet}
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton
            isActive={page.url.pathname === "/courses"}
            tooltipContent="Courses"
          >
            {#snippet child({ props })}
            <a href="/courses" {...props}>
              <ShoppingCartIcon />
              <span>Courses</span>
            </a>
            {/snippet}
          </Sidebar.MenuButton>
          {#if app.shoppingTotal > 0}
            <Sidebar.MenuBadge
              class={app.shoppingDone
                ? ""
                : "bg-sidebar-accent text-sidebar-accent-foreground"}
            >
              {#if app.shoppingDone}
                <CheckIcon class="size-4 text-emerald-600" />
              {:else}
                {app.shoppingRemaining}
              {/if}
            </Sidebar.MenuBadge>
          {/if}
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Group>

    <Sidebar.Group>
      <Sidebar.GroupLabel>Création</Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#each items as item (item.url)}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                isActive={page.url.pathname === item.url}
                tooltipContent={item.title}
              >
                {#snippet child({ props })}
                  <a href={item.url} {...props}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>

  <Sidebar.Footer>
    <Sidebar.Menu>
      <Sidebar.MenuItem>
        <Sidebar.MenuButton
          isActive={page.url.pathname === "/donnees"}
          tooltipContent="Données"
        >
          {#snippet child({ props })}
            <a href="/donnees" {...props}>
              <DatabaseIcon />
              <span>Données</span>
            </a>
          {/snippet}
        </Sidebar.MenuButton>
      </Sidebar.MenuItem>
    </Sidebar.Menu>
  </Sidebar.Footer>

  <Sidebar.Rail />
</Sidebar.Root>
