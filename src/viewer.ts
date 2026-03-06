import { Game } from "virtual:games";

export function createViewer(onBack: () => void): {
  element: HTMLElement;
  load: (game: Game) => void;
  unload: () => void;
} {
  const viewer = document.createElement("div");
  viewer.className = "viewer";
  viewer.setAttribute("aria-label", "Game viewer");

  const toolbar = document.createElement("div");
  toolbar.className = "viewer-toolbar";

  const backBtn = document.createElement("button");
  backBtn.className = "viewer-back-btn";
  backBtn.setAttribute("aria-label", "Back to hub");
  backBtn.innerHTML = `
    <svg class="back-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
    <span>Hub</span>
  `;
  backBtn.addEventListener("click", onBack);

  const gameTitle = document.createElement("span");
  gameTitle.className = "viewer-game-title";

  const fullscreenBtn = document.createElement("button");
  fullscreenBtn.className = "viewer-fullscreen-btn";
  fullscreenBtn.setAttribute("aria-label", "Toggle fullscreen");
  fullscreenBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 3 21 3 21 9"></polyline>
      <polyline points="9 21 3 21 3 15"></polyline>
      <line x1="21" y1="3" x2="14" y2="10"></line>
      <line x1="3" y1="21" x2="10" y2="14"></line>
    </svg>
  `;
  fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      viewer.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });

  toolbar.appendChild(backBtn);
  toolbar.appendChild(gameTitle);
  toolbar.appendChild(fullscreenBtn);

  const iframeContainer = document.createElement("div");
  iframeContainer.className = "viewer-iframe-container";

  let iframe: HTMLIFrameElement | null = null;

  viewer.appendChild(toolbar);
  viewer.appendChild(iframeContainer);

  function load(game: Game) {
    gameTitle.textContent = game.title;

    if (iframe) {
      iframe.remove();
    }

    iframe = document.createElement("iframe");
    iframe.className = "viewer-iframe";
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("allow", "autoplay; fullscreen");
    iframe.setAttribute("title", game.title);
    iframe.src = `${import.meta.env.BASE_URL}${game.path}`;

    iframeContainer.appendChild(iframe);
  }

  function unload() {
    gameTitle.textContent = "";
    if (iframe) {
      iframe.src = "about:blank";
      iframe.remove();
      iframe = null;
    }
  }

  return { element: viewer, load, unload };
}
