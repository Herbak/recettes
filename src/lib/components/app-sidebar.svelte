<script lang="ts">
  import * as Sidebar from "$lib/components/ui/sidebar/index.js";
  import { page } from "$app/state";
  import CalendarDaysIcon from "@lucide/svelte/icons/calendar-days";
  import UtensilsIcon from "@lucide/svelte/icons/utensils";
  import CarrotIcon from "@lucide/svelte/icons/carrot";
  import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
  import ChefHatIcon from "@lucide/svelte/icons/chef-hat";

  const items = [
    { title: "Semaine", url: "/", icon: CalendarDaysIcon },
    { title: "Repas", url: "/repas", icon: UtensilsIcon },
    { title: "Ingrédients", url: "/ingredients", icon: CarrotIcon },
    { title: "Courses", url: "/courses", icon: ShoppingCartIcon },
  ];
</script>

<Sidebar.Root collapsible="icon">
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
      <Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
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

  <Sidebar.Rail />
</Sidebar.Root>
