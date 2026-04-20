/**
 * main.js
 * ─────────────────────────────────────────────────────────────
 * All interactive behaviour for Shivam Kumar's portfolio.
 *
 * Modules (each wrapped in an IIFE):
 *  1.  Loader           Animated progress bar + fade out
 *  2.  Cursor           Custom dual-ring cursor with lerp
 *  3.  Navigation       Scroll header style, mobile menu
 *  4.  Typed text       Typewriter role-switcher in Hero
 *  5.  Skill tabs       Programming / Web Dev / Design switcher
 *  6.  Project filter   All / Web Dev / Design / Other tabs
 *  7.  Scroll reveal    IntersectionObserver for .rv / .rv2
 *  8.  Skill bars       Animate fill width on scroll into view
 *  9.  Count-up         Animated stat numbers in Experience
 * 10.  Project tilt     3D card tilt on mousemove
 * 11.  Contact form     Validation + success message
 * 12.  Back-to-top      Floating button visibility + click
 *
 * Conventions:
 *  - Each module is a self-invoking function to avoid globals.
 *  - DOM queries are cached where reused.
 *  - All observers use { passive: true } where applicable.
 *  - Touch devices get cursor/tilt features disabled.
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ─────────────────────────────────────────────────────────────
   Utility helpers
───────────────────────────────────────────────────────────── */

/** Query selector shorthand */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/** Detect touch-only device */
const isTouchDevice = () => window.matchMedia('(hover: none)').matches;

/** Simple debounce */
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}


/* ═══════════════════════════════════════════════════════════
   1. LOADER
   Counts a fake percentage, then fades out post-load.
═══════════════════════════════════════════════════════════ */
(function initLoader() {
  const loader  = document.getElementById('loader');
  const progBar = document.getElementById('ldp');
  const progTxt = document.getElementById('ldt');
  if (!loader) return;

  let pct = 0;
  const ticker = setInterval(() => {
    pct = Math.min(pct + Math.floor(Math.random() * 14 + 4), 100);
    progBar.style.width  = pct + '%';
    progTxt.textContent  = pct + '%';
    if (pct >= 100) clearInterval(ticker);
  }, 120);

  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('out');
      loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    }, 1800);
  });
})();


/* ═══════════════════════════════════════════════════════════
   2. CUSTOM CURSOR
   Dot follows pointer immediately; ring lags via lerp.
   Skipped entirely on touch devices.
═══════════════════════════════════════════════════════════ */
(function initCursor() {
  if (isTouchDevice()) return;

  const dot  = document.getElementById('cur');
  const ring = document.getElementById('cur2');
  if (!dot || !ring) return;

  let mX = 0, mY = 0, rX = 0, rY = 0;
  const LERP = 0.1;

  document.addEventListener('mousemove', (e) => {
    mX = e.clientX; mY = e.clientY;
    dot.style.left = mX + 'px';
    dot.style.top  = mY + 'px';
  }, { passive: true });

  (function animRing() {
    rX += (mX - rX) * LERP;
    rY += (mY - rY) * LERP;
    ring.style.left = rX + 'px';
    ring.style.top  = rY + 'px';
    requestAnimationFrame(animRing);
  })();

  /* Expand on interactive elements */
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest('a, button, .sk-tab, .pf-tab, .chip, .pc');
    document.body.classList.toggle('lh', !!el);
  });
})();


/* ═══════════════════════════════════════════════════════════
   3. NAVIGATION
   • Adds .scr class after 40px scroll (glassmorphism nav)
   • Toggles mobile overlay on burger click
   • Active nav link highlighting based on section in view
═══════════════════════════════════════════════════════════ */
(function initNav() {
  const nav       = document.getElementById('nav');
  const burger    = document.getElementById('burger-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const mnavClose = document.getElementById('mnav-close');
  if (!nav) return;

  /* Scrolled style */
  const onScroll = debounce(() => {
    nav.classList.toggle('scr', window.scrollY > 40);
  }, 20);
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Burger open / close */
  function openMenu() {
    mobileNav.classList.add('on');
    mobileNav.removeAttribute('aria-hidden');
    burger.classList.add('active');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    mobileNav.classList.remove('on');
    mobileNav.setAttribute('aria-hidden', 'true');
    burger.classList.remove('active');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  burger?.addEventListener('click', () => {
    mobileNav.classList.contains('on') ? closeMenu() : openMenu();
  });
  mnavClose?.addEventListener('click', closeMenu);

  /* Close mobile nav when any link is tapped */
  $$('a', mobileNav).forEach(a => a.addEventListener('click', closeMenu));

  /* Close on outside click */
  document.addEventListener('click', (e) => {
    if (mobileNav.classList.contains('on') &&
        !mobileNav.contains(e.target) &&
        !burger.contains(e.target)) {
      closeMenu();
    }
  });

  /* Close on Escape */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileNav.classList.contains('on')) closeMenu();
  });
})();


