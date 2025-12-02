# Auto sitemap

Frame-Master plugin

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
  plugins: [autositemap()],
};

export default config;
```

## Features

- Feature 1
- Feature 2

## License

MIT

```

```
