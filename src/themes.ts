const STORAGE_KEY = "aspenini-theme";

interface Theme {
  id: string;
  label: string;
  color: string;
}

const THEMES: Theme[] = [
  { id: "cyan",    label: "Cyan",    color: "#00d4ff" },
  { id: "red",     label: "Red",     color: "#ff4060" },
  { id: "emerald", label: "Emerald", color: "#00e676" },
  { id: "violet",  label: "Violet",  color: "#b388ff" },
  { id: "orange",  label: "Orange",  color: "#ff9100" },
  { id: "pink",    label: "Pink",    color: "#ff80ab" },
  { id: "gold",    label: "Gold",    color: "#ffd740" },
  { id: "ice",     label: "Ice",     color: "#84ffff" },
];

function applyTheme(id: string) {
  if (id === "cyan") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = id;
  }
}

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && THEMES.some((t) => t.id === saved)) {
    applyTheme(saved);
  }
}

export function createThemePicker(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.className = "theme-picker";

  const btn = document.createElement("button");
  btn.className = "theme-picker-btn";
  btn.setAttribute("aria-label", "Change theme");
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10a2.5 2.5 0 0 0 2.5-2.5c0-.61-.23-1.21-.64-1.67a.528.528 0 0 1 .12-.74c.18-.14.38-.21.52-.21H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9.08-10-9.08zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
    </svg>
  `;

  const dropdown = document.createElement("div");
  dropdown.className = "theme-dropdown";

  const current = localStorage.getItem(STORAGE_KEY) || "cyan";

  for (const theme of THEMES) {
    const swatch = document.createElement("button");
    swatch.className = "theme-swatch";
    if (theme.id === current) swatch.classList.add("theme-swatch--active");
    swatch.style.background = theme.color;
    swatch.setAttribute("aria-label", theme.label);
    swatch.setAttribute("title", theme.label);

    swatch.addEventListener("click", () => {
      applyTheme(theme.id);
      localStorage.setItem(STORAGE_KEY, theme.id);
      dropdown.querySelectorAll(".theme-swatch").forEach((s) =>
        s.classList.remove("theme-swatch--active")
      );
      swatch.classList.add("theme-swatch--active");
    });

    dropdown.appendChild(swatch);
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("theme-dropdown--open");
  });

  document.addEventListener("click", () => {
    dropdown.classList.remove("theme-dropdown--open");
  });

  wrapper.addEventListener("click", (e) => e.stopPropagation());

  wrapper.appendChild(btn);
  wrapper.appendChild(dropdown);

  return wrapper;
}
