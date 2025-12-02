# Auto sitemap

Frame-Master plugin for automatically generating sitemaps for your static site.

## Installation

```bash
bun add frame-master-plugin-auto-sitemap
```

## Usage

```typescript
import type { FrameMasterConfig } from "frame-master/server/types";
import autositemap from "auto-sitemap";

const config: FrameMasterConfig = {
  HTTPServer: { port: 3000 },
  plugins: [
    autositemap({
      baseUrl: "https://example.com", // Required
      maxEntries: 5000, // Optional, default: 5000
      // authorizedExtensions: ['html', 'js', 'txt', 'md', 'mdx'], // Optional
      // disableAutoEntries: false, // Optional
      // siteMapEntries: [ ... ], // Optional: Add custom entries
    }),
  ],
};

export default config;
```

## Configuration

| Option                    | Type             | Default                              | Description                                                                                                               |
| ------------------------- | ---------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`                 | `string`         | **Required**                         | The base URL of your website (e.g., `https://example.com`). Required for generating valid sitemap URLs and sitemap index. |
| `maxEntries`              | `number`         | `5000`                               | Maximum number of URLs per sitemap file. If exceeded, multiple sitemap files and a sitemap index will be generated.       |
| `authorizedExtensions`    | `string[]`       | `['html', 'js', 'txt', 'md', 'mdx']` | List of file extensions to include in the sitemap from the build output.                                                  |
| `disableAutoEntries`      | `boolean`        | `false`                              | If `true`, disables automatic generation of entries from build outputs.                                                   |
| `siteMapEntries`          | `sitemapEntry[]` | `[]`                                 | Array of custom sitemap entries to add manually.                                                                          |
| `parseAutoSiteMapEntries` | `function`       | `(entry) => entry`                   | Function to transform automatically generated entries before adding them to the sitemap.                                  |

### `sitemapEntry` Type

```typescript
type sitemapEntry = {
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
```

## Features

- **Automatic Generation**: Automatically scans build outputs and adds relevant files to the sitemap.
- **Sitemap Splitting**: Automatically splits the sitemap into multiple files if the number of entries exceeds `maxEntries`.
- **Sitemap Index**: Generates a `sitemap.xml` index file when splitting occurs.
- **Custom Entries**: Easily add custom URLs that are not part of the build output.
- **Custom Parsing**: Hook into the generation process to modify URLs or add metadata (priority, changefreq) to auto-generated entries.
- **Filtering**: Control which file types are included via `authorizedExtensions`.

## License

MIT

```

```
