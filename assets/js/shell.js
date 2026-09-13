// assets/js/shell.js — the shared shell: <hb-nav>, <hb-footer>, and the one
// place booking URLs live. Loaded with `defer` from every page.
//
// Both elements render into the LIGHT DOM, not shadow DOM: Tailwind utilities
// are global styles and would not cross a shadow boundary.
//
// Every internal href here is RELATIVE (no leading slash). A GitHub Pages
// project site serves from a subpath, and "/pricing.html" 404s there.
//
// If real templating is ever wanted, the migration path is Astro or Eleventy —
// these two components are the only things that would move into a layout.

// ─────────────────────────────────────────────────────────────────────────────
// Booking
// ─────────────────────────────────────────────────────────────────────────────
// Booking runs through an external catalog. Every "Book now" on the site reads
// its href from this object via hydrateBookingLinks(), so a changed catalog URL
// is a one-line edit. Pages write:
//
//   <a data-book="photo" href="contact.html">Book now</a>
//
// The static href is the no-JS fallback; with JS the link opens the catalog in
// a new tab with rel="noopener".
const BOOKING_URLS = {
  photo:     'https://app.calledpresentations.com/catalog/digital-photo-booth-1775795439936163',
  // TODO(client): the current site links the 360 booth to two different catalog
  // URLs depending on which page you are on. This is the one supplied in the
  // spec — the client must confirm which is current.
  video360:  'https://app.calledpresentations.com/catalog/360-video-booth-1775893554057203',
  // TODO(client): no separate catalog entry was supplied for the 360 Sky booth.
  // It uses the 360 booth URL until the client provides one.
  sky360:    'https://app.calledpresentations.com/catalog/360-video-booth-1775893554057203',
  glambot:   'https://app.calledpresentations.com/catalog/robot-glambot-1775897086536236',
  audio:     'https://app.calledpresentations.com/catalog/audio-guest-book-phone-1775896060337702',
  slideshow: 'https://app.calledpresentations.com/catalog/slideshow-1760139383453393',
};

