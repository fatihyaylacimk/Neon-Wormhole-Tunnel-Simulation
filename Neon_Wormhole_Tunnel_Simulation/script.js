const canvas = document.getElementById("tunnel");
const ctx = canvas.getContext("2d");

let width, height, dpr;
let rings = [];
let stars = [];
let time = 0;

const mouse = {
  x: 0,
  y: 0,
  tx: 0,
  ty: 0
};

const config = {
  ringCount: 52,
  segments: 96,
  speed: 0.018,
  spacing: 0.055
};

function resize() {
  dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  createRings();
  createStars();
}

function createRings() {
  rings = [];

  for (let i = 0; i < config.ringCount; i++) {
    rings.push({
      z: i * config.spacing,
      twist: Math.random() * Math.PI * 2
    });
  }
}

function createStars() {
  stars = [];
  const count = Math.floor((width * height) / 6500);

  for (let i = 0; i < count; i++) {
    stars.push({
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * Math.max(width, height) * 0.75,
      z: Math.random(),
      speed: Math.random() * 0.012 + 0.006,
      size: Math.random() * 1.5 + 0.3
    });
  }
}

function project(x, y, z) {
  const depth = 1 / (z + 0.08);
  const scale = Math.min(width, height) * 0.62 * depth;

  const bendX = Math.sin(z * 8 + time * 1.5) * 42 + mouse.x * (1 - z) * 90;
  const bendY = Math.cos(z * 7 - time * 1.1) * 28 + mouse.y * (1 - z) * 70;

  return {
    x: width / 2 + x * scale + bendX,
    y: height / 2 + y * scale + bendY,
    scale
  };
}

function drawBackground() {
  ctx.fillStyle = "rgba(2, 3, 6, 0.32)";
  ctx.fillRect(0, 0, width, height);

  const g = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.55);
  g.addColorStop(0, "rgba(0,255,210,0.12)");
  g.addColorStop(0.35, "rgba(0,130,255,0.035)");
  g.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}

function drawStars() {
  ctx.save();
  ctx.shadowBlur = 10;
  ctx.shadowColor = "rgba(0,255,210,0.8)";

  for (const s of stars) {
    s.z -= s.speed;
    if (s.z <= 0.02) {
      s.z = 1;
      s.angle = Math.random() * Math.PI * 2;
      s.radius = Math.random() * Math.max(width, height) * 0.75;
    }

    const depth = 1 / s.z;
    const x = width / 2 + Math.cos(s.angle) * s.radius * depth * 0.22 + mouse.x * 90 * (1 - s.z);
    const y = height / 2 + Math.sin(s.angle) * s.radius * depth * 0.22 + mouse.y * 70 * (1 - s.z);

    const alpha = Math.max(0, Math.min(0.75, 1 - s.z));
    const size = s.size * (1.6 - s.z);

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(120,255,230,${alpha})`;
    ctx.fill();
  }

  ctx.restore();
}

function drawTunnel() {
  for (const ring of rings) {
    ring.z -= config.speed;

    if (ring.z <= 0.04) {
      ring.z += 1;
      ring.twist = Math.random() * Math.PI * 2;
    }
  }

  rings.sort((a, b) => b.z - a.z);

  const projectedRings = rings.map((ring) => {
    const points = [];
    const radiusBase = 0.46 + Math.sin(ring.z * 16 + time * 2) * 0.028;
    const ellipse = 0.68 + Math.cos(time + ring.z * 5) * 0.04;

    for (let i = 0; i < config.segments; i++) {
      const a = (i / config.segments) * Math.PI * 2;
      const noise = Math.sin(a * 5 + time * 3 + ring.z * 10) * 0.018;
      const radius = radiusBase + noise;

      const twist = a + ring.twist + time * 0.6 + ring.z * 4.5;
      const x = Math.cos(twist) * radius;
      const y = Math.sin(twist) * radius * ellipse;

      points.push(project(x, y, ring.z));
    }

    return {
      z: ring.z,
      points
    };
  });

  ctx.save();
  ctx.lineWidth = 1.1;
  ctx.shadowBlur = 12;
  ctx.shadowColor = "rgba(0,255,210,0.75)";

  for (let r = 0; r < projectedRings.length; r++) {
    const ring = projectedRings[r];
    const alpha = Math.pow(1 - ring.z, 1.35) * 0.85;

    ctx.beginPath();
    for (let i = 0; i < ring.points.length; i++) {
      const p = ring.points[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(55,255,220,${alpha})`;
    ctx.stroke();

    if (r < projectedRings.length - 1 && r % 2 === 0) {
      const next = projectedRings[r + 1];

      for (let i = 0; i < config.segments; i += 8) {
        const a = ring.points[i];
        const b = next.points[(i + 2) % config.segments];

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(55,255,220,${alpha * 0.48})`;
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

function drawCore() {
  const pulse = 0.75 + Math.sin(time * 4) * 0.25;
  const g = ctx.createRadialGradient(width / 2 + mouse.x * 45, height / 2 + mouse.y * 35, 0, width / 2, height / 2, 150 + pulse * 80);

  g.addColorStop(0, `rgba(180,255,240,${0.35 * pulse})`);
  g.addColorStop(0.22, `rgba(0,255,210,${0.22 * pulse})`);
  g.addColorStop(1, "rgba(0,255,210,0)");

  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(width / 2 + mouse.x * 50, height / 2 + mouse.y * 40, 220, 0, Math.PI * 2);
  ctx.fill();
}

function animate() {
  time += 0.016;
  mouse.x += (mouse.tx - mouse.x) * 0.06;
  mouse.y += (mouse.ty - mouse.y) * 0.06;

  drawBackground();
  drawStars();
  drawTunnel();
  drawCore();

  requestAnimationFrame(animate);
}

window.addEventListener("resize", resize);

window.addEventListener("mousemove", (e) => {
  mouse.tx = (e.clientX / width - 0.5) * 1.4;
  mouse.ty = (e.clientY / height - 0.5) * 1.2;
});

window.addEventListener("touchmove", (e) => {
  const t = e.touches[0];
  mouse.tx = (t.clientX / width - 0.5) * 1.4;
  mouse.ty = (t.clientY / height - 0.5) * 1.2;
}, { passive: true });

resize();
ctx.fillStyle = "#020306";
ctx.fillRect(0, 0, width, height);
animate();
