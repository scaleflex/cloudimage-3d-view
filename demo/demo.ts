import { CI3DView } from '../src/core/ci-3d-view';
import { parseDataAttributes } from '../src/core/config';
import { initConfigurator, destroyConfigurator } from './configurator';

// ===== Helpers =====

/** Swap all `data-ci-3d-lazy-*` attributes to `data-ci-3d-*` on an element. */
function promoteLazyAttributes(el: HTMLElement): void {
  const toRename: { old: string; new_: string; value: string }[] = [];
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith('data-ci-3d-lazy-')) {
      const promoted = attr.name.replace('data-ci-3d-lazy-', 'data-ci-3d-');
      toRename.push({ old: attr.name, new_: promoted, value: attr.value });
    }
  }
  for (const { old, new_, value } of toRename) {
    el.removeAttribute(old);
    el.setAttribute(new_, value);
  }
}

/** Enable all input/select/button controls inside a container. */
function enableControls(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>('input, select, button').forEach((ctrl) => {
    ctrl.removeAttribute('disabled');
  });
}

/** Disable all input/select/button controls inside a container. */
function disableControls(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>('input, select, button').forEach((ctrl) => {
    ctrl.setAttribute('disabled', '');
  });
}

// ===== Viewer Manager: only one active 3D viewer at a time =====

interface ViewerEntry {
  active: boolean;
  /** Destroy the active viewer and recreate with autoLoad:false overlay. */
  deactivate: () => void;
}

const registry = new Map<HTMLElement, ViewerEntry>();

/** Deactivate all viewers except the given container. */
function deactivateOthers(except: HTMLElement): void {
  for (const [container, entry] of registry) {
    if (container === except || !entry.active) continue;
    entry.deactivate();
    entry.active = false;
  }
}

// ===== Hero Viewer =====
const heroEl = document.getElementById('hero-viewer');
if (heroEl) {
  promoteLazyAttributes(heroEl);
  const config = parseDataAttributes(heroEl);

  let heroInstance: CI3DView | null = null;

  function createHeroOverlay() {
    const overlay = new CI3DView(heroEl!, { ...config, autoLoad: false, thumbnail: './previews/preview-stl.png' });
    // Plugin's overlay click will call initThreeJS() — that's fine for hero, it self-activates.
    // We just need to track the state.
    heroEl!.addEventListener('click', () => {
      deactivateOthers(heroEl!);
      heroEntry.active = true;
      heroInstance = overlay; // The overlay self-activated via initThreeJS
    }, { once: true });
  }

  const heroEntry: ViewerEntry = {
    active: false,
    deactivate: () => {
      heroInstance?.destroy();
      heroInstance = null;
      createHeroOverlay();
    },
  };

  registry.set(heroEl, heroEntry);

  // Auto-activate hero on page load (no overlay)
  heroEntry.active = true;
  heroInstance = new CI3DView(heroEl, config);
}

// ===== Format Card Viewers =====
// These use data-ci-3d-auto-load="false" + data-ci-3d-thumbnail from data attrs.
// The plugin shows its native overlay and self-activates on click via initThreeJS().
document.querySelectorAll<HTMLElement>('[data-ci-3d-lazy-src]').forEach((el) => {
  if (el.id === 'hero-viewer') return;

  promoteLazyAttributes(el);
  const config = parseDataAttributes(el);

  let currentInstance: CI3DView | null = null;

  function createOverlay() {
    currentInstance = new CI3DView(el, { ...config, autoLoad: false });
    // Plugin self-activates on overlay click. We track state and deactivate others.
    el.addEventListener('click', () => {
      deactivateOthers(el);
      entry.active = true;
      // currentInstance is now the active viewer (it loaded itself)
    }, { once: true });
  }

  const entry: ViewerEntry = {
    active: false,
    deactivate: () => {
      currentInstance?.destroy();
      currentInstance = null;
      createOverlay();
    },
  };

  registry.set(el, entry);
  createOverlay();
});

