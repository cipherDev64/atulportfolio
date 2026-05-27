'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ──────────────────────────────────────────────
  // 1. Fade-in on Scroll (Intersection Observer)
  // ──────────────────────────────────────────────

  /**
   * Observes every `.fade-in` element and adds the `visible`
   * class once it scrolls into the viewport (10 % visible).
   * If the element also carries `.stagger`, each of its direct
   * children receives an incremental animation-delay.
   */
  const initScrollFadeIn = () => {
    const faders = document.querySelectorAll('.fade-in');
    if (!faders.length) return;

    const observerOptions = {
      root: null,          // viewport
      threshold: 0.1,      // trigger at 10 % visibility
      rootMargin: '0px',
    };

    const fadeObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;

        // Stagger children if the element opts in
        if (el.classList.contains('stagger')) {
          [...el.children].forEach((child, i) => {
            child.style.animationDelay = `${i * 0.1}s`;
            child.style.transitionDelay = `${i * 0.1}s`;
          });
        }

        el.classList.add('visible');
        observer.unobserve(el); // animate only once
      });
    }, observerOptions);

    faders.forEach((el) => fadeObserver.observe(el));
  };


  // ──────────────────────────────────────────────
  // 2. Active Navigation Highlighting
  // ──────────────────────────────────────────────

  /**
   * Reads the current filename from the URL and marks the
   * corresponding nav link with an `active` class.
   * Acts as a JS fallback — the HTML pages already set the
   * class server-side, but this guarantees consistency.
   */
  const highlightActiveNav = () => {
    // Derive the current page filename (e.g. "about.html")
    const path = window.location.pathname;
    const currentPage = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;

      const linkPage = href.substring(href.lastIndexOf('/') + 1) || 'index.html';

      // Remove any previously set active class
      link.classList.remove('active');

      if (linkPage === currentPage) {
        link.classList.add('active');
      }
    });
  };


  // ──────────────────────────────────────────────
  // 3. Carousel Touch / Drag Support
  // ──────────────────────────────────────────────

  /**
   * Adds pointer-based (mouse + touch) drag-to-scroll
   * behaviour to every `.carousel-container` on the page.
   * On release the carousel snaps to the nearest item.
   */
  const initCarousels = () => {
    const containers = document.querySelectorAll('.carousel-container');
    if (!containers.length) return;

    containers.forEach((container) => {
      const track = container.querySelector('.carousel-track');
      if (!track) return;

      let isDown = false;
      let startX;
      let scrollLeft;

      // Prevent native image dragging within track
      track.querySelectorAll('img').forEach((img) => {
        img.addEventListener('dragstart', (e) => e.preventDefault());
      });

      track.addEventListener('mousedown', (e) => {
        isDown = true;
        track.classList.add('active');
        // Get absolute start position relative to viewport
        startX = e.pageX - track.offsetLeft;
        scrollLeft = track.scrollLeft;
        // Temporarily disable scroll snapping during drag for smooth feel
        track.style.scrollSnapType = 'none';
        track.style.scrollBehavior = 'auto';
      });

      const stopDragging = () => {
        if (!isDown) return;
        isDown = false;
        track.classList.remove('active');
        // Re-enable scroll snapping so it snaps nicely to nearest slide
        track.style.scrollSnapType = 'x mandatory';
        track.style.scrollBehavior = 'smooth';
      };

      track.addEventListener('mouseleave', stopDragging);
      track.addEventListener('mouseup', stopDragging);

      track.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - track.offsetLeft;
        const walk = (x - startX) * 1.5; // multiplier for drag speed
        track.scrollLeft = scrollLeft - walk;
      });
    });
  };


  // ──────────────────────────────────────────────
  // 4. Smooth Page Transitions
  // ──────────────────────────────────────────────

  /**
   * If the browser supports the View Transitions API the CSS
   * `@view-transition` rules handle everything automatically.
   * Otherwise we layer a lightweight fade-out class on every
   * internal navigation link so the transition feels smooth.
   */
  const initPageTransitions = () => {
    // If the browser already supports View Transitions, bail out —
    // the CSS `view-transition-name` declarations will take over.
    if (document.startViewTransition) return;

    // Fallback: intercept clicks on internal links
    const internalLinks = document.querySelectorAll('a[href]');

    internalLinks.forEach((link) => {
      const href = link.getAttribute('href');

      // Skip external, anchor, and javascript: links
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('javascript:')) {
        return;
      }

      link.addEventListener('click', (e) => {
        e.preventDefault();

        // Apply a fade-out to the page body
        document.body.classList.add('page-transition-out');

        // Navigate after the transition ends
        setTimeout(() => {
          window.location.href = href;
        }, 300); // matches the CSS transition duration
      });
    });

    // Fade the body in when the page first loads
    document.body.classList.add('page-transition-in');
  };


  // ──────────────────────────────────────────────
  // 5. Stagger Animation for Grid Items
  // ──────────────────────────────────────────────

  /**
   * Finds common grid/card elements and assigns each an
   * incremental `animation-delay` so they cascade into view.
   */
  const initStaggerAnimations = () => {
    const selectors = [
      '.bento-box',
      '.deck-item',
      '.capture-item',
      '.blog-entry',
    ];

    const items = document.querySelectorAll(selectors.join(', '));
    if (!items.length) return;

    items.forEach((item, index) => {
      item.style.animationDelay  = `${index * 0.1}s`;
      item.style.transitionDelay = `${index * 0.1}s`;
    });
  };


  // ──────────────────────────────────────────────
  // 6. Mobile Navigation Toggle
  // ──────────────────────────────────────────────

  /**
   * Dynamically injects a hamburger button for small screens.
   * Toggles `.nav-open` on the `.nav-links` list so CSS can
   * slide/fade the menu in and out.
   */
  const initMobileNav = () => {
    const nav      = document.querySelector('.site-nav');
    const navInner = document.querySelector('.nav-inner');
    const navLinks = document.querySelector('.nav-links');
    if (!nav || !navInner || !navLinks) return;

    // Create the hamburger toggle button
    const burger = document.createElement('button');
    burger.classList.add('nav-toggle');
    burger.setAttribute('aria-label', 'Toggle navigation');
    burger.setAttribute('aria-expanded', 'false');
    burger.innerHTML = `
      <span></span>
      <span></span>
      <span></span>
    `;

    // Insert the button at the end of .nav-inner (after nav-links)
    navInner.appendChild(burger);

    // Toggle handler
    const toggleMenu = () => {
      const isOpen = navLinks.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', String(isOpen));
      burger.classList.toggle('is-active', isOpen);
    };

    burger.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    // Close when a nav link is clicked
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.classList.remove('is-active');
      });
    });

    // Close when clicking outside the nav
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && navLinks.classList.contains('nav-open')) {
        navLinks.classList.remove('nav-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.classList.remove('is-active');
      }
    });
  };


  // ──────────────────────────────────────────────
  // Initialise everything
  // ──────────────────────────────────────────────

  highlightActiveNav();
  initMobileNav();
  initStaggerAnimations();
  initScrollFadeIn();      // must come after stagger delays are set
  initCarousels();
  initPageTransitions();
});
