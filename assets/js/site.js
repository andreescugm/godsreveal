/* GOD'S REVEAL - interacciones compartidas */
(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. La luz: puntero / giroscopio mueve el brillo del film holografico ---------- */
  const holos = [...document.querySelectorAll(".holo, .holo--chrome, [data-light]")];
  let px = window.innerWidth * 0.5;
  let py = window.innerHeight * 0.35;
  let queued = false;
  let t0 = performance.now();
  let lastInput = 0;

  const paint = () => {
    queued = false;
    for (const el of holos) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) continue;
      const x = ((px - r.left) / Math.max(r.width, 1)) * 100;
      const y = ((py - r.top) / Math.max(r.height, 1)) * 100;
      el.style.setProperty("--mx", `${x.toFixed(1)}%`);
      el.style.setProperty("--my", `${y.toFixed(1)}%`);
      el.style.setProperty("--spin", `${((px / window.innerWidth) * 220).toFixed(0)}deg`);
    }
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };

  window.addEventListener("pointermove", (e) => {
    px = e.clientX; py = e.clientY; lastInput = performance.now(); queue();
  }, { passive: true });

  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma == null) return;
    px = window.innerWidth * (0.5 + Math.max(-45, Math.min(45, e.gamma)) / 90);
    py = window.innerHeight * (0.5 + Math.max(-45, Math.min(45, (e.beta || 45) - 45)) / 90);
    lastInput = performance.now(); queue();
  }, { passive: true });

  // iOS pide permiso para el giroscopio: se solicita en el primer toque.
  if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
    window.addEventListener("touchend", () => { DeviceOrientationEvent.requestPermission().catch(() => {}); }, { once: true });
  }

  // Sin puntero (movil sin giroscopio, o reposo): la luz se mueve sola, muy despacio.
  if (!reduce && holos.length) {
    const drift = (now) => {
      if (now - lastInput > 2500) {
        const t = (now - t0) / 1000;
        px = window.innerWidth * (0.5 + 0.38 * Math.sin(t * 0.35));
        py = window.innerHeight * (0.4 + 0.18 * Math.cos(t * 0.27));
        paint();
      }
      requestAnimationFrame(drift);
    };
    requestAnimationFrame(drift);
  } else {
    paint();
  }
  window.addEventListener("resize", queue, { passive: true });

  /* ---------- 2. Revelar al entrar en pantalla ---------- */
  const rvs = document.querySelectorAll(".rv");
  if (reduce || !("IntersectionObserver" in window)) {
    rvs.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      }
    }, { threshold: 0.18 });
    rvs.forEach((el) => io.observe(el));
  }

  /* ---------- 3. Lista de acceso (sin backend todavia) ---------- */
  document.querySelectorAll("form[data-list]").forEach((form) => {
    const input = form.querySelector("input[type=email]");
    const help = form.querySelector(".field__help");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      if (!ok) {
        help.dataset.state = "error";
        help.textContent = "Revisa el email. Algo no cuadra.";
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }
      input.removeAttribute("aria-invalid");
      help.dataset.state = "ok";
      help.textContent = form.dataset.ok || "Estás dentro. Te avisaremos antes que a nadie.";
      form.querySelector("button").disabled = true;
      input.disabled = true;
      // TODO: conectar a Shopify / Klaviyo cuando exista la tienda.
    });
  });

  /* ---------- 4. Atmosfera generativa (nubes / humo) ---------- */
  document.querySelectorAll("canvas[data-atmos]").forEach((cv) => {
    const mode = cv.dataset.atmos; // "cloud" | "smoke"
    const ctx = cv.getContext("2d");
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let running = false;
    const N = mode === "smoke" ? 34 : 22;
    const parts = [];

    const size = () => {
      const r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const spawn = (p = {}, fresh = false) => {
      p.r = (mode === "smoke" ? 90 : 140) + Math.random() * (mode === "smoke" ? 220 : 260);
      p.x = Math.random() * w;
      p.y = mode === "smoke" ? (fresh ? Math.random() * h : h + p.r) : Math.random() * h;
      p.vx = mode === "smoke" ? (Math.random() - 0.5) * 0.18 : 0.08 + Math.random() * 0.14;
      p.vy = mode === "smoke" ? -(0.14 + Math.random() * 0.32) : (Math.random() - 0.5) * 0.03;
      p.a = mode === "smoke" ? 0.035 + Math.random() * 0.05 : 0.22 + Math.random() * 0.3;
      return p;
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        const c = mode === "smoke" ? "205,205,215" : "255,255,255";
        g.addColorStop(0, `rgba(${c},${p.a})`);
        g.addColorStop(1, `rgba(${c},0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
    };
    const step = () => {
      if (!running) return;
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy;
        if (mode === "smoke") { p.r += 0.12; p.a *= 0.9992; if (p.y < -p.r) spawn(p); }
        else if (p.x - p.r > w) { spawn(p); p.x = -p.r; }
      }
      draw();
      requestAnimationFrame(step);
    };

    size();
    for (let i = 0; i < N; i++) parts.push(spawn({}, true));
    draw();
    window.addEventListener("resize", () => { size(); draw(); }, { passive: true });

    if (reduce) return;
    new IntersectionObserver(([en]) => {
      const was = running;
      running = en.isIntersecting;
      if (running && !was) requestAnimationFrame(step);
    }).observe(cv);
  });

  /* ---------- 5. El velo de entrada ---------- */
  const veil = document.querySelector(".veil");
  if (veil) {
    const lift = () => veil.classList.add("is-lifted");
    if (reduce) lift();
    else window.addEventListener("load", () => setTimeout(lift, 650));
    setTimeout(lift, 2600); // por si "load" tarda
  }
})();