// ===== Lighting Demo =====
// Lighting/Animation/Configurator use programmatic config (not data attrs).
// We destroy the overlay instance and create a fresh one for the active viewer,
// so the demo controls bind to the correct instance.
let lightingInstance: CI3DView | null = null;
let lightingOverlay: CI3DView | null = null;
let lightingListenersAttached = false;
const lightingContainer = document.getElementById('lighting-viewer');
if (lightingContainer) {
  const shadowsCtrl = document.getElementById('ctrl-shadows') as HTMLInputElement;
  const tonemapCtrl = document.getElementById('ctrl-tonemapping') as HTMLSelectElement;
  const exposureCtrl = document.getElementById('ctrl-exposure') as HTMLInputElement;
  const exposureVal = document.getElementById('ctrl-exposure-val');
  const themeCtrl = document.getElementById('ctrl-lighting-theme') as HTMLSelectElement;

  const lightingConfig = {
    src: 'https://fbmjmuoeb.filerobot.com/3D%20Models/colored.stl?vh=0975df&func=proxy',
    autoRotate: true,
    shadows: true,
    toneMapping: 'aces' as const,
    screenshotButton: true,
    alt: 'Lighting demo model',
    thumbnail: './previews/preview-lighting.png',
    onError: (err: Error) => console.error('[Lighting]', err),
  };

  function createLightingOverlay() {
    lightingOverlay = new CI3DView(lightingContainer!, { ...lightingConfig, autoLoad: false });
    // Use capture phase + stopPropagation to intercept the click before the plugin's
    // overlay handler fires initThreeJS() — we want to destroy and replace the instance.
    lightingContainer!.addEventListener('click', (e) => {
      e.stopPropagation();
      lightingOverlay?.destroy();
      lightingOverlay = null;
      deactivateOthers(lightingContainer!);
      lightingEntry.active = true;
      activateLighting();
    }, { once: true, capture: true });
  }

  function activateLighting() {
    lightingInstance = new CI3DView(lightingContainer!, lightingConfig);
    const controlsPanel = lightingContainer!.closest('.demo-panel')?.querySelector('.demo-panel__controls');
    if (controlsPanel) enableControls(controlsPanel as HTMLElement);

    if (!lightingListenersAttached) {
      lightingListenersAttached = true;
      shadowsCtrl?.addEventListener('change', () => {
        lightingInstance?.update({ shadows: shadowsCtrl.checked });
      });
      tonemapCtrl?.addEventListener('change', () => {
        lightingInstance?.update({ toneMapping: tonemapCtrl.value as any });
      });
      exposureCtrl?.addEventListener('input', () => {
        const val = parseFloat(exposureCtrl.value);
        if (exposureVal) exposureVal.textContent = val.toFixed(1);
        lightingInstance?.update({ toneMappingExposure: val });
      });
      themeCtrl?.addEventListener('change', () => {
        lightingInstance?.update({ theme: themeCtrl.value as any });
      });
    }
  }

  const lightingEntry: ViewerEntry = {
    active: false,
    deactivate: () => {
      lightingInstance?.destroy();
      lightingInstance = null;
      const controlsPanel = lightingContainer!.closest('.demo-panel')?.querySelector('.demo-panel__controls');
      if (controlsPanel) disableControls(controlsPanel as HTMLElement);
      createLightingOverlay();
    },
  };

  registry.set(lightingContainer, lightingEntry);
  createLightingOverlay();
}

