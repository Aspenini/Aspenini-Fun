import { games, Game } from "virtual:games";

export function createHub(onLaunch: (game: Game) => void): HTMLElement {
  const hub = document.createElement("div");
  hub.className = "hub";

  const header = document.createElement("header");
  header.className = "hub-header";
  header.innerHTML = `
    <div class="hub-logo">
      <span class="hub-logo-accent">ASPENINI</span>
      <span class="hub-logo-main">FUN</span>
    </div>
    <p class="hub-subtitle">Select a game to play</p>
  `;

  const grid = document.createElement("div");
  grid.className = "hub-grid";

  if (games.length === 0) {
    const empty = document.createElement("div");
    empty.className = "hub-empty";
    empty.innerHTML = `
      <div class="hub-empty-icon">🎮</div>
      <p>No games found.</p>
      <p class="hub-empty-hint">Drop a game folder into <code>public/games/</code> with a <code>game.json</code> inside.</p>
    `;
    grid.appendChild(empty);
  } else {
    for (const game of games) {
      grid.appendChild(createTile(game, onLaunch));
    }
  }

  hub.appendChild(header);
  hub.appendChild(grid);

  return hub;
}

function createTile(game: Game, onLaunch: (game: Game) => void): HTMLElement {
  const tile = document.createElement("button");
  tile.className = "game-tile";
  tile.setAttribute("aria-label", `Play ${game.title}`);

  const hasThumbnail = game.thumbnail && !game.thumbnail.endsWith("//");
  const thumbUrl = hasThumbnail ? `${import.meta.env.BASE_URL}${game.thumbnail}` : "";
  const escapedTitle = escapeHtml(game.title);
  const escapedDescription = escapeHtml(game.description);

  tile.innerHTML = `
    <div class="tile-bg">
      ${hasThumbnail ? `<img class="tile-thumb" src="${thumbUrl}" alt="" loading="lazy" decoding="async" />` : ""}
    </div>
    <div class="tile-overlay"></div>
    <div class="tile-content">
      <div class="tile-tags">
        ${game.tags.map((t) => `<span class="tile-tag">${t}</span>`).join("")}
      </div>
      <div class="tile-info">
        <h2 class="tile-title">${escapedTitle}</h2>
        <p class="tile-description">${escapedDescription}</p>
      </div>
    </div>
    <div class="tile-play-hint">
      <span class="tile-play-icon">▶</span>
      <span>Play</span>
    </div>
  `;

  tile.addEventListener("click", () => onLaunch(game));

  tile.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onLaunch(game);
    }
  });

  return tile;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
