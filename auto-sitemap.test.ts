import { afterEach, expect, test } from "bun:test";
import {
  createPluginTestEnv,
  type PluginTestEnv,
  withTempDir,
  writeFixture,
} from "frame-master/testing";
import { join } from "node:path";
import autoSitemap from "./index";

let env: PluginTestEnv | undefined;

afterEach(async () => {
  await env?.dispose();
  env = undefined;
});

test("generates a sitemap from HTML build outputs", async () => {
  await withTempDir(async (cwd) => {
    const outdir = join(cwd, "dist");
    const index = await writeFixture(cwd, "src/index.html", "<h1>Home</h1>");
    const about = await writeFixture(cwd, "src/about/index.html", "<h1>About</h1>");

    env = await createPluginTestEnv({
      cwd,
      startServer: false,
      plugins: [
        autoSitemap({
          baseUrl: "https://example.com",
          authorizedExtensions: ["html"],
        }),
      ],
    });

    await env.build({
      entrypoints: [index, about],
      buildConfig: { outdir },
    });

    const sitemap = await Bun.file(join(outdir, "sitemap.xml")).text();
    expect(sitemap).toContain("https://example.com/index.html");
    expect(sitemap).toContain("https://example.com/about/index.html");
  });
});

test("splits entries into sitemap files and writes an index", async () => {
  await withTempDir(async (cwd) => {
    const outdir = join(cwd, "dist");
    const entrypoint = await writeFixture(
      cwd,
      "src/index.html",
      "<h1>Build fixture</h1>"
    );

    env = await createPluginTestEnv({
      cwd,
      startServer: false,
      plugins: [
        autoSitemap({
          baseUrl: "https://example.com",
          disableAutoEntries: true,
          maxEntries: 1,
          siteMapEntries: [{ url: "/one" }, { url: "/two" }],
        }),
      ],
    });

    await env.build({
      entrypoints: [entrypoint],
      buildConfig: { outdir },
    });

    const sitemapIndex = await Bun.file(join(outdir, "sitemap.xml")).text();
    const firstSitemap = await Bun.file(join(outdir, "sitemap-1.xml")).text();
    const secondSitemap = await Bun.file(join(outdir, "sitemap-2.xml")).text();

    expect(sitemapIndex).toContain("https://example.com/sitemap-1.xml");
    expect(sitemapIndex).toContain("https://example.com/sitemap-2.xml");
    expect(firstSitemap).toContain("https://example.com/one");
    expect(secondSitemap).toContain("https://example.com/two");
  });
});