/* ═══════════════════════════════════════════════════════════
   4. TYPEWRITER / ROLE SWITCHER
   Types each role one char at a time, deletes, then advances.
═══════════════════════════════════════════════════════════ */
(function initTyped() {
  const el = document.getElementById('typed');
  if (!el) return;

  const roles = [
    'BCA Student',
    'Web Developer',
    'Graphic Designer',
    'Robotics Mentor',
  ];

  const TYPE_MS   = 85;
  const DELETE_MS = 52;
  const HOLD_MS   = 1800;

  let ri = 0, ci = 0, deleting = false;

  function tick() {
    const word = roles[ri];
    if (!deleting) {
      el.textContent = word.slice(0, ++ci);
      if (ci === word.length) { deleting = true; setTimeout(tick, HOLD_MS); return; }
    } else {
      el.textContent = word.slice(0, --ci);
      if (ci === 0) { deleting = false; ri = (ri + 1) % roles.length; }
    }
    setTimeout(tick, deleting ? DELETE_MS : TYPE_MS);
  }

  /* Delay start until after loader */
  setTimeout(tick, 2200);
})();


/* ═══════════════════════════════════════════════════════════
   5. SKILL TABS
   Switches panels and re-triggers bar animations + reveals.
═══════════════════════════════════════════════════════════ */
(function initSkillTabs() {
  const PANEL_MAP = { prog: 'tp', web: 'tw', des: 'td' };

  $$('.sk-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      /* Deactivate all */
      $$('.sk-tab').forEach(t => { t.classList.remove('on'); t.setAttribute('aria-selected', 'false'); });
      $$('.sk-pnl').forEach(p => { p.classList.remove('on'); p.hidden = true; });

      /* Activate selected */
      this.classList.add('on');
      this.setAttribute('aria-selected', 'true');

      const panel = document.getElementById(PANEL_MAP[this.dataset.t]);
      if (!panel) return;

      panel.classList.add('on');
      panel.hidden = false;

      /* Re-animate bars */
      $$('.sk-fill', panel).forEach(bar => {
        bar.style.width = '0';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => { bar.style.width = bar.dataset.p + '%'; });
        });
      });

      /* Re-trigger reveal animations */
      $$('.rv', panel).forEach(el => {
        el.classList.remove('in');
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
      });
    });
  });
})();


/* ═══════════════════════════════════════════════════════════
   6. 3D PROJECT CAROUSEL
   Auto-rotates every 4 s. Arrow buttons and dot buttons allow
   manual navigation. Progress bar animates between advances.
═══════════════════════════════════════════════════════════ */
(function initCarousel() {
  const scene     = document.getElementById('carousel-scene');
  if (!scene) return;

  const cards     = [...scene.querySelectorAll('.pc')];
  const dots      = [...document.querySelectorAll('.carousel-dot')];
  const prevBtn   = document.getElementById('carousel-prev');
  const nextBtn   = document.getElementById('carousel-next');
  const progBar   = document.getElementById('carousel-progress-bar');

  const N         = cards.length;
  const AUTO_MS   = 4000;  // auto-advance interval
  let   active    = 0;     // index of front card
  let   timer     = null;
  let   progTimer = null;

  /* Assign data-pos to each card based on distance from active */
  function posOf(idx) {
    let d = ((idx - active) % N + N) % N;
    if (d > N / 2) d -= N;   // wrap to nearest side  (-N/2 … N/2)
    return d;
  }

  function layout() {
    cards.forEach((card, i) => {
      const pos = posOf(i);
      /* Cap visible range — anything beyond ±2 gets pos ±3 (hidden) */
      const clamped = Math.max(-3, Math.min(3, pos));
      card.dataset.pos = clamped;
    });

    /* Dots */
    dots.forEach((dot, i) => {
      const on = i === active;
      dot.classList.toggle('on', on);
      dot.setAttribute('aria-selected', on);
    });
  }

  /* ── Progress bar animation ── */
  function startProgress() {
    if (!progBar) return;
    clearTimeout(progTimer);
    progBar.style.transition = 'none';
    progBar.style.width      = '0%';

    /* Force reflow */
    void progBar.offsetWidth;

    progBar.style.transition = `width ${AUTO_MS}ms linear`;
    progBar.style.width      = '100%';
  }

  /* ── Auto-advance ── */
  function startAuto() {
    clearInterval(timer);
    timer = setInterval(() => advance(1), AUTO_MS);
    startProgress();
  }

  function stopAuto() {
    clearInterval(timer);
    if (progBar) {
      progBar.style.transition = 'none';
      progBar.style.width = '0%';
    }
  }

  function advance(dir) {
    /* Mark all transitioning to suppress float animation during move */
    cards.forEach(c => c.classList.add('transitioning'));
    active = ((active + dir) % N + N) % N;
    layout();
    setTimeout(() => cards.forEach(c => c.classList.remove('transitioning')), 1100);
  }

  /* ── Init ── */
  layout();
  startAuto();

  /* Arrow buttons */
  prevBtn?.addEventListener('click', () => { advance(-1); stopAuto(); startAuto(); });
  nextBtn?.addEventListener('click', () => { advance(1);  stopAuto(); startAuto(); });

  /* Dot buttons */
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      active = i;
      layout();
      stopAuto();
      startAuto();
    });
  });

  /* Click on a side card — bring it to front */
  scene.addEventListener('click', (e) => {
    const card = e.target.closest('.pc');
    if (!card || card.dataset.pos === '0') return;
    const idx = cards.indexOf(card);
    if (idx === -1) return;
    active = idx;
    layout();
    stopAuto();
    startAuto();
  });

  /* Pause auto-rotate while hovering the active card */
  scene.addEventListener('mouseenter', stopAuto);
  scene.addEventListener('mouseleave', startAuto);

  /* Keyboard: arrow keys when carousel is focused */
  scene.setAttribute('tabindex', '0');
  scene.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { advance(-1); stopAuto(); startAuto(); }
    if (e.key === 'ArrowRight') { advance(1);  stopAuto(); startAuto(); }
  });
})();


