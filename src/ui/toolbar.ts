import { createElement } from '../utils/dom';

// Lucide-style SVG icons (24×24 viewBox, stroke-based)
const ICON_RESET_CAMERA = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>';
const ICON_AUTO_ROTATE = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><path d="M10.4 21.9a10 10 0 0 0 9.941-15.416"/><path d="M13.5 2.1a10 10 0 0 0-9.841 15.416"/></svg>';
const ICON_PLAY = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
const ICON_PAUSE = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
const ICON_STOP = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>';
const ICON_CAMERA = '<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>';

export interface ToolbarOptions {
  resetCameraButton: boolean;
  autoRotateButton: boolean;
  animationButtons: boolean;
  screenshotButton: boolean;
  hasAnimations: boolean;
  autoRotateActive: boolean;
  position: 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export interface ToolbarCallbacks {
  onResetCamera: () => void;
  onAutoRotate: (enabled: boolean) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onScreenshot: () => void;
}

export interface ToolbarHandle {
  element: HTMLElement;
  setAnimationState(playing: boolean): void;
  setAutoRotateState(active: boolean): void;
  destroy(): void;
}

export function createToolbar(
  container: HTMLElement,
  options: ToolbarOptions,
  callbacks: ToolbarCallbacks,
): ToolbarHandle | null {
  const showReset = options.resetCameraButton;
  const showAutoRotate = options.autoRotateButton;
  const showAnimation = options.animationButtons && options.hasAnimations;
  const showScreenshot = options.screenshotButton;

  // Don't create toolbar if no buttons are visible
  if (!showReset && !showAutoRotate && !showAnimation && !showScreenshot) {
    return null;
  }

  const element = createElement('div', 'ci-3d-toolbar');
  element.setAttribute('data-position', options.position);

  let autoRotateBtn: HTMLButtonElement | null = null;
  let playPauseBtn: HTMLButtonElement | null = null;
  let isPlaying = false;
  let isAutoRotating = options.autoRotateActive;

  // --- Camera controls group ---
  let hasCameraGroup = false;

  if (showReset) {
    const btn = createElement('button', 'ci-3d-toolbar-btn', { 'aria-label': 'Reset camera' });
    btn.innerHTML = ICON_RESET_CAMERA;
    btn.addEventListener('click', callbacks.onResetCamera);
    element.appendChild(btn);
    hasCameraGroup = true;
  }

  if (showAutoRotate) {
    autoRotateBtn = createElement('button', 'ci-3d-toolbar-btn', {
      'aria-label': 'Toggle auto-rotate',
      'aria-pressed': String(isAutoRotating),
    });
    if (isAutoRotating) {
      autoRotateBtn.classList.add('ci-3d-toolbar-active');
    }
    autoRotateBtn.innerHTML = ICON_AUTO_ROTATE;
    autoRotateBtn.addEventListener('click', () => {
      isAutoRotating = !isAutoRotating;
      callbacks.onAutoRotate(isAutoRotating);
      autoRotateBtn!.classList.toggle('ci-3d-toolbar-active', isAutoRotating);
      autoRotateBtn!.setAttribute('aria-pressed', String(isAutoRotating));
    });
    element.appendChild(autoRotateBtn);
    hasCameraGroup = true;
  }

  // --- Separator between camera and animation ---
  if (hasCameraGroup && showAnimation) {
    element.appendChild(createElement('div', 'ci-3d-toolbar-separator'));
  }

  // --- Animation group ---
  let hasAnimationGroup = false;

  if (showAnimation) {
    playPauseBtn = createElement('button', 'ci-3d-toolbar-btn', { 'aria-label': 'Play animation' });
    playPauseBtn.innerHTML = ICON_PLAY;
    playPauseBtn.addEventListener('click', () => {
      if (isPlaying) {
        callbacks.onPause();
      } else {
        callbacks.onPlay();
      }
    });
    element.appendChild(playPauseBtn);

    const stopBtn = createElement('button', 'ci-3d-toolbar-btn', { 'aria-label': 'Stop animation' });
    stopBtn.innerHTML = ICON_STOP;
    stopBtn.addEventListener('click', () => {
      callbacks.onStop();
      // Reset play/pause to play state
      isPlaying = false;
      if (playPauseBtn) {
        playPauseBtn.innerHTML = ICON_PLAY;
        playPauseBtn.setAttribute('aria-label', 'Play animation');
      }
    });
    element.appendChild(stopBtn);
    hasAnimationGroup = true;
  }

  // --- Separator before screenshot ---
  if ((hasCameraGroup || hasAnimationGroup) && showScreenshot) {
    element.appendChild(createElement('div', 'ci-3d-toolbar-separator'));
  }

  // --- Screenshot ---
  if (showScreenshot) {
    const btn = createElement('button', 'ci-3d-toolbar-btn', { 'aria-label': 'Take screenshot' });
    btn.innerHTML = ICON_CAMERA;
    btn.addEventListener('click', callbacks.onScreenshot);
    element.appendChild(btn);
  }

  container.appendChild(element);

  return {
    element,

    setAnimationState(playing: boolean): void {
      isPlaying = playing;
      if (playPauseBtn) {
        playPauseBtn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
        playPauseBtn.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
      }
    },

    setAutoRotateState(active: boolean): void {
      isAutoRotating = active;
      if (autoRotateBtn) {
        autoRotateBtn.classList.toggle('ci-3d-toolbar-active', active);
        autoRotateBtn.setAttribute('aria-pressed', String(active));
      }
    },

    destroy(): void {
      element.remove();
    },
  };
}
