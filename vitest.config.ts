import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // solid-js/web must resolve to the browser build, not the server one Node would pick.
    conditions: ["browser"],
  },
  test: {
    environment: "happy-dom",
    server: { deps: { inline: ["solid-js"] } },
  },
});
