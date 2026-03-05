# Prince Of Pirates Website

Static landing page for Prince Of Pirates, built with plain HTML, CSS, and JavaScript.

Last code audit: February 25, 2026.

## Local Run

No install/build step is required.

1. Open `index.html` directly in a browser, or
2. Serve the folder as a static site (recommended), for example:
   - `python -m http.server 5500`
   - then open `http://localhost:5500`

## Repository Layout

- `index.html`: markup, sections, modals, and script/style includes
- `src/css/`
  - `base.css`: shared tokens, resets, motion, section sizing, snap utility classes
  - `section1.css`: hero/header/mobile menu
  - `section2.css`: game-guide layout, feature carousel, section-2 ratio mode
  - `section3.css`: character layout and tab carousel visuals
  - `modal-common.css`: shared modal shell/open/backdrop behavior
  - `modal-login.css`: login modal visuals
  - `modal-register.css`: register modal visuals
  - `modal-download.css`: download modal visuals
  - `modal-server.css`: server modal visuals
  - `footer.css`: footer layout/responsive rules
- `src/js/`
  - `utils/core.js`: shared pure helpers
  - `utils/modal-utils.js`: shared modal/focus helpers
  - feature modules: `navigation.js`, `feature-carousel.js`, `character-tabs.js`, `section-snap.js`, `scroll-animations.js`, `login-modal.js`, `register-modal.js`, `download-modal.js`, `server-modal.js`, `section2-ratio-layout.js`
  - `main.js`: bootstraps all `init*` modules
- `assests/`: image/font assets (path name is intentionally spelled `assests`)

## Runtime Architecture

All modules register to `window.PrinceSite` and are loaded in this order:

1. `src/js/utils/core.js`
2. `src/js/utils/modal-utils.js`
3. feature modules
4. `src/js/main.js`

`main.js` bootstrap sequence:

1. `initNavigation`
2. `initCharacterTabs`
3. `initFeatureCarousel`
4. `initSection2RatioLayout`
5. `initSectionSnapScroll`
6. `initScrollAnimations`
7. `initLoginModal`
8. `initRegisterModal`
9. `initDownloadModal`
10. `initServerModal`

## Public JavaScript API (`window.PrinceSite`)

- `initNavigation()`
- `initCharacterTabs()`
- `initFeatureCarousel()`
- `initSection2RatioLayout()`
- `initSectionSnapScroll()`
- `initScrollAnimations()`
- `initLoginModal()`
- `initRegisterModal()`
- `initDownloadModal()`
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
- `loginModal.open(trigger?)`
- `loginModal.close(options?)`
- `loginModal.isOpen()`
- `registerModal.open(trigger?)`
- `registerModal.close(options?)`
- `registerModal.isOpen()`
- `downloadModal.open(trigger?)`
- `downloadModal.close()`
- `downloadModal.isOpen()`
- `serverModal.open(trigger?)`
- `serverModal.close()`
- `serverModal.isOpen()`

Internal shared namespaces:

- `utils`
- `modalUtils`

## Interaction Contracts

Stable IDs:

- `main`
- `game-guide`
- `character`
- `login-modal`
- `register-modal`
- `download-modal`
- `server-modal`
- `mobile-nav-overlay`

Stable data hooks:

- `[data-action]`
- `[data-login-modal-action]`
- `[data-register-modal-action]`
- `[data-login-modal-close]`
- `[data-register-modal-close]`
- `[data-download-modal-close]`
- `[data-download-target]`
- `[data-server-modal-close]`
- `[data-server-id]`
- `[data-server-modal-join]`

Core JS-dependent classes/selectors:

- `.bg-frame`
- `.site-footer` (included in section-snap targets)
- `.character-tabs`
- `.feature-screen-image`
- `.feature-slide-indicator`

Body state classes used by JS/CSS:

- `menu-open`
- `login-modal-open`
- `register-modal-open`
- `download-modal-open`
- `server-modal-open`
- `section-snap-enabled`

Dynamic classes used at runtime:

