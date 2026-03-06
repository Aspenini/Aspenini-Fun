# Aspenini Fun

A static game hub built with TypeScript + Vite. Games are auto-discovered at build time — no registry to maintain.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Opens at `http://localhost:5173`. Hot-reloads when you edit `game.json` files.

## Build

```bash
npm run build
```

Outputs a fully static site to `dist/`. Serve it with any static host (GitHub Pages, Netlify, Caddy, nginx, etc.).

```bash
npm run preview   # preview the built dist/ locally
```

---

## Adding a Game

1. Create a folder in `public/games/<your-game-name>/`
2. Add a `game.json` inside it:

```json
{
  "title": "My Game",
  "description": "A short description shown on the tile.",
  "thumbnail": "thumbnail.png",
  "tags": ["Action", "Puzzle"]
}
```

- `thumbnail` — path relative to the game folder. Can be a `.png`, `.jpg`, or `.svg`.
- `tags` — optional array of tag strings shown as badges on the tile.

3. Add your game's `index.html` (and any other files) to the same folder.

That's it. The Vite plugin scans `public/games/*/game.json` automatically at compile time and dev-time. No source files to edit.

### Example structure

```
public/
└── games/
    └── my-game/
        ├── game.json       ← metadata
        ├── thumbnail.png   ← tile artwork
        └── index.html      ← the actual game
```

---

## Project Structure

```
Aspenini-Fun/
├── public/
│   └── games/          ← your games live here
├── src/
│   ├── main.ts         ← entry point + starfield
│   ├── hub.ts          ← game grid / tile rendering
│   ├── viewer.ts       ← iframe viewer + back button
│   ├── style.css       ← all styles
│   └── types/
│       └── virtual-games.d.ts   ← TS types for virtual:games module
├── index.html
├── vite.config.ts      ← build config + games discovery plugin
├── tsconfig.json
└── package.json
```