/* ═══════════════════════════════════════════════════════════
   7. SCROLL REVEAL
   IntersectionObserver adds .in class to .rv / .rv2 elements
   when they enter the viewport.
═══════════════════════════════════════════════════════════ */
(function initScrollReveal() {
  /* Skip if reduced motion is preferred */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    $$('.rv, .rv2').forEach(el => el.classList.add('in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }),
    { threshold: 0.08 }
  );

  $$('.rv, .rv2').forEach(el => io.observe(el));
})();


/* ═══════════════════════════════════════════════════════════
   8. SKILL BAR ANIMATION
   When a skill panel scrolls into view, animate the fill bars.
═══════════════════════════════════════════════════════════ */
(function initSkillBars() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          $$('.sk-fill', e.target).forEach(bar => { bar.style.width = bar.dataset.p + '%'; });
        }
      });
    },
    { threshold: 0.15 }
  );
  $$('.sk-pnl').forEach(el => io.observe(el));
})();


/* ═══════════════════════════════════════════════════════════
   9. COUNT-UP ANIMATION
   Animates stat numbers from 0 to target when scrolled into view.
═══════════════════════════════════════════════════════════ */
(function initCountUp() {
  const STEPS    = 28;
  const INTERVAL = 52;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);

        $$('.cnt', e.target).forEach(el => {
          const target = parseInt(el.dataset.t, 10);
          let cur = 0;
          const step = Math.ceil(target / STEPS);
          const timer = setInterval(() => {
            cur = Math.min(cur + step, target);
            el.textContent = cur;
            if (cur >= target) clearInterval(timer);
          }, INTERVAL);
        });
      });
    },
    { threshold: 0.25 }
  );

  $$('.st-col').forEach(el => io.observe(el));
})();


/* ═══════════════════════════════════════════════════════════
  10. PROJECT CARD ACTIVE-CARD SUBTLE TILT
   Only tilts the active (pos=0) card slightly on mousemove.
═══════════════════════════════════════════════════════════ */
(function initProjectTilt() {
  if (isTouchDevice()) return;

  const MAX_Y = 4;
  const MAX_X = 3;

  document.addEventListener('mousemove', (e) => {
    const activeCard = document.querySelector('.pc[data-pos="0"]');
    if (!activeCard) return;
    const r = activeCard.getBoundingClientRect();
    /* Only tilt if mouse is near the active card */
    if (e.clientX < r.left - 100 || e.clientX > r.right + 100) return;
    const x = (e.clientX - (r.left + r.width  / 2)) / r.width;
    const y = (e.clientY - (r.top  + r.height / 2)) / r.height;
    activeCard.style.setProperty('--tilt-x', (-y * MAX_X) + 'deg');
    activeCard.style.setProperty('--tilt-y', (x  * MAX_Y) + 'deg');
  }, { passive: true });
})();


