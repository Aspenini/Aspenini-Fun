import { defineConfig, Plugin } from "vite";
import fs from "node:fs";
import path from "node:path";

interface GameJson {
  title: string;
  description: string;
  thumbnail: string;
  tags?: string[];
  /** Entry HTML file (e.g. "index.html" or "game.html"). Defaults to "index.html" if omitted. */
  entry?: string;
}

interface Game {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  path: string;
  tags: string[];
}

function gamesDiscoveryPlugin(): Plugin {
  const virtualModuleId = "virtual:games";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  function scanGames(): Game[] {
    const gamesDir = path.resolve(__dirname, "public/games");

    if (!fs.existsSync(gamesDir)) {
      return [];
    }

    const entries = fs.readdirSync(gamesDir, { withFileTypes: true });
    const games: Game[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const infoPath = path.join(gamesDir, entry.name, "game.json");
      if (!fs.existsSync(infoPath)) continue;

      try {
        const raw = fs.readFileSync(infoPath, "utf-8");
        const info: GameJson = JSON.parse(raw);

        games.push({
          id: entry.name,
          title: info.title,
          description: info.description,
          thumbnail: `games/${entry.name}/${info.thumbnail}`,
          path: `games/${entry.name}/${info.entry ?? "index.html"}`,
          tags: info.tags ?? [],
        });
      } catch {
        console.warn(`[games-plugin] Failed to parse ${infoPath}`);
      }
    }

    return games;
  }

  return {
    name: "games-discovery",
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        const games = scanGames();
        return `export const games = ${JSON.stringify(games, null, 2)};`;
      }
    },
    configureServer(server) {
      const gamesDir = path.resolve(__dirname, "public/games");
      server.watcher.add(gamesDir);
      server.watcher.on("change", (file) => {
        if (file.includes(path.join("public", "games")) && file.endsWith("game.json")) {
          const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
            server.ws.send({ type: "full-reload" });
          }
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [gamesDiscoveryPlugin()],
  base: "/Aspenini-Fun/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
