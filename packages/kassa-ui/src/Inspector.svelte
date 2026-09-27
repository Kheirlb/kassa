<svelte:options customElement="fn-inspector" />

<script lang="ts">
  interface InspectorItem {
    id: string;
    name: string;
  }

  let { items = [] }: { items: InspectorItem[] } = $props();
</script>

<div class="inspector">
  {#each items as item}
    <div class="item">
      {item.name}
    </div>
  {/each}
</div>

<style>
  .inspector {
    padding: 8px;
  }

  .item {
    padding: 4px;
  }
</style>