/* ═══════════════════════════════════════════════════════════
  11. CONTACT FORM
   Validates fields, shows inline errors, displays success msg.
   Wires to a Formspree endpoint if FORM_ACTION is set.
═══════════════════════════════════════════════════════════ */
(function initContactForm() {
  const sendBtn  = document.getElementById('send-btn');
  const btnText  = document.getElementById('btn-text');
  const successMsg = document.getElementById('fok');
  if (!sendBtn) return;

  /* ── Helpers ── */
  function getVal(id) { return (document.getElementById(id)?.value ?? '').trim(); }
  function setErr(id, msg) {
    const el = document.getElementById(id + '-err');
    if (el) el.textContent = msg;
    document.getElementById(id)?.classList.toggle('invalid', !!msg);
  }
  function clearErr(id) { setErr(id, ''); }
  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  /* Clear errors on input */
  ['fn', 'fe', 'fm'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => clearErr(id));
  });

  sendBtn.addEventListener('click', async () => {
    /* Validate */
    const name    = getVal('fn');
    const email   = getVal('fe');
    const message = getVal('fm');

    let valid = true;

    if (!name)              { setErr('fn', 'Name is required.');          valid = false; }
    if (!email)             { setErr('fe', 'Email is required.');          valid = false; }
    else if (!isValidEmail(email)) { setErr('fe', 'Enter a valid email.'); valid = false; }
    if (!message)           { setErr('fm', 'Message cannot be empty.');    valid = false; }

    if (!valid) return;

    /* Loading state */
    sendBtn.disabled  = true;
    btnText.textContent = 'Sending…';

    const FORM_ACTION = 'https://script.google.com/macros/s/AKfycbzu1t3RFX4HSp7L0mL4u2kOeown_FVxqrqnIYer-kR66BeYRRBU2ftrzDL5JA45mMu6/exec';

    if (FORM_ACTION) {
      try {
        /*
         * Google Apps Script needs FormData with mode:'no-cors'.
         * - Do NOT set Content-Type manually (browser sets multipart boundary).
         * - Do NOT use JSON — Apps Script reads e.parameter.* from form fields.
         * - mode:'no-cors' avoids the CORS preflight that Apps Script rejects.
         * - Response will be opaque (status 0) — expected, not an error.
         */
        const fd = new FormData();
        fd.append('name',    name);
        fd.append('email',   email);
        fd.append('subject', getVal('fs') || '(no subject)');
        fd.append('message', message);

        await fetch(FORM_ACTION, {
          method: 'POST',
          mode:   'no-cors',
          body:   fd,
        });
      } catch (err) {
        console.error('Form submit error:', err);
        btnText.textContent = 'Send Message';
        sendBtn.disabled    = false;
        alert('Something went wrong. Please try again or email me directly.');
        return;
      }
    } else {
      await new Promise(r => setTimeout(r, 800));
    }

    /* Success */
    successMsg.classList.add('on');
    btnText.textContent = 'Send Message';
    sendBtn.disabled    = false;

    /* Clear fields */
    ['fn', 'fe', 'fs', 'fm'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.value = ''; clearErr(id); }
    });

    /* Auto-hide success message */
    setTimeout(() => successMsg.classList.remove('on'), 7000);
  });
})();


/* ═══════════════════════════════════════════════════════════
  12. BACK-TO-TOP BUTTON
   Shows after 400px scroll, scrolls to top on click.
═══════════════════════════════════════════════════════════ */
(function initBackToTop() {
  const btn = document.getElementById('back-top');
  if (!btn) return;

  const onScroll = debounce(() => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, 100);

  window.addEventListener('scroll', onScroll, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();


/* ═══════════════════════════════════════════════════════════
  13. LET'S TALK — Scroll to contact form message field
   Clicking "Let's talk" in Services scrolls to #contact and
   focuses the message textarea for a seamless UX.
═══════════════════════════════════════════════════════════ */
(function initLetsTalkButtons() {
  const btns = document.querySelectorAll('.sv-talk-btn');
  const msgField = document.getElementById('fm');
  if (!btns.length || !msgField) return;

  btns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Focus the message textarea after scroll animation completes
        setTimeout(() => {
          msgField.focus({ preventScroll: true });
          // Add a brief highlight effect
          msgField.style.transition = 'box-shadow 0.3s ease';
          msgField.style.boxShadow = '0 0 0 2px var(--neon, #00e5ff)';
          setTimeout(() => { msgField.style.boxShadow = ''; }, 1500);
        }, 700);
      }
    });
  });
})();