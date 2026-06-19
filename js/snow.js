(() => {
  const CONFIG = {
    profile: "normal",
    color: "#f8fbff",
    canvasOpacity: 0.35,
    wrapMargin: 10,
    swayAmplitude: 0.14,
    normal: {
      radius: [1.2, 3.5],
      speedY: [0.14, 0.49],
      drift: [-0.2, 0.2],
      swaySpeed: [0.002, 0.009],
      alpha: [0.2, 0.55],
      densityDivisor: 5000,
      minFlakes: 40,
      maxFlakes: 240,
    },
    reduced: {
      radius: [0.8, 2.0],
      speedY: [0.06, 0.18],
      drift: [-0.12, 0.12],
      swaySpeed: [0.001, 0.004],
      alpha: [0.16, 0.4],
      densityDivisor: 60000,
      minFlakes: 10,
      maxFlakes: 28,
    },
  };

  const canvas = document.createElement("canvas");
  canvas.id = "snow-canvas";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.opacity = String(CONFIG.canvasOpacity);
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  let width = 0;
  let height = 0;
  let animationId = 0;

  const flakes = [];

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const randomInRange = ([min, max]) => Math.random() * (max - min) + min;
  const getProfile = () => {
    if (CONFIG.profile === "reduced") {
      return CONFIG.reduced;
    }
    return CONFIG.normal;
  };

  const createFlake = () => {
    const profile = getProfile();
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      radius: randomInRange(profile.radius),
      speedY: randomInRange(profile.speedY),
      drift: randomInRange(profile.drift),
      sway: Math.random() * Math.PI * 2,
      swaySpeed: randomInRange(profile.swaySpeed),
      alpha: randomInRange(profile.alpha),
    };
  };

  const rebuildFlakes = () => {
    const profile = getProfile();
    const count = clamp(
      Math.round((width * height) / profile.densityDivisor),
      profile.minFlakes,
      profile.maxFlakes,
    );
    flakes.length = 0;
    for (let i = 0; i < count; i += 1) {
      flakes.push(createFlake());
    }
  };

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    rebuildFlakes();
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);

    for (const flake of flakes) {
      flake.sway += flake.swaySpeed;
      flake.x += flake.drift + Math.sin(flake.sway) * CONFIG.swayAmplitude;
      flake.y += flake.speedY;

      if (flake.y - flake.radius > height) {
        flake.y = -flake.radius;
        flake.x = Math.random() * width;
      }

      if (flake.x < -CONFIG.wrapMargin) {
        flake.x = width + CONFIG.wrapMargin;
      } else if (flake.x > width + CONFIG.wrapMargin) {
        flake.x = -CONFIG.wrapMargin;
      }

      ctx.globalAlpha = flake.alpha;
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.color;
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    animationId = window.requestAnimationFrame(draw);
  };

  const stop = () => {
    if (animationId) {
      window.cancelAnimationFrame(animationId);
      animationId = 0;
    }
  };

  const start = () => {
    stop();
    draw();
  };

  window.addEventListener("resize", resize, { passive: true });

  resize();
  start();
})();
