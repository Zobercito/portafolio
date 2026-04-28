// ─── SPACE CANVAS ANIMATION ─────────────────────────────────────────────
// Renders parallax stars and shooting stars on the background canvas.

const STAR_COUNT = 100;
const SPEED = 0.1;

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
    this.opacity = Math.random() * 0.5 + 0.3;
  }

  update() {
    this.x += this.speed;
    this.y -= this.speed;
    if (this.x > this.width || this.y < -10) this.init(false);
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = `rgba(255,255,255,${this.opacity})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
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

  update() {
    this.x += this.dx;
    this.y += this.dy;
    this.life++;
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

  let width = 0;
  let height = 0;
  let stars: Star[] = [];
  let shootingStars: ShootingStar[] = [];

  function resize() {
    width = canvas!.width = window.innerWidth;
    height = canvas!.height = window.innerHeight;
    stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push(new Star(true, width, height));
    }
  }

  function animate() {
    ctx!.clearRect(0, 0, width, height);
    stars.forEach((s) => {
      s.update();
      s.draw(ctx!);
    });
    if (Math.random() < 0.01) {
      shootingStars.push(new ShootingStar(width, height));
    }
    shootingStars = shootingStars.filter((s) => {
      s.update();
      s.draw(ctx!);
      return !s.dead;
    });
    requestAnimationFrame(animate);
  }

  resize();
  animate();
  window.addEventListener("resize", resize);
}
