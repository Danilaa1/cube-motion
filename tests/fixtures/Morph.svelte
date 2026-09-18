<script>
  import { morph } from "../../src/svelte.js";
  let active = false;
  let label = "Copied";
  export function select(value) { active = value; }
  export function rename(value) { label = value; }
</script>

<span use:morph={active}><span>Copy</span><span>{label}</span></span>