function hydrateBookingLinks(root = document) {
  root.querySelectorAll('a[data-book]').forEach((a) => {
    const url = BOOKING_URLS[a.dataset.book];
    if (!url) {
      console.warn(`[shell] unknown data-book key "${a.dataset.book}"`);
      return;
    }
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Site map
// ─────────────────────────────────────────────────────────────────────────────
const CONTACT = {
  phone: '1-800-805-0920',
  phoneHref: 'tel:+18008050920',
  email: 'hawaiibooths@gmail.com',
  address: '2825 Ala Ilima St, Honolulu, HI 96818',
  mapsHref: 'https://maps.google.com/maps?q=2825+Ala+Ilima+St,+Honolulu,+HI+96818',
};

const BOOTHS = [
  { key: 'photo-booths', href: 'photo-booths.html', label: 'Photo booths',     blurb: 'Prints in hand, unlimited sessions' },
  { key: 'video-booths', href: 'video-booths.html', label: 'Video booths',     blurb: '360, 360 Sky and the Glambot' },
  { key: 'audio-booths', href: 'audio-booths.html', label: 'Audio guest book', blurb: 'Voicemails from your guests' },
  { key: 'services',     href: 'services.html',     label: 'Slideshow service', blurb: 'A seven-minute slideshow, built for you' },
];

const PRIMARY = [
  { key: 'pricing',  href: 'pricing.html',  label: 'Pricing' },
  { key: 'gallery',  href: 'gallery.html',  label: 'Gallery' },
  { key: 'calendar', href: 'calendar.html', label: 'Calendar' },
  { key: 'about',    href: 'about.html',    label: 'About' },
  { key: 'contact',  href: 'contact.html',  label: 'Contact' },
];

const TRY = { key: 'try-it-out', href: 'try-it-out.html', label: 'Try the booth' };

// ─────────────────────────────────────────────────────────────────────────────
// Shared class strings
// ─────────────────────────────────────────────────────────────────────────────
const FOCUS_ON_ABYSS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surf focus-visible:ring-offset-2 focus-visible:ring-offset-abyss';
const FOCUS_ON_INK   = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surf focus-visible:ring-offset-2 focus-visible:ring-offset-ink';

const NAV_LINK = `relative rounded-sm py-2 text-sm font-medium tracking-[0.01em] transition-colors ${FOCUS_ON_ABYSS}`;
const NAV_LINK_IDLE   = 'text-sand/80 hover:text-sand';
const NAV_LINK_ACTIVE = 'text-sand after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-gold';

const MENU_ITEM = `block rounded-md px-3 py-2.5 transition-colors hover:bg-ocean ${FOCUS_ON_INK}`;

const CHEVRON = `<svg class="h-4 w-4 transition-transform group-aria-expanded:rotate-180" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const MARK = `<svg class="h-[18px] w-[15px] shrink-0" viewBox="0 0 15 18" fill="none" aria-hidden="true"><rect x="0.75" y="0.75" width="13.5" height="16.5" rx="2" class="stroke-gold" stroke-width="1.5"/><rect x="3.5" y="3.5" width="8" height="7.5" rx="1" class="fill-gold/30"/></svg>`;

const current = (isActive) => (isActive ? ' aria-current="page"' : '');

// ─────────────────────────────────────────────────────────────────────────────
// <hb-nav active="pricing">
// ─────────────────────────────────────────────────────────────────────────────
class HbNav extends HTMLElement {
  connectedCallback() {
    const active = this.getAttribute('active') || '';
    const boothActive = BOOTHS.some((b) => b.key === active);

    const primaryLinks = PRIMARY.map((p) => {
      const isActive = p.key === active;
      return `<li><a href="${p.href}" class="${NAV_LINK} ${isActive ? NAV_LINK_ACTIVE : NAV_LINK_IDLE}"${current(isActive)}>${p.label}</a></li>`;
    }).join('');

    const boothMenuItems = BOOTHS.map((b) => {
      const isActive = b.key === active;
      return `<li role="none"><a role="menuitem" href="${b.href}" class="${MENU_ITEM}"${current(isActive)}>
        <span class="block text-sm font-medium ${isActive ? 'text-shell' : 'text-sand'}">${b.label}</span>
        <span class="block text-xs tracking-[0.01em] text-sand/60">${b.blurb}</span>
      </a></li>`;
    }).join('');

    const mobileLink = (item, extra = '') => {
      const isActive = item.key === active;
      return `<li><a href="${item.href}" class="block rounded-md px-3 py-2.5 text-base transition-colors hover:bg-ocean ${FOCUS_ON_INK} ${isActive ? 'text-shell' : 'text-sand'} ${extra}"${current(isActive)}>${item.label}</a></li>`;
    };

    this.innerHTML = `
      <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink">Skip to content</a>
      <header class="sticky top-0 z-40 border-b border-white/10 bg-abyss/85 backdrop-blur-md">
        <nav class="relative mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between px-6" aria-label="Main">
          <a href="index.html" class="flex items-center gap-2.5 rounded-sm font-display text-xl font-medium text-shell ${FOCUS_ON_ABYSS}"${current(active === 'home')}>
            ${MARK}<span>Hawaii Booths</span>
          </a>

          <ul class="hidden items-center gap-7 lg:flex">
            <li class="relative" data-dropdown>
              <button type="button" class="group flex items-center gap-1.5 ${NAV_LINK} ${boothActive ? NAV_LINK_ACTIVE : NAV_LINK_IDLE}"
                      aria-expanded="false" aria-haspopup="true" aria-controls="hb-booths-menu">
                Booths ${CHEVRON}
              </button>
              <ul id="hb-booths-menu" role="menu" aria-label="Booths"
                  class="absolute left-0 top-full mt-3 hidden w-72 rounded-lg bg-ink p-2 ring-1 ring-white/10">
                ${boothMenuItems}
              </ul>
            </li>
            ${primaryLinks}
            <li><a href="${TRY.href}" class="btn-primary !px-4 !py-2.5 !text-sm"${current(active === TRY.key)}>${TRY.label}</a></li>
          </ul>

          <button type="button" class="inline-flex h-10 w-10 items-center justify-center rounded-md text-sand lg:hidden ${FOCUS_ON_ABYSS}"
                  aria-expanded="false" aria-controls="hb-mobile-menu" data-mobile-toggle>
            <span class="sr-only">Menu</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true" data-icon-open><path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            <svg class="hidden h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true" data-icon-close><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          </button>
        </nav>

        <div id="hb-mobile-menu" class="hidden border-t border-white/10 bg-ink lg:hidden">
          <div class="mx-auto grid max-w-6xl gap-6 px-6 py-6 sm:grid-cols-2">
            <div>
              <p class="px-3 pb-1 text-xs font-medium tracking-[0.01em] text-sand/60">Booths</p>
              <ul>${BOOTHS.map((b) => mobileLink(b)).join('')}</ul>
            </div>
            <div>
              <p class="px-3 pb-1 text-xs font-medium tracking-[0.01em] text-sand/60">Plan your event</p>
              <ul>${PRIMARY.map((p) => mobileLink(p)).join('')}</ul>
              <div class="px-3 pt-4"><a href="${TRY.href}" class="btn-primary w-full focus-visible:ring-offset-ink">${TRY.label}</a></div>
            </div>
          </div>
        </div>
      </header>`;

    this.wireDropdown();
    this.wireMobileMenu();
  }

  // Desktop "Booths" dropdown. This is a menu, not a modal: no focus trap.
  // Escape closes it and returns focus to the trigger; clicking or tabbing
  // away just closes it.
  wireDropdown() {
    const wrap = this.querySelector('[data-dropdown]');
    const trigger = wrap.querySelector('button');
    const menu = wrap.querySelector('[role="menu"]');
    const items = () => [...menu.querySelectorAll('[role="menuitem"]')];

    const open = () => { menu.classList.remove('hidden'); trigger.setAttribute('aria-expanded', 'true'); };
    const close = ({ refocus = false } = {}) => {
      if (menu.classList.contains('hidden')) return;
      menu.classList.add('hidden');
      trigger.setAttribute('aria-expanded', 'false');
      if (refocus) trigger.focus();
    };
    const isOpen = () => !menu.classList.contains('hidden');

    trigger.addEventListener('click', () => (isOpen() ? close() : open()));

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); open(); items()[0]?.focus(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); open(); items().at(-1)?.focus(); }
    });

    menu.addEventListener('keydown', (e) => {
      const list = items();
      const i = list.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length].focus(); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); list[(i - 1 + list.length) % list.length].focus(); }
      if (e.key === 'Home')      { e.preventDefault(); list[0].focus(); }
      if (e.key === 'End')       { e.preventDefault(); list.at(-1).focus(); }
    });

    wrap.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); close({ refocus: true }); } });
    wrap.addEventListener('focusout', (e) => { if (!wrap.contains(e.relatedTarget)) close(); });
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) close(); });

    // Hover-open only for a fine pointer that can actually hover. Touch and
    // keyboard users get the click/arrow behaviour above.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      let closeTimer;
      wrap.addEventListener('mouseenter', () => { clearTimeout(closeTimer); open(); });
      wrap.addEventListener('mouseleave', () => { closeTimer = setTimeout(() => close(), 150); });
    }
  }

  // Mobile menu: a disclosure panel under the bar. Same rules — Escape closes
  // and returns focus to the toggle, no trap.
  wireMobileMenu() {
    const toggle = this.querySelector('[data-mobile-toggle]');
    const panel = this.querySelector('#hb-mobile-menu');
    const iconOpen = toggle.querySelector('[data-icon-open]');
    const iconClose = toggle.querySelector('[data-icon-close]');

    const setOpen = (on) => {
      panel.classList.toggle('hidden', !on);
      iconOpen.classList.toggle('hidden', on);
      iconClose.classList.toggle('hidden', !on);
      toggle.setAttribute('aria-expanded', String(on));
    };
    const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

    toggle.addEventListener('click', () => setOpen(!isOpen()));
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen()) { setOpen(false); toggle.focus(); }
    });

    // If the viewport grows past the breakpoint while the panel is open, the
    // panel hides itself via lg:hidden — keep the toggle's state honest too.
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (mq) => { if (mq.matches) setOpen(false); });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// <hb-footer>
// ─────────────────────────────────────────────────────────────────────────────
// The static <noscript> list of all eleven pages lives INSIDE <hb-footer> in
// each page's HTML, not here — if JS is off this component never renders, so a
// <noscript> emitted from JS would never reach the page.
class HbFooter extends HTMLElement {
  connectedCallback() {
    const col = (title, items) => `
      <div>
        <h2 class="text-sm font-medium text-sand">${title}</h2>
        <ul class="mt-4 space-y-2.5">
          ${items.map((i) => `<li><a href="${i.href}" class="rounded-sm text-sm tracking-[0.01em] text-sand/70 transition-colors hover:text-sand ${FOCUS_ON_ABYSS}">${i.label}</a></li>`).join('')}
        </ul>
      </div>`;

    this.innerHTML = `
      <footer class="border-t border-white/10">
        <div class="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-12 md:gap-8">
          <div class="md:col-span-5">
            <a href="index.html" class="inline-flex items-center gap-2.5 rounded-sm font-display text-xl font-medium text-shell ${FOCUS_ON_ABYSS}">${MARK}<span>Hawaii Booths</span></a>
            <p class="mt-4 max-w-sm text-sm leading-relaxed tracking-[0.01em] text-sand/70">Photo, video and audio booths for weddings, corporate events, birthdays and celebrations. Based in Honolulu.</p>
            <address class="mt-6 space-y-2 text-sm not-italic tracking-[0.01em] text-sand/70">
              <p><a href="${CONTACT.phoneHref}" class="rounded-sm transition-colors hover:text-sand ${FOCUS_ON_ABYSS}">${CONTACT.phone}</a></p>
              <p><a href="mailto:${CONTACT.email}" class="rounded-sm transition-colors hover:text-sand ${FOCUS_ON_ABYSS}">${CONTACT.email}</a></p>
              <p><a href="${CONTACT.mapsHref}" target="_blank" rel="noopener" class="rounded-sm transition-colors hover:text-sand ${FOCUS_ON_ABYSS}">${CONTACT.address}</a></p>
            </address>
          </div>
          <nav class="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7" aria-label="Footer">
            ${col('Booths', BOOTHS)}
            ${col('Plan your event', [PRIMARY[0], PRIMARY[2], PRIMARY[1], TRY])}
            ${col('Company', [PRIMARY[3], PRIMARY[4]])}
          </nav>
        </div>
        <div class="border-t border-white/10">
          <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-6 text-xs tracking-[0.01em] text-sand/60">
            <p>© ${new Date().getFullYear()} Hawaii Booths. Honolulu, Hawaiʻi.</p>
            <p>Every package is a two-hour rental.</p>
          </div>
        </div>
      </footer>`;
  }
}

customElements.define('hb-nav', HbNav);
customElements.define('hb-footer', HbFooter);

hydrateBookingLinks();

// Exposed for booth.js and for the console; not a public API.
window.HB = { BOOKING_URLS, CONTACT, BOOTHS, PRIMARY, hydrateBookingLinks };