- `.is-open` (modals/mobile menu)
- `.is-selected` (server cards)
- `.is-active` (character tab + feature dot)
- `.character-tab-viewport`, `.character-tab-track`, `.char-tab-clone` (character carousel)
- `.is-feature-incoming`, `.is-sliding`, `.is-enter-from-left`, `.is-enter-from-right`, `.is-leave-to-left`, `.is-leave-to-right` (feature carousel)
- `.section2-ratio-mode`, `.section2-ratio-portrait`, `.section2-ratio-landscape` (section-2 fit mode)

## Navigation `data-action` Map

- `reload-page`: hard page reload
- `main`: scroll to `#main`
- `register`: open register modal (fallback alert if missing)
- `topup`: placeholder alert
- `game-guide`: scroll to `#game-guide`
- `news`: placeholder alert
- `community`: placeholder alert
- `app-store`: placeholder alert
- `google-play`: placeholder alert
- `google-play-games`: placeholder alert
- `play-game`: open server modal (fallback alert if missing)
- `download`: open download modal (fallback alert if missing)
- `member`: open login modal (fallback alert if missing)
- `toggle-mobile-menu`: open/close mobile overlay menu
- `close-mobile-menu`: close mobile overlay menu
- `feature-prev` / `feature-next`: feature carousel controls
- `character-prev` / `character-next`: character order cycle
- `character-luffy` / `character-zoro` / `character-nami`: set active character tab

## Placeholder Behaviors (Intentional)

- Navigation alerts for `topup`, `news`, `community`, `app-store`, `google-play`, `google-play-games`
- Login modal actions:
  - `signup` switches to register modal
  - `forgot` -> `alert("Forgot password action not added yet.")`
  - login submit -> `alert("Login action not added yet.")`
- Register modal actions:
  - `เข้าสู่ระบบ` switches to login modal
  - register submit -> `alert("Register action not added yet.")`
- Download modal actions:
  - `apk` -> `alert("APK download link not added yet.")`
  - `ios` -> `alert("iOS download link not added yet.")`
  - `windows` -> `alert("Windows download link not added yet.")`
  - `browser` -> `alert("Browser download link not added yet.")`
- Server modal join button currently prevents default and performs no request

## Manual Regression Checklist

### Navigation + Mobile Menu

- Desktop and mobile `data-action` buttons still trigger expected handlers.
- Mobile menu can open/close via toggle, close button, overlay click, and `Escape`.
- Mobile menu closes on resize when viewport becomes wider than `900px`.

### Login Modal

- Opens from hero `member`.
- Closes via backdrop/close button/`Escape`.
- Focus trap loops with `Tab` and `Shift+Tab`.
- Focus moves to username after open transition start.
- Focus returns to trigger on close.

### Register Modal

- Opens from desktop and mobile `register`.
- Closes via backdrop/close button/`Escape`.
- Focus trap loops with `Tab` and `Shift+Tab`.
- Focus moves to username after open transition start.
- Focus returns to trigger on close.
- Includes title image `assests/modals/register/Register_Title.png`.

### Download Modal

- Opens from hero `download`.
- Closes via backdrop/close button/`Escape`.
- Focus trap loops with `Tab` and `Shift+Tab`.
- Focus moves to first download target after open transition start.
- Focus returns to trigger on close.
- APK/iOS/Windows/Browser buttons show placeholder alerts.

### Server Modal

- Opens from desktop and mobile `play-game`.
- Closes via backdrop/close button/`Escape`.
- Focus trap loops within modal.
- Default server resets to `SERVER 1` on open.
- `aria-pressed`, `.is-selected`, and join button `data-selected-server-id` stay synced.

### Carousel + Scroll

- Feature carousel arrows work.
- Feature indicator dot state updates.
- Feature auto-slide resumes after tab visibility restore.
- Character prev/next and swipe still rotate order.
- Section snap still works for wheel, keyboard, touch, plus `Home`/`End`.
- Section snap pauses while menu/login/register/download/server modal is open.

### Responsive + Accessibility

- Section-2 ratio mode activates only above `900px` and clears below it.
- Reduced-motion behavior still disables motion-heavy transitions.
- No console errors.
- Asset URLs resolve correctly.

## Asset Inventory

Current binary assets in `assests/`:

- 57 `.png`
- 3 `.jpg`
- 1 `.ttf`

Keep the directory name `assests/` unchanged unless all references are migrated together.
