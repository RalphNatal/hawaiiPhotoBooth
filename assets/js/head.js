// assets/js/head.js — design tokens and component classes for the Tailwind Play CDN.
//
// LOAD ORDER MATTERS. This must be a plain <script src> (NOT defer/async) placed
// IMMEDIATELY AFTER the Tailwind CDN tag:
//
//   <script src="https://cdn.tailwindcss.com/3.4.16"></script>
//   <script src="assets/js/head.js"></script>
//
// The CDN build assigns `window.tailwind = new Proxy({ config: {}, ... })` when it
// runs, unconditionally — anything set on window.tailwind BEFORE it is thrown
// away. Assigning `tailwind.config` AFTER it goes through that Proxy's setter,
// which triggers a rebuild with our tokens. Deferring this file means every
// custom colour class renders unstyled until the deferred script finally runs.
//
// The <style type="text/tailwindcss"> block below is picked up by the CDN's
// MutationObserver as soon as it is appended.

tailwind.config = {
  theme: {
    extend: {
      colors: {
        // ── Surfaces, darkest to lightest. On dark, elevation is communicated
        //    by LIGHTNESS, not shadow — box shadows are near-invisible here.
        abyss: '#05131C', // page background — blue-black, never pure black
        ink:   '#0A2130', // raised: cards, solid nav, form fields
        ocean: '#14394B', // higher: hover states, active tiles, printer chassis
        reef:  '#1E5266', // highest + heavy borders; use sparingly

        // ── Content ──
        sand:  '#E8DDC8', // PRIMARY BODY TEXT — warm off-white, never pure white
        shell: '#FBF7F0', // h1/h2 only — the single brightest value on the page
        surf:  '#4FB3C7', // links, focus rings, accents
        gold:  '#D9A441', // CTA fill, hairline rules, active indicators
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};

// Component classes. Kept deliberately few: buttons, the raised surface, the
// text link, and the form field. Everything else is composed from utilities.
//
// Focus rings default to `ring-offset-abyss` (the page). Inside a card, add
// `focus-visible:ring-offset-ink` on the element — utilities beat this layer,
// so the override wins. A ring offset tuned for the wrong surface disappears.
const hbComponentStyles = document.createElement('style');
hbComponentStyles.type = 'text/tailwindcss';
hbComponentStyles.textContent = `@layer components {
  .btn-primary {
    @apply inline-flex items-center justify-center rounded-md bg-gold px-6 py-3.5
           text-[0.9375rem] font-medium leading-none text-ink
           transition hover:brightness-110
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surf
           focus-visible:ring-offset-2 focus-visible:ring-offset-abyss;
  }
  .btn-ghost {
    @apply inline-flex items-center justify-center rounded-md border border-white/15 px-6 py-3.5
           text-[0.9375rem] font-medium leading-none text-sand
           transition-colors hover:border-white/25 hover:bg-white/5
           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surf
           focus-visible:ring-offset-2 focus-visible:ring-offset-abyss;
  }
  .surface {
    @apply rounded-lg bg-ink ring-1 ring-white/10;
  }
  .link {
    @apply text-surf underline decoration-1 underline-offset-4 transition-colors hover:text-shell
           focus-visible:outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-surf
           focus-visible:ring-offset-2 focus-visible:ring-offset-abyss;
  }
  .field {
    @apply block w-full rounded-md bg-ink px-4 py-3 text-base text-sand ring-1 ring-white/10
           placeholder:text-sand/60
           focus:outline-none focus:ring-2 focus:ring-surf;
  }
}`;
document.head.appendChild(hbComponentStyles);
