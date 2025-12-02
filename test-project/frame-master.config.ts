import type { FrameMasterConfig } from "frame-master/server/types";
import autoSitemap, { type sitemapEntry } from "..";

export default {
  HTTPServer: {
    port: 3000,
  },
  plugins: [
    autoSitemap({
      baseUrl: "https://example.com",
      authorizedExtensions: ["html"],
      disableAutoEntries: true,
    }),
    {
      name: "entry-points",
      version: "0.1.0",
      build: {
        buildConfig: {
          entrypoints: ["src/index.html", "src/about/index.html"],
        },
      },
    },
  ],
} satisfies FrameMasterConfig;
