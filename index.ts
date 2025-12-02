import type { FrameMasterPlugin } from "frame-master/plugin/types";
import { join } from "path";
import { join as joinUrl } from "frame-master/utils";

export type sitemapEntry = {
  url: string;
  lastModified?: string;
  changeFrequency?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
};

export type AutoSitemapOptions = {
  siteMapEntries?: sitemapEntry[];
  /**
   * List of authorized file extensions to be included in the sitemap.
   * Default: ['html', 'js', 'txt', 'md', 'mdx']
   */
  authorizedExtensions?: string[];
  /**
   * default: `(entry) => ({ ...entry, url: entry.url.split(buildConfig.outdir!).at(-1)! })`
   */
  parseAutoSiteMapEntries?: (path: sitemapEntry) => sitemapEntry;
  disableAutoEntries?: boolean;
  /**
   * Maximum number of entries in a single sitemap file.
   * Default: 5000
   */
  maxEntries?: number;
  /**
   * Base URL of the website. Required for sitemap index generation.
   * Example: https://example.com
   */
  baseUrl: string;
};

/**
 * auto-sitemap - Frame-Master Plugin
 *
 * Description: Add your plugin description here
 */
export default function autoSitemap(
  options: AutoSitemapOptions
): FrameMasterPlugin {
  const {
    authorizedExtensions = ["html", "js", "txt", "md", "mdx"],
    maxEntries = 5000,
    baseUrl,
  } = options;

  return {
    name: "auto-sitemap",
    version: "0.1.0",

    build: {
      async afterBuild(buildConfig, result) {
        const toInjectInEntryPoints: Array<{
          file: Bun.BunFile;
          path: string;
        }> = [];

        const autoEntries: sitemapEntry[] = options.disableAutoEntries
          ? []
          : result.outputs
              .filter((out) => out.kind === "entry-point")
              .filter((out) => {
                const ext = out.path.split(".").pop()!;
                return authorizedExtensions.includes(ext);
              })
              .map(
                (buildArtifact) => ({ url: buildArtifact.path } as sitemapEntry)
              )
              .map(
                options.parseAutoSiteMapEntries ??
                  ((entry) => ({
                    ...entry,
                    url: entry.url.split(buildConfig.outdir!).at(-1)!,
                  }))
              );

        const siteMapEntries: sitemapEntry[] = [
          ...autoEntries,
          ...(options.siteMapEntries || []),
        ];

        const outdir = buildConfig.outdir || ".";

        if (siteMapEntries.length <= maxEntries) {
          const sitemapContent = generateSitemap(baseUrl, siteMapEntries);
          const filePath = join(outdir, "sitemap.xml");
          const buildFile = Bun.file(filePath);
          await buildFile.write(sitemapContent);
          toInjectInEntryPoints.push({ file: buildFile, path: filePath });
        } else {
          // Split into chunks
          const chunks: Array<sitemapEntry[]> = [];
          for (let i = 0; i < siteMapEntries.length; i += maxEntries) {
            chunks.push(siteMapEntries.slice(i, i + maxEntries));
          }

          const sitemapFiles = [];
          for (let i = 0; i < chunks.length; i++) {
            const filename = `sitemap-${i + 1}.xml`;
            const content = generateSitemap(baseUrl, chunks[i]!);
            const filePath = join(outdir, filename);
            const buildFile = Bun.file(filePath);
            await buildFile.write(content);
            sitemapFiles.push(filename);
            toInjectInEntryPoints.push({ file: buildFile, path: filePath });
          }

          if (baseUrl) {
            const indexContent = generateSitemapIndex(baseUrl, sitemapFiles);
            const indexFilePath = join(outdir, "sitemap.xml");
            const indexBuildFile = Bun.file(indexFilePath);
            await indexBuildFile.write(indexContent);
            toInjectInEntryPoints.push({
              file: indexBuildFile,
              path: indexFilePath,
            });
          } else {
            console.warn(
              "auto-sitemap: baseUrl is required to generate sitemap index. Only individual sitemap files were generated."
            );
          }

          result.outputs.push(
            ...(await Promise.all(
              toInjectInEntryPoints.map((entry) =>
                fileToBuildArtifact(entry.file, entry.path, {
                  loader: "file",
                  kind: "entry-point",
                  sourcemap: null,
                })
              )
            ))
          );
        }
      },
    },

    requirement: {
      frameMasterVersion: ">=2.0.0",
      bunVersion: ">=1.2.0",
    },
  };
}

function generateSitemap(baseUrl: string, entries: sitemapEntry[]): string {
  const _baseUrl = baseUrl.replace(/\/$/, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map((entry) => {
    return [
      "<url>",
      `<loc>${joinUrl(_baseUrl, entry.url)}</loc>`,
      entry.lastModified
        ? `<lastmod>${entry.lastModified}</lastmod>`
        : undefined,
      entry.changeFrequency
        ? `<changefreq>${entry.changeFrequency}</changefreq>`
        : undefined,
      entry.priority !== undefined
        ? `<priority>${entry.priority}</priority>`
        : undefined,
      "</url>",
    ]
      .filter(Boolean)
      .join("\n");
  })
  .join("\n")}
</urlset>`;
}

function generateSitemapIndex(baseUrl: string, files: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${files
  .map((file) => {
    return `  <sitemap>
    <loc>${baseUrl.replace(/\/$/, "")}/${file}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`;
  })
  .join("\n")}
</sitemapindex>`;
}

type CustomBuildArtifactOptions = {
  loader: Bun.BuildArtifact["loader"];
  kind: Bun.BuildArtifact["kind"];
  sourcemap?: Bun.BuildArtifact["sourcemap"];
};

async function fileToBuildArtifact(
  file: Bun.BunFile,
  path: string,
  options: CustomBuildArtifactOptions
): Promise<Bun.BuildArtifact> {
  const hash = new Bun.SHA256().update(await file.arrayBuffer()).digest("hex");

  return {
    path,
    hash,
    kind: options.kind,
    loader: options.loader,
    sourcemap: options.sourcemap || null,
    ...file,
  };
}
