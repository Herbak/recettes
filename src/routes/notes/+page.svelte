<script lang="ts">
  import { toast } from "svelte-sonner";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import { app } from "$lib/store.svelte";
  import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import { Label } from "$lib/components/ui/label/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import * as Dialog from "$lib/components/ui/dialog/index.js";
  import * as AlertDialog from "$lib/components/ui/alert-dialog/index.js";

  const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

  const notes = $derived(
    [...app.state.notes].sort((a, b) => b.createdAt - a.createdAt),
  );

  let dialogOpen = $state(false);
  let editingId = $state<string | null>(null);
  let formText = $state("");

  function startCreate() {
    editingId = null;
    formText = "";
    dialogOpen = true;
  }

  function startEdit(id: string, text: string) {
    editingId = id;
    formText = text;
    dialogOpen = true;
  }

  function save() {
    if (!formText.trim()) return;
    if (editingId) {
      app.updateNote(editingId, formText);
      toast.success("Note modifiée");
    } else {
      app.addNote(formText);
      toast.success("Note ajoutée");
    }
    dialogOpen = false;
  }

  function remove(id: string) {
    app.removeNote(id);
    toast.success("Note supprimée");
  }
</script>

<div class="mb-5 flex items-center gap-3">
  <h1 class="text-xl font-semibold">Notes</h1>
  <Button class="ml-auto" onclick={startCreate}>
    <PlusIcon /> Nouvelle note
  </Button>
</div>

<div class="flex flex-col gap-3">
  {#each notes as note (note.id)}
    <Card.Root>
      <Card.Content class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <p class="whitespace-pre-wrap text-sm">{note.text}</p>
          <p class="mt-1 text-xs text-muted-foreground">
            {dateFormatter.format(note.createdAt)}
          </p>
        </div>
        <div class="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="sm"
            onclick={() => startEdit(note.id, note.text)}
          >
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
                <AlertDialog.Title>Supprimer cette note ?</AlertDialog.Title>
                <AlertDialog.Description>
                  Cette action est irréversible.
                </AlertDialog.Description>
              </AlertDialog.Header>
              <AlertDialog.Footer>
                <AlertDialog.Cancel>Annuler</AlertDialog.Cancel>
                <AlertDialog.Action variant="destructive" onclick={() => remove(note.id)}>
                  Supprimer
                </AlertDialog.Action>
              </AlertDialog.Footer>
            </AlertDialog.Content>
          </AlertDialog.Root>
        </div>
      </Card.Content>
    </Card.Root>
  {/each}
  {#if notes.length === 0}
    <p class="text-sm text-muted-foreground">Aucune note.</p>
  {/if}
</div>

<Dialog.Root bind:open={dialogOpen}>
  <Dialog.Content class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>{editingId ? "Modifier la note" : "Nouvelle note"}</Dialog.Title>
      <Dialog.Description>
        Une idée, une envie pour une prochaine semaine…
      </Dialog.Description>
    </Dialog.Header>

    <div class="grid gap-1.5 py-1">
      <Label for="note-text">Note</Label>
      <Textarea
        id="note-text"
        bind:value={formText}
        rows={5}
        placeholder="Ex : Tester une recette de curry…"
      />
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (dialogOpen = false)}>Annuler</Button>
      <Button onclick={save} disabled={!formText.trim()}>
        {editingId ? "Enregistrer" : "Ajouter"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
