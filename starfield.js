/**
 * starfield.js
 * Renders an animated twinkling star field on <canvas id="sfx">
 * Fixed position — covers the entire page viewport at all times.
 */

(function initStarfield() {
  'use strict';

  const canvas = document.getElementById('sfx');
  if (!canvas) return;

  const ctx   = canvas.getContext('2d');
  const isMob = window.innerWidth <= 768;

  const STAR_COUNT  = isMob ? 180 : 320;
  const MAX_OPACITY = 0.85;
  const MIN_OPACITY = 0.06;

  let resizeTimer = null;

  function setSize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  setSize();

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(setSize, 150);
  });

  function makeStar() {
    const speed  = Math.random() * 0.00028 + 0.00005;
    const startO = Math.random() * (MAX_OPACITY - MIN_OPACITY) + MIN_OPACITY;
    return {
      x: Math.random(), y: Math.random(),
      r: Math.random() * 0.9 + 0.1,
      o: startO,
      s: speed * (Math.random() < 0.5 ? 1 : -1),
    };
  }

  const stars = Array.from({ length: STAR_COUNT }, makeStar);

  let isActive = true;
  document.addEventListener('visibilitychange', () => { isActive = !document.hidden; });

  function drawFrame() {
    if (isActive) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const W = canvas.width, H = canvas.height;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.o += s.s;
        if (s.o >= MAX_OPACITY) { s.o = MAX_OPACITY; s.s = -Math.abs(s.s); }
        if (s.o <= MIN_OPACITY) { s.o = MIN_OPACITY; s.s =  Math.abs(s.s); }
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,220,255,${s.o.toFixed(2)})`;
        ctx.fill();
      }
    }
    requestAnimationFrame(drawFrame);
  }

  requestAnimationFrame(drawFrame);
})();
