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
      '.project-card',
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
  // 7. Blog Article System
  // ──────────────────────────────────────────────

  /**
   * Full article content database. Each entry maps to a
   * `data-article` slug on the blog index cards.
   */
  const articleData = {
    'agentic-workflows': {
      title: 'Why Agentic Workflows Will Replace Traditional Automation',
      date: 'May 2026',
      tag: 'AI',
      body: `
        <p>The automation landscape is undergoing a fundamental phase transition. For decades, we've built systems around deterministic pipelines — <strong>if X, then Y</strong>. These rule-based workflows are brittle, context-blind, and scale linearly at best.</p>

        <h2>The Deterministic Ceiling</h2>
        <p>Traditional automation tools — Zapier, Airflow, Jenkins — excel at repeatable, well-defined tasks. But the moment context shifts, they shatter. A pipeline that processes invoices can't adapt when the format changes. A CI/CD system can't reason about <em>why</em> a test failed.</p>
        <p>This is the deterministic ceiling: the point at which adding more rules produces diminishing returns and exponentially more edge cases.</p>

        <h2>Enter Agentic Reasoning</h2>
        <p>Agentic workflows replace rigid rules with reasoning loops. Instead of pre-programmed paths, agents receive <strong>goals</strong> and dynamically plan their execution strategy. The architecture looks fundamentally different:</p>
        <pre><code>// Traditional pipeline
input → transform → validate → output

// Agentic workflow
goal → plan → execute → observe → replan → execute → ...</code></pre>
        <p>The key insight is the <strong>observe → replan</strong> loop. Agents don't just execute — they evaluate their own output, detect failures, and self-correct without human intervention.</p>

        <h2>The Architecture Stack</h2>
        <p>A production-grade agentic system requires several interleaved components:</p>
        <ul>
          <li><strong>Planner:</strong> Decomposes high-level goals into ordered sub-tasks</li>
          <li><strong>Executor:</strong> Runs each sub-task with tool access and memory</li>
          <li><strong>Evaluator:</strong> Scores output quality and decides whether to proceed or retry</li>
          <li><strong>Memory layer:</strong> Maintains conversation state and learned context across runs</li>
        </ul>

        <blockquote>The best automation doesn't just do what you tell it — it figures out what you meant.</blockquote>

        <h2>What This Means for Engineers</h2>
        <p>If you're building automation today, the most valuable skill you can develop is <strong>designing for ambiguity</strong>. Systems that can handle imprecise inputs, recover from partial failures, and improve over time will define the next generation of infrastructure.</p>
        <p>The deterministic pipeline isn't dead — it's becoming a leaf node in a larger, intelligent graph.</p>
      `
    },

    'design-system': {
      title: 'Building a Design System From Scratch',
      date: 'Apr 2026',
      tag: 'Design',
      body: `
        <p>Every mature product eventually needs a design system. Not a component library — a <strong>system</strong>. The difference is foundational: a library gives you buttons; a system gives you the language to reason about why those buttons look and behave the way they do.</p>

        <h2>Tokens Over Themes</h2>
        <p>The foundation of any scalable design system is a well-structured token layer. Tokens are the atomic values — colors, spacing, typography, radii — that every component inherits from.</p>
        <pre><code>:root {
  --bg:           #0A0A0A;
  --container-bg: #121212;
  --border:       #1F1F1F;
  --white:        #FFFFFF;
  --muted:        #888888;
  --accent:       #00A3FF;
  --radius:       16px;
}</code></pre>
        <p>When tokens are your single source of truth, changing the entire visual language of your product becomes a matter of updating a handful of CSS custom properties — not hunting through thousands of component files.</p>

        <h2>Constraint-Driven Composition</h2>
        <p>The best design systems are <em>constraining</em>, not permissive. Every decision that a component consumer doesn't have to make is a decision that can't be made incorrectly. Limit spacing to a defined scale. Restrict typography to a curated set. Make consistency the path of least resistance.</p>

        <h2>The CSS Architecture</h2>
        <p>I advocate for a layered approach:</p>
        <ul>
          <li><strong>Layer 1 — Reset:</strong> Normalize browser defaults</li>
          <li><strong>Layer 2 — Tokens:</strong> Custom properties for all design values</li>
          <li><strong>Layer 3 — Base:</strong> Element-level styles (typography, links, lists)</li>
          <li><strong>Layer 4 — Components:</strong> Scoped, reusable UI patterns</li>
          <li><strong>Layer 5 — Utilities:</strong> Single-purpose overrides, used sparingly</li>
        </ul>

        <blockquote>A design system should make the right thing easy and the wrong thing hard.</blockquote>

        <p>Ship the tokens first. The components will follow naturally.</p>
      `
    },

    'swiftui-uikit': {
      title: 'SwiftUI vs UIKit in 2026: The Verdict',
      date: 'Mar 2026',
      tag: 'iOS',
      body: `
        <p>After shipping three production apps — two in SwiftUI, one in UIKit with SwiftUI islands — I have a clear picture of where each framework excels and where it falls apart.</p>

        <h2>SwiftUI's Strengths</h2>
        <p>SwiftUI is <strong>unmatched for velocity</strong>. Building a settings screen, onboarding flow, or data-display view takes a fraction of the time compared to UIKit. The declarative model eliminates entire categories of bugs — no more forgotten layout constraints, no more stale state in table view cells.</p>
        <pre><code>// A complete, functional list in SwiftUI
List(items) { item in
  HStack {
    Text(item.name)
    Spacer()
    Text(item.status)
      .foregroundStyle(.secondary)
  }
}</code></pre>

        <h2>Where UIKit Still Wins</h2>
        <p>Complex, interaction-heavy interfaces — custom gestures layered on top of scroll views, pixel-perfect animations, or anything requiring fine-grained control over the render loop — still belong in UIKit. SwiftUI's animation system is elegant for simple cases but becomes opaque when you need precise timing curves or interruptible transitions.</p>

        <h2>The Hybrid Approach</h2>
        <p>The pragmatic answer in 2026 is <strong>both</strong>. Use SwiftUI for the shell — navigation, settings, simple views. Drop into UIKit via <code>UIViewRepresentable</code> for anything requiring control that SwiftUI's abstraction layer hides. The interop is mature enough that this isn't a compromise — it's a strategy.</p>

        <blockquote>Choose your framework based on the complexity of your interactions, not the year on the calendar.</blockquote>
      `
    },

    'minimalism-arch': {
      title: 'On Minimalism in Software Architecture',
      date: 'Feb 2026',
      tag: 'Engineering',
      body: `
        <p>There's a disease in software engineering that masquerades as sophistication: <strong>premature abstraction</strong>. We build factories for factories, wrap every dependency in three layers of indirection, and call it "clean architecture." Often, it's just complexity cosplaying as elegance.</p>

        <h2>The Cost of Indirection</h2>
        <p>Every abstraction has a carrying cost. It's cognitive load for the next developer. It's a junction where bugs can hide. It's an additional layer between you and the actual behavior of your system. The question isn't whether an abstraction is <em>possible</em> — it's whether the abstraction <em>pays for itself</em>.</p>

        <h2>Rules of Minimalist Architecture</h2>
        <ul>
          <li><strong>Inline until it hurts.</strong> Don't extract a function until you've duplicated it three times. Don't create a service until the logic has earned its own file.</li>
          <li><strong>Prefer boring technology.</strong> The most reliable system is the one built on tools your team already understands.</li>
          <li><strong>Delete aggressively.</strong> Dead code isn't harmless — it's a lie about what the system does.</li>
          <li><strong>Optimize for deletion.</strong> Write code that's easy to remove. Loosely coupled modules can be ripped out without surgery.</li>
        </ul>

        <h2>Complexity as a Ratchet</h2>
        <p>Complexity only ratchets in one direction. Every dependency you add, every config option you expose, every abstraction you introduce makes the system harder to change. The goal isn't zero complexity — it's <strong>appropriate</strong> complexity. Every moving part should earn its place.</p>

        <blockquote>Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away. — Antoine de Saint-Exupéry</blockquote>

        <p>Build less. Ship more. Delete what doesn't matter.</p>
      `
    },

    'local-first-ai': {
      title: 'The Case for Local-First AI',
      date: 'Jan 2026',
      tag: 'AI',
      body: `
        <p>The default assumption in AI deployment is cloud-first: send your data to an API, wait for inference, receive a response. This model works — until it doesn't. Latency spikes, privacy concerns, rate limits, and offline requirements all point toward the same conclusion: <strong>the model needs to be where the data is.</strong></p>

        <h2>The Privacy Imperative</h2>
        <p>Every API call is a data exfiltration event. Medical records, legal documents, financial data, personal conversations — the moment they leave the device, you've introduced a trust boundary that's impossible to fully secure. Local inference eliminates this boundary entirely.</p>

        <h2>The Latency Argument</h2>
        <p>Even the fastest cloud APIs introduce 200-500ms of round-trip latency. For real-time applications — code completion, voice assistants, camera overlays — this is unacceptable. Local models running on optimized runtimes can deliver sub-50ms inference on consumer hardware.</p>
        <pre><code>// Comparison: cloud vs. local inference latency
Cloud API:   ~350ms avg (p99: 800ms)
Local ONNX:  ~28ms avg  (p99: 45ms)
Local Metal: ~12ms avg  (p99: 22ms)</code></pre>

        <h2>The Hardware Inflection Point</h2>
        <p>Apple Silicon, Qualcomm's Hexagon NPU, and Intel's Meteor Lake neural engines have made on-device inference not just viable but performant. Quantized 7B parameter models run fluently on devices that fit in your pocket. We've crossed the hardware threshold — the bottleneck is now software tooling.</p>

        <h2>What Needs to Change</h2>
        <ul>
          <li><strong>Model distribution:</strong> We need package managers for models, not just weights on HuggingFace</li>
          <li><strong>Runtime standardization:</strong> ONNX, Core ML, TFLite — the fragmentation is real</li>
          <li><strong>Update mechanisms:</strong> Models need OTA updates without shipping new app binaries</li>
        </ul>

        <blockquote>The future of AI isn't in the cloud — it's in your pocket, offline, and private by default.</blockquote>
      `
    },

    'first-production-app': {
      title: 'Lessons from Shipping My First Production App',
      date: 'Dec 2025',
      tag: 'Career',
      body: `
        <p>Shipping code to production for the first time is a humbling experience. Everything you thought you knew about software development gets stress-tested by real users, real infrastructure, and real deadlines. Here's what I learned.</p>

        <h2>Lesson 1: Perfect Is the Enemy of Shipped</h2>
        <p>I spent three weeks refactoring an authentication flow that already worked. By the time I was "satisfied," a competitor had launched a similar feature. The refactored code was technically superior. It also didn't matter — because it wasn't in anyone's hands.</p>
        <p><strong>Ship the ugly version. Refactor under load.</strong></p>

        <h2>Lesson 2: Users Break Everything</h2>
        <p>I tested every flow I could imagine. Users found flows I couldn't. Someone entered a 500-character name. Someone uploaded a 200MB profile photo. Someone navigated back mid-upload and corrupted their data. Every assumption about "reasonable" user behavior was wrong.</p>

        <h2>Lesson 3: Monitoring > Testing</h2>
        <p>Unit tests catch known failure modes. Monitoring catches the unknown ones. I had 85% test coverage and still got blindsided by a production issue that no test could have predicted — a third-party API changed its response format on a Friday at 11 PM.</p>
        <pre><code>// What I wish I'd had from day one:
- Error tracking (Sentry / Crashlytics)
- Structured logging (not console.log)
- Uptime monitoring with alerts
- Real-time user analytics</code></pre>

        <h2>Lesson 4: Let Go of Your Code</h2>
        <p>The hardest lesson: your code is not your identity. When a user reports a bug, they're not criticizing you — they're giving you free QA. When a colleague rewrites your module, they're not saying you failed — they're saying the system evolved. Detach your ego from your commits.</p>

        <blockquote>The best engineers I know ship imperfect code confidently, fix it quickly, and never make the same mistake twice.</blockquote>

        <p>Build. Ship. Learn. Repeat.</p>
      `
    }
  };

  /**
   * Initialises the blog article system. Handles:
   * - Click events on blog entries → show article view
   * - Back link → return to index view
   * - Hash-based routing for direct article links
   */
  const initBlogArticles = () => {
    const indexView   = document.getElementById('blog-index-view');
    const articleView = document.getElementById('article-view');
    const backLink    = document.getElementById('article-back-link');

    // Only run on the blog page
    if (!indexView || !articleView) return;

    const titleEl = document.getElementById('article-title');
    const dateEl  = document.getElementById('article-date');
    const tagEl   = document.getElementById('article-tag');
    const bodyEl  = document.getElementById('article-body');

    /**
     * Show a specific article by slug.
     */
    const showArticle = (slug) => {
      const data = articleData[slug];
      if (!data) return;

      titleEl.textContent = data.title;
      dateEl.textContent  = data.date;
      tagEl.textContent   = data.tag;
      bodyEl.innerHTML    = data.body;

      indexView.style.display   = 'none';
      articleView.style.display = 'block';

      // Re-trigger the fade-in animation
      const inner = articleView.querySelector('.article-view-inner');
      if (inner) {
        inner.style.animation = 'none';
        // Force reflow
        void inner.offsetHeight;
        inner.style.animation = '';
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    /**
     * Return to the blog index.
     */
    const showIndex = () => {
      articleView.style.display = 'none';
      indexView.style.display   = 'block';
      history.pushState(null, '', 'blog.html');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Wire up blog entry clicks
    const entries = document.querySelectorAll('.blog-entry[data-article]');
    entries.forEach((entry) => {
      entry.addEventListener('click', (e) => {
        e.preventDefault();
        const slug = entry.getAttribute('data-article');
        history.pushState({ article: slug }, '', `blog.html#${slug}`);
        showArticle(slug);
      });
    });

    // Wire up back link
    if (backLink) {
      backLink.addEventListener('click', (e) => {
        e.preventDefault();
        showIndex();
      });
    }

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      const hash = window.location.hash.slice(1);
      if (hash && articleData[hash]) {
        showArticle(hash);
      } else {
        showIndex();
      }
    });

    // Check for direct article link on page load
    const initialHash = window.location.hash.slice(1);
    if (initialHash && articleData[initialHash]) {
      showArticle(initialHash);
    }
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
  initBlogArticles();
});
