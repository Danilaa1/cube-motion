<script>
  import { rise, leave } from "../../src/svelte.js";
  let shown = true;
  export function show(value) { shown = value; }
</script>

{#if shown}<div in:rise out:leave>Saved</div>{/if}
