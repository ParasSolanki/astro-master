import { defineConfig } from "astro/config";
import { FontaineTransform } from "fontaine";

import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel/serverless";
import sitemap from "@astrojs/sitemap";

const options = {
  fallbacks: ["ui-sans-serif", "Segoe UI", "Arial"],
  resolvePath: (id) => new URL("./public" + id, import.meta.url),
};

// https://astro.build/config
export default defineConfig({
  site: "https://astro-master.vercel.app",
  prefetch: true,
  output: "server",
  adapter: vercel(),
  security: {
    checkOrigin: true,
  },
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap(),
  ],
  image: {
    domains: ["bevgyjm5apuichhj.public.blob.vercel-storage.com"],
  },
  vite: {
    plugins: [FontaineTransform.vite(options)],
  },
});
