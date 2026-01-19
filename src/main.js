import './styles.css';

/**
 * Tide & Grind — WOW Experience Script
 * A cinematic, performance-focused interaction layer.
 *
 * DESIGN PHILOSOPHY:
 * - JS is the conductor, CSS is the orchestra.
 * - Physics-based movement (lerp) for smooth feels.
 * - Observers for efficiency.
 * - Respects the user (accessibility/reduced motion).
 */

  "use strict";

  // --- CONFIGURATION ---
  const CONFIG = {
    motion: {
      lerp: 0.1, // Linear interpolation factor (lower = smoother/slower)
      parallax: 0.08, // Parallax strength
      spotlight: 0.15, // Spotlight tracking speed
    },
    thresholds: {
      reveal: 0.15, // Intersection ratio to trigger reveal
      active: 0.5, // Intersection ratio to trigger active state
    },
    timings: {
      introStart: 700,
      introText: 1000,
      introScroll: 1400,
    },
  };

  // --- STATE ---
  const state = {
    mouse: { x: 0, y: 0, vx: 0, vy: 0 }, // Position + Velocity
    scroll: { current: 0 },
    pressure: { current: 0, target: 0 }, // New state for heavy easing
    isTouch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
    activeProduct: null,
  };

  // --- DOM CACHE ---
  const dom = {
    body: document.body,
    html: document.documentElement,
    header: document.querySelector(".site-header"),
    heroStatement: document.querySelector(".hero-statement"),
    heroSubtext: document.querySelector(".hero-subtext"),
    scrollIndicator: document.querySelector(".scroll-indicator"),
    productSections: document.querySelectorAll("[data-product]"),
    revealElements: document.querySelectorAll("[data-reveal]"),
    navToggle: document.querySelector(".mobile-nav-toggle"),
    navMenu: document.querySelector(".main-nav"),
    cursorGlow: document.querySelector(".cursor-glow"), // Optional
    magneticElements: document.querySelectorAll("[data-magnetic]"), // Optional
    scrollProgress: document.querySelector(".scroll-progress"), // Optional
  };

  // --- UTILS ---
  const lerp = (start, end, factor) => start + (end - start) * factor;
  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

  // --- 1. CINEMATIC PAGE INTRO ---
  function initIntro() {
    if (state.prefersReducedMotion) {
      // Instant reveal
      document.documentElement.classList.add("is-loaded");
      if (dom.header) dom.header.style.opacity = "1";
      return;
    }

    // a) Header Reveal
    setTimeout(() => {
      if (dom.header) dom.header.classList.add("is-visible");
      document.documentElement.classList.add("intro-step-1");
    }, CONFIG.timings.introStart);

    // b) Hero Split Reveal
    setTimeout(() => {
      if (dom.heroStatement) dom.heroStatement.classList.add("is-visible");
      if (dom.heroSubtext) dom.heroSubtext.classList.add("is-visible");
      document.documentElement.classList.add("intro-step-2");
    }, CONFIG.timings.introText);

    // c) Scroll Indicator
    setTimeout(() => {
      if (dom.scrollIndicator) dom.scrollIndicator.classList.add("is-visible");
    }, CONFIG.timings.introScroll);
  }

  // --- 2. ADVANCED SCROLL REVEAL ---
  function initScrollReveal() {
    // Fallback for reduced motion or basic browsers
    if (state.prefersReducedMotion) {
      dom.revealElements.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;

            // Stagger delay based on intersection timing or index if possible,
            // but simple is robust.
            el.classList.add("is-visible");

            // Cleanup
            observer.unobserve(el);
          }
        });
      },
      {
        threshold: CONFIG.thresholds.reveal,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    dom.revealElements.forEach((el) => observer.observe(el));
  }

  // --- 3. ACTIVE PRODUCT SCENE SYSTEM ---
  function initProductObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = entry.target;
            const productName = section.dataset.product;

            // Update Active State
            dom.productSections.forEach((s) => s.classList.remove("is-active"));
            section.classList.add("is-active");

            // Update Body Metadata
            if (state.activeProduct !== productName) {
              state.activeProduct = productName;
              document.body.dataset.activeProduct = productName;

              // Optional Title Update
              if (productName) {
                const formattedName = productName
                  .replace("-", " ")
                  .toUpperCase();
                // Only update if not already there to avoid flashing
                if (!document.title.includes(formattedName)) {
                  // Keep it subtle, maybe nice to have, maybe overkill.
                  // Commented out to be safe/calm.
                  // document.title = `Tide & Grind — ${formattedName}`;
                }
              }
            }
          }
        });
      },
      {
        threshold: CONFIG.thresholds.active,
      },
    );

    dom.productSections.forEach((section) => observer.observe(section));
  }

  // --- EXIT ANIMATION (The Goodbye) ---
  function initFooterObserver() {
    const footer = document.querySelector('.site-footer');
    if (!footer) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          document.body.classList.add('is-footer-visible');
        } else {
          document.body.classList.remove('is-footer-visible');
        }
      });
    }, { threshold: 0.2 }); // Trigger early to start the exhale

    observer.observe(footer);
  }

  // --- 4 & 5. MOTION LOOP (Parallax + Spotlight + Cursor) ---
  // Using a single rAF loop for performance

  let currentScroll = window.scrollY;
  let targetScroll = window.scrollY;

  // Mouse tracking
  let mouseX = 0;
  let mouseY = 0;
  let targetMouseX = 0;
  let targetMouseY = 0;

  function onMouseMove(e) {
    // Normalize 0-1
    targetMouseX = e.clientX;
    targetMouseY = e.clientY;

    // Spotlight local coordinates
    if (!state.isTouch && !state.prefersReducedMotion) {
      dom.productSections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const x = (e.clientX - rect.left) / rect.width;
          const y = (e.clientY - rect.top) / rect.height;
          section.style.setProperty("--mx", x.toFixed(3));
          section.style.setProperty("--my", y.toFixed(3));
        }
      });
    }
  }

  function updateParallax() {
    if (state.prefersReducedMotion || state.isTouch) return;

    // Iterate only over the ACTIVE section for performance
    dom.productSections.forEach((section) => {
      if (!section.classList.contains("is-active")) return;

      // Calculate distance from center of viewport
      const rect = section.getBoundingClientRect();
      const center = window.innerHeight / 2;
      const sectionCenter = rect.top + rect.height / 2;
      const dist = sectionCenter - center;

      // Apply slight vertical shift based on distance
      // Clamped to avoid extreme values
      const yHero = clamp(dist * CONFIG.motion.parallax, -50, 50);
      const yMedia = clamp(dist * (CONFIG.motion.parallax * 1.5), -80, 80);

      // Set CSS Vars
      section.style.setProperty("--p-hero-y", `${yHero.toFixed(2)}px`);
      section.style.setProperty("--p-media-y", `${yMedia.toFixed(2)}px`);
    });
  }

  function updateCursorGlow() {
    if (!dom.cursorGlow || state.isTouch || state.prefersReducedMotion) return;

    // Lerp mouse position
    mouseX = lerp(mouseX, targetMouseX, 0.15);
    mouseY = lerp(mouseY, targetMouseY, 0.15);

    // Velocity approximation
    const vx = Math.abs(targetMouseX - mouseX);
    const vy = Math.abs(targetMouseY - mouseY);
    const v = Math.min(vx + vy, 50); // Cap velocity

    dom.cursorGlow.style.setProperty("--cx", `${mouseX.toFixed(1)}px`);
    dom.cursorGlow.style.setProperty("--cy", `${mouseY.toFixed(1)}px`);
    dom.cursorGlow.style.setProperty("--cv", `${v.toFixed(1)}`);
  }

  function updateScrollProgress() {
    // Calculate total scrollable height
    const limit = document.body.scrollHeight - window.innerHeight;
    // Current scroll 0-1
    const progress = clamp(currentScroll / limit, 0, 1);

    document.body.style.setProperty("--scroll-progress", progress.toFixed(4));

    // Compact Header Logic (Sticky Header)
    if (currentScroll > 100) {
      dom.header?.classList.add("is-scrolled");
    } else {
      dom.header?.classList.remove("is-scrolled");
    }
  }

  function updateBurrGeometry() {
    if (state.prefersReducedMotion) return;

    // Find Stonewave section (cached ideally, but doing it here for clarity)
    const grinderSection = document.querySelector('[data-product="stonewave"]');
    if (!grinderSection) return;

    const rect = grinderSection.getBoundingClientRect();
    const height = window.innerHeight;

    // Check if visible
    if (rect.top < height && rect.bottom > 0) {
      // progress: 0 (enter bottom) -> 0.5 (center) -> 1 (exit top)
      const progress = 1 - (rect.bottom / (rect.height + height));

      // Opacity: Bell curve (starts 0, peaks at 0.5, ends 0)
      // Math.sin(progress * Math.PI) gives exactly that.
      const opacity = Math.sin(clamp(progress, 0, 1) * Math.PI);

      // Rotation: Continuous
      const rotation = progress * 360;

      grinderSection.style.setProperty('--burr-opacity', opacity.toFixed(3));
      grinderSection.style.setProperty('--burr-rotate', `${rotation.toFixed(1)}deg`);
    }
  }

  function updatePressureGauge() {
    if (state.prefersReducedMotion) return;

    const section = document.querySelector('[data-product="mariner-9"]');
    if (!section) return;

    // Calculate Target based on Scroll
    const rect = section.getBoundingClientRect();
    const height = window.innerHeight;

    let target = 0;
    // Logic: 0 at entry, 1 at center, hold or fade out?
    // Let's make it build continuously as you scroll through.
    // 0 (enter bottom) -> 1 (exit top)
    if (rect.top < height && rect.bottom > 0) {
      const progress = 1 - rect.bottom / (rect.height + height);
      target = clamp(progress, 0, 1);
    }

    // Heavy Easing (Lerp with very low factor for mass)
    // Lerp factor 0.03 is very slow/heavy
    state.pressure.current = lerp(state.pressure.current, target, 0.03);

    // Apply
    section.style.setProperty(
      "--pressure-level",
      state.pressure.current.toFixed(4),
    );
  }

  function renderLoop() {
    currentScroll = window.scrollY; // Read directly for accuracy in passive scroll

    updateParallax();
    updateCursorGlow();
    updateBurrGeometry();
    updatePressureGauge(); // New hook
    updateScrollProgress();

    requestAnimationFrame(renderLoop);
  }

  // --- 6. MAGNETIC BUTTONS (Optional) ---
  function initMagnetics() {
    if (
      state.isTouch ||
      state.prefersReducedMotion ||
      dom.magneticElements.length === 0
    )
      return;

    dom.magneticElements.forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);

        el.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
      });

      el.addEventListener("mouseleave", () => {
        el.style.transform = `translate(0px, 0px)`;
      });
    });
  }

  // --- 9. MOBILE NAVIGATION ---
  function initMobileNav() {
    if (!dom.navToggle || !dom.navMenu) return;

    const focusableElements = dom.navMenu.querySelectorAll("a[href], button");
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    function toggleMenu() {
      const isExpanded = dom.navToggle.getAttribute("aria-expanded") === "true";
      dom.navToggle.setAttribute("aria-expanded", !isExpanded);
      dom.html.classList.toggle("nav-open");

      // Lock body scroll
      if (!isExpanded) {
        state.lastScrollPosition = window.scrollY;
        document.body.style.overflow = "hidden";
        // Focus trap
        setTimeout(() => firstFocusable?.focus(), 100);
      } else {
        document.body.style.overflow = "";
        dom.navToggle.focus();
      }
    }

    dom.navToggle.addEventListener("click", toggleMenu);

    // Close on Link Click
    dom.navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (dom.navToggle.getAttribute("aria-expanded") === "true") {
          toggleMenu();
        }
      });
    });

    // Keyboard Trap
    dom.navMenu.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      } else if (e.key === "Escape") {
        toggleMenu();
      }
    });
  }

  // --- 5. SMOOTH ANCHOR LINKING ---
  // Native scroll-behavior: smooth in CSS is usually enough, but for control:
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        const targetId = this.getAttribute("href");
        if (targetId === "#") return;

        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({
            behavior: state.prefersReducedMotion ? "auto" : "smooth",
          });
        }
      });
    });
  }

  // --- INITIALIZATION ---
  function init() {
    initIntro();
    initScrollReveal();
    initProductObserver();
        initMobileNav();
        initMagnetics();
        initSmoothScroll();
        initFooterObserver();
        
        // Start Loop
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    requestAnimationFrame(renderLoop);

    console.log("Tide & Grind: Exhibition initialized.");
  }

  // Run when DOM valid
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