// ===== Animation Demo =====
let animInstance: CI3DView | null = null;
let animOverlay: CI3DView | null = null;
let animListenersAttached = false;
const animContainer = document.getElementById('animation-viewer');
if (animContainer) {
  const speedCtrl = document.getElementById('anim-speed') as HTMLInputElement;
  const speedVal = document.getElementById('anim-speed-val');

  const animConfig = {
    src: 'https://fbmjmuoeb.filerobot.com/3D%20Models/Samba%20Dancing.fbx?vh=4ad183&func=proxy',
    autoPlayAnimation: true,
    shadows: true,
    screenshotButton: true,
    backgroundToggleButton: true,
    alt: 'Animated dancing character',
    thumbnail: './previews/preview-animation.png',
    onError: (err: Error) => console.error('[Animation]', err),
  };

  function createAnimOverlay() {
    animOverlay = new CI3DView(animContainer!, { ...animConfig, autoLoad: false });
    animContainer!.addEventListener('click', (e) => {
      e.stopPropagation();
      animOverlay?.destroy();
      animOverlay = null;
      deactivateOthers(animContainer!);
      animEntry.active = true;
      activateAnimation();
    }, { once: true, capture: true });
  }

  function activateAnimation() {
    animInstance = new CI3DView(animContainer!, animConfig);
    const controlsPanel = animContainer!.closest('.demo-panel')?.querySelector('.demo-panel__controls');
    if (controlsPanel) enableControls(controlsPanel as HTMLElement);

    if (!animListenersAttached) {
      animListenersAttached = true;
      document.getElementById('anim-play')?.addEventListener('click', () => {
        animInstance?.playAnimation();
      });
      document.getElementById('anim-pause')?.addEventListener('click', () => {
        animInstance?.pauseAnimation();
      });
      document.getElementById('anim-stop')?.addEventListener('click', () => {
        animInstance?.stopAnimation();
      });
      speedCtrl?.addEventListener('input', () => {
        const val = parseFloat(speedCtrl.value);
        if (speedVal) speedVal.textContent = `${val.toFixed(1)}x`;
        animInstance?.setAnimationSpeed(val);
      });
    }
  }

  const animEntry: ViewerEntry = {
    active: false,
    deactivate: () => {
      animInstance?.destroy();
      animInstance = null;
      const controlsPanel = animContainer!.closest('.demo-panel')?.querySelector('.demo-panel__controls');
      if (controlsPanel) disableControls(controlsPanel as HTMLElement);
      createAnimOverlay();
    },
  };

  registry.set(animContainer, animEntry);
  createAnimOverlay();
}

// ===== Interactive Configurator =====
let cfgOverlay: CI3DView | null = null;
const configuratorContainer = document.getElementById('configurator-viewer');
if (configuratorContainer) {
  const cfgOverlayConfig = {
    src: 'https://fbmjmuoeb.filerobot.com/3D%20Models/Turing-Borwo.stl?vh=828731&func=proxy',
    autoLoad: false as const,
    thumbnail: './previews/preview-configurator.png',
  };

  function createCfgOverlay() {
    cfgOverlay = new CI3DView(configuratorContainer!, cfgOverlayConfig);
    configuratorContainer!.addEventListener('click', (e) => {
      e.stopPropagation();
      cfgOverlay?.destroy();
      cfgOverlay = null;
      deactivateOthers(configuratorContainer!);
      cfgEntry.active = true;
      initConfigurator(configuratorContainer!);
    }, { once: true, capture: true });
  }

  const cfgEntry: ViewerEntry = {
    active: false,
    deactivate: () => {
      destroyConfigurator();
      createCfgOverlay();
    },
  };

  registry.set(configuratorContainer, cfgEntry);
  createCfgOverlay();
}

// ===== Burger Menu =====
const burger = document.getElementById('burger');
const navLinks = document.getElementById('nav-links');
burger?.addEventListener('click', () => {
  const isOpen = navLinks?.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(!!isOpen));
});

// Close menu on link click
navLinks?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    burger?.setAttribute('aria-expanded', 'false');
  });
});

// ===== Nav scroll shadow =====
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav?.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

// ===== Scroll-aware nav highlighting =====
const sections = document.querySelectorAll('section[id], .demo-hero[id]');
const navLinkElements = document.querySelectorAll('.demo-nav-links a');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinkElements.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  },
  { rootMargin: '-50% 0px -50% 0px' },
);

sections.forEach((section) => observer.observe(section));

// ===== Copy to clipboard (old-style text-swap buttons) =====
document.querySelectorAll('.code-block__copy').forEach((btn) => {
  btn.addEventListener('click', () => {
    const text =
      (btn as HTMLElement).dataset.copy ||
      btn.closest('.code-block')?.querySelector('code')?.textContent ||
      '';
    navigator.clipboard.writeText(text).then(() => {
      const original = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.textContent = original;
      }, 2000);
    });
  });
});

// ===== Copy to clipboard (new icon-style buttons) =====
document.querySelectorAll('.demo-copy-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const code = btn.closest('.demo-code-wrap')?.querySelector('code');
    if (!code) return;
    navigator.clipboard.writeText(code.textContent || '').then(() => {
      btn.classList.add('copied');
      setTimeout(() => btn.classList.remove('copied'), 2000);
    });
  });
});
