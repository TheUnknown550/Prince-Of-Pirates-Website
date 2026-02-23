# Prince Of Pirates Website

## Purpose
This repository contains the static frontend for the Prince Of Pirates landing site.
The current architecture uses plain HTML/CSS/JavaScript without a bundler.

## Behavior Lock Baseline
This section documents current behavior contracts that must remain stable during maintenance refactors.

### Public JavaScript Surface (`window.PrinceSite`)
- `initNavigation()`
- `initCharacterTabs()`
- `initFeatureCarousel()`
- `initSection2RatioLayout()`
- `initSectionSnapScroll()`
- `initScrollAnimations()`
- `initRegisterModal()`
- `initServerModal()`
- `navigation.scrollToSection(sectionId)`
- `navigation.closeMobileMenu()`
- `navigation.isMenuOpen()`
- `characterTabs.setCharacterTab(action)`
- `characterTabs.rotateCharacterOrder(direction)`
- `characterTabs.cycleCharacter(direction)`
- `characterTabs.refreshLayout()`
- `featureCarousel.shiftSlide(step, options?)`
- `sectionSnap.scrollToSectionById(sectionId)`
- `sectionSnap.move(direction)`
- `sectionSnap.cancel()`
- `sectionSnap.refresh()`
- `registerModal.open(trigger?)`
- `registerModal.close()`
- `registerModal.isOpen()`
- `serverModal.open(trigger?)`
- `serverModal.close()`
- `serverModal.isOpen()`

### Internal Utility Namespaces
- `utils` (shared pure helpers)
- `modalUtils` (shared modal/focus helpers)

These are additive and non-breaking. Existing public interfaces above remain authoritative.

### HTML Contracts That Must Not Drift
- `id` anchors: `main`, `game-guide`, `character`, `register-modal`, `server-modal`, `mobile-nav-overlay`
- interaction hooks: `[data-action]`, `[data-modal-action]`, `[data-register-modal-close]`, `[data-server-modal-close]`, `[data-server-id]`, `[data-server-modal-join]`
- core layout classes used by JS: `.bg-frame`, `.site-footer`, `.character-tabs`, `.feature-screen-image`, `.feature-slide-indicator`
- body state classes used by JS/CSS:
  - `menu-open`
  - `register-modal-open`
  - `server-modal-open`
  - `section-snap-enabled`

## Script Load Order Contract
`index.html` intentionally loads scripts in this order:
1. shared helpers
2. feature modules
3. bootstrap

Current order:
1. `src/js/utils/core.js`
2. `src/js/utils/modal-utils.js`
3. feature modules (`navigation.js` ... `section2-ratio-layout.js`)
4. `src/js/main.js`

## CSS Ownership Map
- `src/css/base.css`: global tokens, reusable motion utilities, section-height/snap utility classes
- `src/css/section1.css`: hero + header + mobile menu
- `src/css/section2.css`: game guide + feature carousel + section-2 ratio mode rules
- `src/css/section3.css`: character section + tabs + section-level lock rules
- `src/css/modal-common.css`: shared modal shell/backdrop/open/transition primitives
- `src/css/modal-login.css`: register modal-specific visuals and form styling
- `src/css/modal-server.css`: server modal-specific layout and card styling
- `src/css/footer.css`: footer layout and responsive adjustments

## Manual Regression Checklist
Use this checklist after any behavior-sensitive change.

### Navigation + Menu
- All desktop nav buttons trigger the same behavior as before.
- Mobile menu opens/closes via toggle, close button, overlay click, and `Escape`.
- Menu auto-closes when resizing wider than `900px`.

### Register Modal
- Opens from desktop and mobile `register` actions.
- Closing works via backdrop, close button, and `Escape`.
- Focus trap loops on `Tab`/`Shift+Tab`.
- Username input receives initial focus after open transition starts.
- Focus returns to trigger after close.

### Server Modal
- Opens from desktop and mobile `play-game` action.
- Closing works via backdrop, close button, and `Escape`.
- Focus trap loops and initial focus lands on selected/first option.
- Default server is reselected on open.
- `aria-pressed` and join-button selected server dataset stay in sync.

### Carousels + Scroll
- Section-2 feature carousel:
  - arrows work
  - indicator dot state updates
  - auto-advance runs and resumes after tab visibility restore
- Section-3 character tabs:
  - arrow controls work
  - swipe threshold behavior still matches
  - active tab class updates correctly
- Section snap:
  - wheel, keyboard, and touch move sections
  - Home/End behavior works
  - snapping pauses when menu or modal is open

### Layout + Responsive + A11y
- Section-2 ratio mode still toggles correctly on desktop/tablet and disables on mobile.
- No new console errors.
- Reduced-motion behavior still disables relevant transitions.
- Assets resolve (no broken URLs).

## Notes
- Placeholder alerts are intentional until real routes/API flows are integrated.
- Asset directory path `assests/` is intentionally unchanged to match existing references.
