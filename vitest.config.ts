import { defineConfig } from "vitest/config";
import { compile } from "svelte/compiler";

export default defineConfig({
  plugins: [{
    name: "svelte-test-fixtures",
    transform(code, id) {
      if (id.endsWith(".svelte")) return compile(code, { filename: id, generate: "client" }).js;
    },
  }],
  resolve: {
    // solid-js/web must resolve to the browser build, not the server one Node would pick.
    conditions: ["browser"],
  },
  test: {
    environment: "happy-dom",
    server: { deps: { inline: ["solid-js", "svelte"] } },
  },
});
