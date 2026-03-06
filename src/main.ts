import "./style.css";
import { Game } from "virtual:games";
import { createHub } from "./hub";
import { createViewer } from "./viewer";

const app = document.getElementById("app")!;

const starfield = document.createElement("canvas");
starfield.className = "starfield";
document.body.prepend(starfield);
initStarfield(starfield);

const viewer = createViewer(backToHub);
const hub = createHub(launchGame);

window.addEventListener("message", (event) => {
  if (event.data?.type === "aspenini-fun-back") {
    backToHub();
  }
});

viewer.element.classList.add("viewer--hidden");

app.appendChild(hub);
app.appendChild(viewer.element);

function launchGame(game: Game) {
  hub.classList.add("hub--exit");

  hub.addEventListener(
    "animationend",
    () => {
      hub.classList.add("hub--hidden");
      hub.classList.remove("hub--exit");

      viewer.load(game);
      viewer.element.classList.remove("viewer--hidden");
      viewer.element.classList.add("viewer--enter");

      viewer.element.addEventListener(
        "animationend",
        () => {
          viewer.element.classList.remove("viewer--enter");
        },
        { once: true }
      );
    },
    { once: true }
  );
}

function backToHub() {
  viewer.element.classList.add("viewer--exit");

  viewer.element.addEventListener(
    "animationend",
    () => {
      viewer.element.classList.add("viewer--hidden");
      viewer.element.classList.remove("viewer--exit");
      viewer.unload();

      hub.classList.remove("hub--hidden");
      hub.classList.add("hub--enter");

      hub.addEventListener(
        "animationend",
        () => {
          hub.classList.remove("hub--enter");
        },
        { once: true }
      );
    },
    { once: true }
  );
}

function initStarfield(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  let stars: { x: number; y: number; r: number; opacity: number; speed: number }[] = [];
  let animFrame: number;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    buildStars();
  }

  function buildStars() {
    const count = Math.floor((canvas.width * canvas.height) / 4000);
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.2,
      opacity: Math.random() * 0.7 + 0.1,
      speed: Math.random() * 0.3 + 0.05,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const star of stars) {
      star.opacity += (Math.random() - 0.5) * 0.02;
      star.opacity = Math.max(0.05, Math.min(0.9, star.opacity));

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 210, 255, ${star.opacity})`;
      ctx.fill();
    }
    animFrame = requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  draw();

  return () => {
    cancelAnimationFrame(animFrame);
    window.removeEventListener("resize", resize);
  };
}
