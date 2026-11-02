// ─── SPACE CANVAS ANIMATION ─────────────────────────────────────────────
// Renders parallax stars and shooting stars on the background canvas.

const STAR_COUNT = 100;
const SPEED = 0.1;
// ~30 fps: las estrellas se desplazan 0,1 px por cuadro, así que a medias
// cuadros por segundo el movimiento es igual de perceptible y cuesta la mitad.
const FRAME_MS = 33;
const SPAWN_CHANCE = 0.02;

class Star {
  x!: number;
  y!: number;
  size!: number;
  speed!: number;
  opacity!: number;

  private width: number;
  private height: number;

  constructor(first: boolean, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.init(first);
  }

  init(first: boolean) {
    if (first) {
      this.x = Math.random() * this.width;
      this.y = Math.random() * this.height;
    } else {
      if (Math.random() > 0.5) {
        this.x = -10;
        this.y = Math.random() * this.height;
      } else {
        this.x = Math.random() * this.width;
        this.y = this.height + 10;
      }
    }
    this.size = Math.random() * 2 + 0.2;
    this.speed = this.size * SPEED;
    // Cuantizada a décimas para agrupar los rellenos en pocos cambios de estado.
    this.opacity = Math.round((Math.random() * 0.5 + 0.3) * 10) / 10;
  }

  update(step: number) {
    this.x += this.speed * step;
    this.y -= this.speed * step;
    if (this.x > this.width || this.y < -10) this.init(false);
  }

  // Cuadrado en vez de arco: a 1-2 px la forma no se distingue y `arc` con
  // `beginPath` era lo más caro del bucle. El factor mantiene el área pintada.
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillRect(this.x, this.y, this.size * 1.77, this.size * 1.77);
  }
}

class ShootingStar {
  layer!: number;
  lineWidth!: number;
  x!: number;
  y!: number;
  dx!: number;
  dy!: number;
  length!: number;
  baseOpacity!: number;
  opacity!: number;
  life!: number;
  maxLife!: number;
  dead!: boolean;

  constructor(private width: number, private height: number) {
    this.init();
  }

  init() {
    const layerRoll = Math.random();
    this.layer = layerRoll < 0.6 ? 0 : layerRoll < 0.9 ? 1 : 2;
    const speedMult = [0.4, 0.7, 1][this.layer];
    const parallaxMult = [0.6, 0.8, 1][this.layer];
    const opacityMult = [0.4, 0.7, 1][this.layer];
    this.lineWidth = [1, 1.5, 2.5][this.layer];
    this.x = Math.random() * this.width * 1.5;
    this.y = -100;
    const speed = (Math.random() * 8 + 10) * parallaxMult;
    this.dx = -speed;
    this.dy = speed * (Math.random() * 0.3 + 0.8);
    this.length = (Math.random() * 100 + 80) * speedMult;
    this.baseOpacity = opacityMult;
    this.opacity = opacityMult;
    this.life = 0;
    this.maxLife = Math.random() * 80 + 50;
    this.dead = false;
  }

  update(step: number) {
    this.x += this.dx * step;
    this.y += this.dy * step;
    this.life += step;
    this.opacity = (1 - this.life / this.maxLife) * this.baseOpacity;
    if (this.life >= this.maxLife || this.x < -300 || this.y > this.height + 300)
      this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.opacity <= 0) return;
    const magnitude = Math.hypot(this.dx, this.dy);
    const gradient = ctx.createLinearGradient(
      this.x,
      this.y,
      this.x - ((this.dx * this.length) / magnitude) * 0.8,
      this.y - ((this.dy * this.length) / magnitude) * 0.8,
    );
    const colorRGB = this.layer === 0 ? "200,230,255" : "255,245,230";
    gradient.addColorStop(0, `rgba(${colorRGB},${this.opacity})`);
    gradient.addColorStop(0.2, `rgba(180,220,255,${this.opacity * 0.7})`);
    gradient.addColorStop(1, "rgba(100,150,255,0)");
    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = this.lineWidth;
    ctx.lineCap = "round";
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(
      this.x - (this.dx * this.length) / magnitude,
      this.y - (this.dy * this.length) / magnitude,
    );
    ctx.stroke();
  }
}

export function initSpaceCanvas() {
  const canvas = document.querySelector("[data-canvas]") as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  let width = 0;
  let height = 0;
  let stars: Star[] = [];
  let batches: { fill: string; stars: Star[] }[] = [];
  let shootingStars: ShootingStar[] = [];
  let frameId: number | null = null;
  let lastFrame = 0;
  let running = false;

  function resize() {
    // 1,5 en vez de 2: el fondo no tiene detalle fino y el `clearRect` de cada
    // cuadro cuesta el doble por cada píxel del lienzo.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas!.width = Math.round(width * dpr);
    canvas!.height = Math.round(height * dpr);
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push(new Star(true, width, height));
    }
    const porOpacidad = new Map<number, Star[]>();
    for (const star of stars) {
      const grupo = porOpacidad.get(star.opacity);
      if (grupo) grupo.push(star);
      else porOpacidad.set(star.opacity, [star]);
    }
    batches = Array.from(porOpacidad, ([opacidad, grupo]) => ({
      fill: `rgba(255,255,255,${opacidad})`,
      stars: grupo,
    }));
    drawStatic();
  }

  function drawStars() {
    for (const batch of batches) {
      ctx!.fillStyle = batch.fill;
      for (const star of batch.stars) star.draw(ctx!);
    }
  }

  function drawStatic() {
    ctx!.clearRect(0, 0, width, height);
    drawStars();
  }

  function animate(now: number) {
    frameId = requestAnimationFrame(animate);
    const elapsed = now - lastFrame;
    if (elapsed < FRAME_MS) return;
    lastFrame = now;
    // 1 = un cuadro de 16,6 ms. Se acota para no teletransportar nada tras un
    // bloqueo del hilo o un cambio de pestaña.
    const step = Math.min(elapsed / 16.667, 3);

    ctx!.clearRect(0, 0, width, height);
    for (const star of stars) star.update(step);
    drawStars();

    if (Math.random() < SPAWN_CHANCE) {
      shootingStars.push(new ShootingStar(width, height));
    }
    shootingStars = shootingStars.filter((s) => {
      s.update(step);
      s.draw(ctx!);
      return !s.dead;
    });
  }

  function start() {
    if (running || motionQuery.matches || document.hidden) return;
    running = true;
    frameId = requestAnimationFrame(animate);
  }

  function stop() {
    running = false;
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  motionQuery.addEventListener("change", () => {
    if (motionQuery.matches) {
      stop();
      drawStatic();
    } else {
      start();
    }
  });

  resize();
  window.addEventListener("resize", resize);

  // `resize()` ya pintó el fondo estático; el bucle arranca cuando el hilo
  // respira, para no pelear con la hidratación de las islas ni con el LCP.
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => start(), { timeout: 1_500 });
  } else {
    window.setTimeout(start, 200);
  }
}
