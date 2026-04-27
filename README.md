# stackdiff

> CLI tool to compare dependency trees across branches and surface breaking version changes

## Installation

```bash
npm install -g stackdiff
```

## Usage

Compare dependency trees between two branches:

```bash
stackdiff compare main feature/upgrade-deps
```

Example output:

```
⚠  react         17.0.2  →  18.3.1   (major)
⚠  typescript     4.9.5  →   5.4.2   (major)
✓  lodash        4.17.21 →  4.17.21  (unchanged)
↑  axios          1.3.0  →   1.6.8   (minor)

2 breaking changes detected.
```

### Options

| Flag | Description |
|------|-------------|
| `--json` | Output results as JSON |
| `--breaking-only` | Show only major version bumps |
| `--depth <n>` | Limit dependency tree depth |

```bash
stackdiff compare main release/2.0 --breaking-only --json
```

## Requirements

- Node.js >= 16
- Git repository with at least two comparable branches

## License

MIT © stackdiff contributors