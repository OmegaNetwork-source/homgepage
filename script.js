// ===========================================================
// OLYMPUS — interaction layer
// ===========================================================
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el, i) => {
      el.style.transitionDelay = reduceMotion ? '0ms' : `${Math.min(i % 4, 3) * 90}ms`;
      io.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- scroll ladder active state ---------- */
  const ladderItems = document.querySelectorAll('.ladder-list li');
  const sectionIds = Array.from(ladderItems).map((li) => li.dataset.target);
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  ladderItems.forEach((li) => {
    li.addEventListener('click', () => {
      const target = document.getElementById(li.dataset.target);
      if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
    li.style.cursor = 'pointer';
  });

  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const idx = sectionIds.indexOf(entry.target.id);
        if (idx === -1) return;
        if (entry.isIntersecting) {
          ladderItems.forEach((li) => li.classList.remove('active'));
          ladderItems[idx].classList.add('active');
        }
      });
    }, { threshold: 0.5, rootMargin: '-20% 0px -20% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- hero window tilt ---------- */
  const tiltWindow = document.getElementById('tiltWindow');
  const heroSection = document.querySelector('.hero');
  if (tiltWindow && heroSection && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const rotY = x * 8;
      const rotX = y * -6;
      tiltWindow.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    });
    heroSection.addEventListener('mouseleave', () => {
      tiltWindow.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });
  }

  /* ---------- ambient candlestick canvas ---------- */
  const canvas = document.getElementById('heroCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const wrap = document.getElementById('heroCanvasWrap');
    let w, h, dpr;
    let candles = [];

    function seedCandles() {
      candles = [];
      const count = 46;
      let price = 50;
      for (let i = 0; i < count; i++) {
        const drift = (Math.random() - 0.42) * 8;
        const open = price;
        price = Math.max(8, price + drift);
        const close = price;
        const high = Math.max(open, close) + Math.random() * 4;
        const low = Math.min(open, close) - Math.random() * 4;
        candles.push({ open, close, high, low });
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = wrap.clientWidth;
      h = wrap.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const n = candles.length;
      const padX = w * 0.06;
      const usableW = w - padX * 2;
      const cw = usableW / n;

      let min = Infinity, max = -Infinity;
      candles.forEach((c) => {
        min = Math.min(min, c.low);
        max = Math.max(max, c.high);
      });
      const padY = h * 0.22;
      const usableH = h - padY * 2;
      const scaleY = (v) => h - padY - ((v - min) / (max - min || 1)) * usableH;

      candles.forEach((c, i) => {
        const x = padX + i * cw + cw / 2;
        const up = c.close >= c.open;
        ctx.strokeStyle = up ? 'rgba(245,245,247,0.34)' : 'rgba(245,245,247,0.14)';
        ctx.fillStyle = up ? 'rgba(245,245,247,0.22)' : 'rgba(245,245,247,0.08)';
        ctx.lineWidth = 1;

        // wick
        ctx.beginPath();
        ctx.moveTo(x, scaleY(c.high));
        ctx.lineTo(x, scaleY(c.low));
        ctx.stroke();

        // body
        const bw = Math.max(cw * 0.42, 2);
        const yOpen = scaleY(c.open);
        const yClose = scaleY(c.close);
        const top = Math.min(yOpen, yClose);
        const bh = Math.max(Math.abs(yClose - yOpen), 1.5);
        ctx.fillRect(x - bw / 2, top, bw, bh);
      });
    }

    seedCandles();
    resize();
    draw();

    window.addEventListener('resize', () => {
      resize();
      draw();
    });

    // gentle ambient drift — reprice the last candle slowly
    if (!reduceMotion) {
      setInterval(() => {
        candles.shift();
        const last = candles[candles.length - 1];
        const drift = (Math.random() - 0.42) * 8;
        const open = last.close;
        const close = Math.max(8, open + drift);
        const high = Math.max(open, close) + Math.random() * 4;
        const low = Math.min(open, close) - Math.random() * 4;
        candles.push({ open, close, high, low });
        draw();
      }, 1400);
    }
  }

  /* ---------- network gate (launch + claim) ---------- */
  const gate = document.getElementById('networkGate');
  const gateClose = document.getElementById('networkGateClose');
  const gateStatus = document.getElementById('networkGateStatus');
  const gateEyebrow = document.getElementById('networkGateEyebrow');
  const gateTitle = document.getElementById('networkGateTitle');
  const gateSub = document.getElementById('networkGateSub');
  const launchBtns = document.querySelectorAll('.js-launch-app');
  const claimBtns = document.querySelectorAll('.js-claim');
  const APP_ORIGIN = 'https://olympus.omeganetwork.co';
  let gateClosing = false;
  let gateLaunching = false;
  let gateMode = 'claim';

  function applyGateMode(mode) {
    gateMode = mode === 'launch' ? 'launch' : 'claim';
    const isClaim = gateMode === 'claim';
    if (gateEyebrow) gateEyebrow.textContent = 'Olympus App';
    if (gateTitle) gateTitle.textContent = 'Select a network';
    if (gateSub) {
      gateSub.textContent = isClaim
        ? 'Claim pOmega and a Guide on the chain you want.'
        : 'Same wallet, same Omega. Choose the chain you want to enter on.';
    }
    gate.querySelectorAll('.network-card').forEach((card) => {
      const slug = card.dataset.slug;
      const go = card.querySelector('.network-go');
      card.href = isClaim ? `${APP_ORIGIN}/${slug}/rewards` : `${APP_ORIGIN}/${slug}`;
      if (go) go.textContent = isClaim ? 'Claim' : 'Enter';
    });
  }

  function openGate(event, mode) {
    if (!gate || gate.open || gateLaunching) return;
    applyGateMode(mode);
    if (gateStatus) gateStatus.textContent = '';
    gate.classList.remove('is-launching');
    gate.querySelectorAll('.network-card.is-picked').forEach((el) => el.classList.remove('is-picked'));
    gate.showModal();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => gate.classList.add('is-open'));
    });
  }

  function closeGate() {
    if (!gate || !gate.open || gateClosing || gateLaunching) return;
    gateClosing = true;
    gate.classList.remove('is-open');
    const wait = reduceMotion ? 0 : 280;
    setTimeout(() => {
      gate.close();
      gateClosing = false;
    }, wait);
  }

  launchBtns.forEach((btn) => {
    btn.addEventListener('click', (event) => openGate(event, 'launch'));
  });
  claimBtns.forEach((btn) => {
    btn.addEventListener('click', (event) => openGate(event, 'claim'));
  });

  if (gateClose) gateClose.addEventListener('click', closeGate);

  window.addEventListener('pageshow', (event) => {
    if (!event.persisted || !gate) return;
    gateLaunching = false;
    gate.classList.remove('is-launching', 'is-open');
    gate.querySelectorAll('.network-card.is-picked').forEach((el) => el.classList.remove('is-picked'));
    if (gate.open) gate.close();
    if (gateStatus) gateStatus.textContent = '';
  });

  if (gate) {
    gate.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeGate();
    });
    gate.addEventListener('click', (event) => {
      if (event.target === gate) closeGate();
    });
    gate.querySelectorAll('.network-card').forEach((card) => {
      card.addEventListener('click', (event) => {
        if (gateLaunching) {
          event.preventDefault();
          return;
        }
        event.preventDefault();
        gateLaunching = true;
        card.classList.add('is-picked');
        gate.classList.add('is-launching');
        const name = card.dataset.network || 'Olympus';
        if (gateStatus) {
          gateStatus.textContent = gateMode === 'claim' ? `Opening ${name} rewards…` : `Opening ${name}…`;
        }
        const wait = reduceMotion ? 0 : 640;
        setTimeout(() => {
          window.location.href = card.href;
          gateLaunching = false;
        }, wait);
      });
    });
  }

  /* ---------- live Hermes phone embed ---------- */
  const hermesPhone = document.getElementById('hermesPhone');
  const hermesEmbed = document.getElementById('hermesEmbed');
  const hermesTry = document.getElementById('hermesTry');
  const hermesBlocked = document.getElementById('hermesBlocked');
  const HERMES_URL = 'https://olympus.omeganetwork.co/hermes';

  function startHermes() {
    if (!hermesPhone || !hermesEmbed || hermesPhone.classList.contains('is-loading') || hermesPhone.classList.contains('is-live')) return;
    hermesPhone.classList.add('is-loading');
    if (hermesTry) hermesTry.textContent = 'Loading Hermes…';
    hermesEmbed.src = hermesEmbed.dataset.src || HERMES_URL;
    let settled = false;
    const succeed = () => {
      if (settled) return;
      settled = true;
      hermesPhone.classList.remove('is-loading');
      hermesPhone.classList.add('is-live');
    };
    const fail = () => {
      if (settled) return;
      settled = true;
      hermesPhone.classList.remove('is-loading');
      if (hermesTry) hermesTry.hidden = true;
      if (hermesBlocked) hermesBlocked.hidden = false;
    };
    hermesEmbed.addEventListener('load', () => {
      try {
        const href = hermesEmbed.contentWindow && hermesEmbed.contentWindow.location.href;
        if (!href || href === 'about:blank') {
          fail();
          return;
        }
        succeed();
      } catch (err) {
        succeed();
      }
    }, { once: true });
    hermesEmbed.addEventListener('error', fail, { once: true });
    setTimeout(() => {
      if (!settled) fail();
    }, 8000);
  }

  if (hermesTry) hermesTry.addEventListener('click', startHermes);
})();
