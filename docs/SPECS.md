# @cloudimage/3d-view — Specification

> Interactive 3D model viewer with orbit controls, lighting, and accessibility.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Features](#2-core-features)
3. [API Design](#3-api-design)
4. [3D Model Loading](#4-3d-model-loading)
5. [Visual Design](#5-visual-design)
6. [Camera & Controls](#6-camera--controls)
7. [Lighting & Environment](#7-lighting--environment)
8. [React Wrapper API](#8-react-wrapper-api)
9. [Accessibility](#9-accessibility)
10. [Build & Distribution](#10-build--distribution)
11. [Project Structure](#11-project-structure)
12. [GitHub Pages Demo](#12-github-pages-demo)
13. [Additional Features](#13-additional-features)
14. [Competitor Feature Matrix](#14-competitor-feature-matrix)
15. [Roadmap](#15-roadmap)
16. [Appendices](#16-appendices)

---

## 1. Project Overview

### What

`@cloudimage/3d-view` is an open-source JavaScript library for embedding interactive 3D model viewers into web pages. It provides a turnkey solution for displaying GLB/glTF and OBJ models with orbit controls, configurable lighting, environment maps, shadows, and a polished loading experience — all built on Three.js.

### Why

The existing ecosystem for lightweight 3D model viewers has significant gaps:

- **Google's `<model-viewer>`** is excellent but opinionated — locked to its own rendering pipeline, limited lighting control, and no raw Three.js access for customization
- **Using Three.js directly** requires hundreds of lines of boilerplate for a simple viewer — scene setup, camera, renderer, controls, lighting, resize handling, loader configuration, progress tracking, and cleanup
- **react-three-fiber** is powerful but React-only, heavyweight, and overkill for "just show a model" use cases
- **No library offers both vanilla JS and React** with HTML data-attribute initialization, proper TypeScript types, and a Scaleflex-style build pipeline
- **Accessibility** (keyboard navigation for orbit controls, screen reader announcements, ARIA attributes) is universally neglected in 3D viewers
- **CSS variable theming** for UI overlays (loading states, controls, error messages) is not available in any existing solution

### Positioning

`@cloudimage/3d-view` fills these gaps by providing:

- A **Three.js-powered**, TypeScript-first library with full access to the underlying scene
- **GLB/glTF + OBJ+MTL** format support out of the box, with an extensible loader architecture
- **Two equal initialization methods** — JavaScript API and HTML data-attributes
- **Orbit controls, zoom, pan, auto-rotate** with touch support and keyboard navigation
- **3-point lighting, HDR environment maps, shadows** with sensible defaults
- **WCAG 2.1 AA** accessibility compliance for all interactive UI elements
- **CSS variable theming** for loading overlays, controls, and error states
- A **React wrapper** with SSR support, hook API, and ref-based instance access
- **Modern build output** — ESM, CJS, and UMD in a single package (Three.js externalized)
- **Source-agnostic** — loads models from any URL, no CDN coupling

### Key Inspirations

- **Google `<model-viewer>`** — clean loading UX, auto-rotate, environment lighting defaults
- **Sketchfab embeds** — fullscreen toggle, screenshot, animation playback controls
- **Scaleflex `js-cloudimage-hotspot`** — same build system pattern, React wrapper architecture, data-attribute initialization, CSS variable theming, demo site layout

---

## 2. Core Features

### v1.0 Feature Set

| Feature | Description |
|---|---|
| **Model Display** | Responsive container that fills its parent; auto-centers and scales models to fit the viewport |
| **Format Support** | GLB/glTF (primary, with Draco compression support) and OBJ+MTL (secondary); extensible loader architecture for future formats |
| **Camera Controls** | OrbitControls with orbit, zoom, and pan; configurable damping, zoom limits, and polar angle constraints |
| **Auto-Rotate** | Continuous rotation with configurable speed and direction; pauses on user interaction, resumes after configurable delay |
| **Lighting** | Default 3-point lighting (key, fill, rim); configurable intensity, color, and position per light |
| **Environment Maps** | HDR/EXR environment maps for image-based lighting (IBL); configurable tone mapping; optional visible background |
| **Shadows** | Ground plane contact shadows with configurable opacity and blur |
| **Loading Progress** | Animated progress bar with percentage; customizable loading overlay |
| **Fullscreen** | Browser Fullscreen API toggle button; responsive layout in fullscreen mode |
| **Screenshot** | Capture current view as PNG with configurable resolution |
| **Animation Playback** | Play/pause/stop embedded glTF animations; animation selection by name or index; playback speed control |
| **Accessibility** | WCAG 2.1 AA; keyboard-driven orbit, zoom, and pan; ARIA attributes; focus management; reduced motion support |
| **Theming** | CSS variables as primary customization method; light (default) and dark themes |
| **Two Init Methods** | JavaScript API (`new CI3DView()`) and HTML data-attributes (`data-ci-3d-*`) — fully equivalent |
| **React Wrapper** | Separate entry point with SSR support, hook API, ref-based instance access |
| **TypeScript** | Full type definitions, exported interfaces and types |
| **Build Formats** | ESM + CJS + UMD; Three.js externalized as peer dependency; `window.CI3DView` global |

---

## 3. API Design

The library provides two fully equivalent initialization methods. Every configuration option available in the JavaScript API is also expressible via HTML data-attributes.

### 3.1 JavaScript API

```js
const instance = new CI3DView(element, config);
```

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `element` | `HTMLElement \| string` | Container element or CSS selector |
| `config` | `CI3DViewConfig` | Configuration object |

**`CI3DViewConfig` interface:**

```ts
interface CI3DViewConfig {
  /** 3D model source URL (required). Supported: .glb, .gltf, .obj */
  src: string;

  /** Material library URL for OBJ models (optional, auto-detected if co-located) */
  mtlSrc?: string;

  /** Accessible description of the 3D model */
  alt?: string;

  /** Enable orbit controls (default: true) */
  controls?: boolean;

  /** Enable camera zoom (default: true) */
  zoom?: boolean;

  /** Enable camera pan (default: true) */
  pan?: boolean;

  /** Enable auto-rotation (default: false) */
  autoRotate?: boolean;

  /** Auto-rotation speed in revolutions per second (default: 0.5). Negative = clockwise. */
  autoRotateSpeed?: number;

  /** Delay in milliseconds before auto-rotation resumes after user interaction (default: 3000) */
  autoRotateDelay?: number;

  /** Enable damping/inertia for controls (default: true) */
  damping?: boolean;

  /** Damping factor (default: 0.1). Higher = more responsive, lower = smoother. Range: 0–1. */
  dampingFactor?: number;

  /** Minimum zoom distance from target (default: auto-calculated from model bounds) */
  zoomMin?: number;

  /** Maximum zoom distance from target (default: auto-calculated from model bounds) */
  zoomMax?: number;

  /** Minimum polar angle in degrees (default: 0). 0 = top-down view allowed. */
  polarAngleMin?: number;

  /** Maximum polar angle in degrees (default: 180). 180 = bottom-up view allowed. */
  polarAngleMax?: number;

  /** Theme — applies a preset of CSS variable values (default: 'light') */
  theme?: 'light' | 'dark';

  /** Background color of the canvas (default: 'transparent'). CSS color string or 'transparent'. */
  background?: string;

  /** Show loading progress bar (default: true) */
  showProgress?: boolean;

  /** Show fullscreen toggle button (default: true) */
  fullscreenButton?: boolean;

  /** Show screenshot button (default: false) */
  screenshotButton?: boolean;

  /** Screenshot filename without extension (default: 'screenshot') */
  screenshotFilename?: string;

  /** Screenshot resolution multiplier relative to canvas size (default: 2) */
  screenshotScale?: number;

  /** Enable shadow casting onto a ground plane (default: true) */
  shadows?: boolean;

  /** Shadow opacity (default: 0.3). Range: 0–1. */
  shadowOpacity?: number;

  /** Shadow blur radius (default: 2). Higher = softer shadow edges. */
  shadowBlur?: number;

  /** Lighting configuration */
  lighting?: LightingConfig;

  /** HDR/EXR environment map URL for image-based lighting */
  environmentMap?: string;

  /** Show environment map as scene background (default: false) */
  environmentBackground?: boolean;

  /** Tone mapping mode (default: 'aces'). Controls HDR-to-LDR conversion. */
  toneMapping?: 'none' | 'linear' | 'reinhard' | 'aces' | 'filmic';

  /** Tone mapping exposure (default: 1.0). Higher = brighter. */
  toneMappingExposure?: number;

  /** Enable Draco mesh decompression for GLB/glTF (default: true) */
  draco?: boolean;

  /** Custom Draco decoder path (default: CDN-hosted decoder from Three.js) */
  dracoDecoderPath?: string;

  /** Index or name of the glTF animation to play on load (default: none) */
  animation?: number | string;

  /** Automatically play the first animation on load (default: false) */
  autoPlayAnimation?: boolean;

  /** Animation playback speed multiplier (default: 1.0) */
  animationSpeed?: number;

  /** Initial camera position as [x, y, z] (default: auto-calculated to fit model) */
  cameraPosition?: [number, number, number];

  /** Camera field of view in degrees (default: 45) */
  cameraFov?: number;

  /** Camera look-at target as [x, y, z] (default: model center) */
  cameraTarget?: [number, number, number];

  /** Pixel ratio for rendering (default: min(window.devicePixelRatio, 2)) */
  pixelRatio?: number;

  /** Enable antialiasing (default: true) */
  antialias?: boolean;

  /** Called when model loading starts */
  onLoadStart?: () => void;

  /** Called during model loading with progress (0–1) */
  onProgress?: (progress: number) => void;

  /** Called when model is fully loaded and rendered */
  onLoad?: (instance: CI3DViewInstance) => void;

  /** Called when an error occurs during loading */
  onError?: (error: Error) => void;

  /** Called when camera position changes (throttled to 60fps) */
  onCameraChange?: (position: { x: number; y: number; z: number }, target: { x: number; y: number; z: number }) => void;

  /** Called when fullscreen state changes */
  onFullscreenChange?: (isFullscreen: boolean) => void;
}
```

**`LightingConfig` interface:**

```ts
interface LightingConfig {
  /** Ambient light intensity (default: 0.4). Set to 0 to disable. */
  ambientIntensity?: number;

  /** Ambient light color (default: '#ffffff') */
  ambientColor?: string;

  /** Key light (main directional light) */
  keyLight?: DirectionalLightConfig;

  /** Fill light (soft secondary light) */
  fillLight?: DirectionalLightConfig;

  /** Rim light (backlight for edge definition) */
  rimLight?: DirectionalLightConfig;
}

interface DirectionalLightConfig {
  /** Light intensity (default varies per light type) */
  intensity?: number;

  /** Light color as CSS hex string (default: '#ffffff') */
  color?: string;

  /** Light position as [x, y, z] (default varies per light type) */
  position?: [number, number, number];

  /** Whether this light casts shadows (default: true for key light, false for others) */
  castShadow?: boolean;
}
```

**Instance methods:**

```ts
interface CI3DViewInstance {
  /** Get references to internal Three.js objects */
  getThreeObjects(): {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    model: THREE.Group | null;
  };

  /** Get references to DOM elements */
  getElements(): {
    container: HTMLElement;
    canvas: HTMLCanvasElement;
  };

  /** Load a new model (replaces the current one) */
  loadModel(src: string, mtlSrc?: string): Promise<void>;

  /** Set camera position programmatically */
  setCameraPosition(x: number, y: number, z: number): void;

  /** Set camera look-at target */
  setCameraTarget(x: number, y: number, z: number): void;

  /** Reset camera to initial position and target */
  resetCamera(): void;

  /** Enable or disable auto-rotation */
  setAutoRotate(enabled: boolean): void;

  /** Take a screenshot of the current view; returns a data URL */
  screenshot(scale?: number): string;

  /** Download a screenshot as a PNG file */
  downloadScreenshot(filename?: string, scale?: number): void;

  /** Play an animation by index or name */
  playAnimation(indexOrName?: number | string): void;

  /** Pause the current animation */
  pauseAnimation(): void;

  /** Stop the current animation and reset to first frame */
  stopAnimation(): void;

  /** Set animation playback speed */
  setAnimationSpeed(speed: number): void;

  /** Get available animation names */
  getAnimations(): string[];

  /** Enter browser fullscreen mode */
  enterFullscreen(): void;

  /** Exit browser fullscreen mode */
  exitFullscreen(): void;

  /** Check if currently in fullscreen mode */
  isFullscreen(): boolean;

  /** Update configuration (partial update, re-applies changed options) */
  update(config: Partial<CI3DViewConfig>): void;

  /** Destroy the instance and clean up Three.js resources, DOM, and listeners */
  destroy(): void;
}
```

**Usage example:**

```js
import CI3DView from '@cloudimage/3d-view';

const viewer = new CI3DView('#product-viewer', {
  src: 'https://example.com/models/sneaker.glb',
  alt: '3D sneaker model',
  autoRotate: true,
  autoRotateSpeed: 0.3,
  shadows: true,
  environmentMap: 'https://example.com/env/studio.hdr',
  toneMapping: 'aces',
  lighting: {
    ambientIntensity: 0.5,
    keyLight: { intensity: 1.2, position: [5, 8, 5] },
  },
  onLoad(instance) {
    console.log('Model loaded:', instance.getAnimations());
  },
  onError(error) {
    console.error('Failed to load model:', error);
  },
});
```

### 3.2 HTML Data-Attribute Initialization

All configuration is expressed via `data-ci-3d-*` attributes on the container element.

```html
<div
  data-ci-3d-src="https://example.com/models/sneaker.glb"
  data-ci-3d-alt="3D sneaker model"
  data-ci-3d-auto-rotate="true"
  data-ci-3d-auto-rotate-speed="0.3"
  data-ci-3d-shadows="true"
  data-ci-3d-environment-map="https://example.com/env/studio.hdr"
  data-ci-3d-tone-mapping="aces"
  data-ci-3d-theme="dark"
  data-ci-3d-fullscreen-button="true"
  data-ci-3d-screenshot-button="true"
  style="width: 100%; aspect-ratio: 16/9;"
></div>
```

**Auto-initialization (CDN usage):**

```html
<script src="https://unpkg.com/three@0.170.0/build/three.min.js"></script>
<script src="https://cdn.cloudimage.io/3d-view/1.2.1/3d-view.min.js"></script>
<script>CI3DView.autoInit();</script>
```

`CI3DView.autoInit()` scans the DOM for all elements with `data-ci-3d-src` and initializes each one. It returns an array of `CI3DViewInstance` objects.

```ts
CI3DView.autoInit(root?: HTMLElement): CI3DViewInstance[];
```

**Attribute mapping:**

| HTML Attribute | Config Property | Type |
|---|---|---|
| `data-ci-3d-src` | `src` | `string` |
| `data-ci-3d-mtl-src` | `mtlSrc` | `string` |
| `data-ci-3d-alt` | `alt` | `string` |
| `data-ci-3d-controls` | `controls` | `'true' \| 'false'` |
| `data-ci-3d-zoom` | `zoom` | `'true' \| 'false'` |
| `data-ci-3d-pan` | `pan` | `'true' \| 'false'` |
| `data-ci-3d-auto-rotate` | `autoRotate` | `'true' \| 'false'` |
| `data-ci-3d-auto-rotate-speed` | `autoRotateSpeed` | `string -> number` |
| `data-ci-3d-auto-rotate-delay` | `autoRotateDelay` | `string -> number` |
| `data-ci-3d-damping` | `damping` | `'true' \| 'false'` |
| `data-ci-3d-damping-factor` | `dampingFactor` | `string -> number` |
| `data-ci-3d-zoom-min` | `zoomMin` | `string -> number` |
| `data-ci-3d-zoom-max` | `zoomMax` | `string -> number` |
| `data-ci-3d-polar-angle-min` | `polarAngleMin` | `string -> number` |
| `data-ci-3d-polar-angle-max` | `polarAngleMax` | `string -> number` |
| `data-ci-3d-theme` | `theme` | `'light' \| 'dark'` |
| `data-ci-3d-background` | `background` | `string` |
| `data-ci-3d-show-progress` | `showProgress` | `'true' \| 'false'` |
| `data-ci-3d-fullscreen-button` | `fullscreenButton` | `'true' \| 'false'` |
| `data-ci-3d-screenshot-button` | `screenshotButton` | `'true' \| 'false'` |
| `data-ci-3d-screenshot-filename` | `screenshotFilename` | `string` |
| `data-ci-3d-screenshot-scale` | `screenshotScale` | `string -> number` |
| `data-ci-3d-shadows` | `shadows` | `'true' \| 'false'` |
| `data-ci-3d-shadow-opacity` | `shadowOpacity` | `string -> number` |
| `data-ci-3d-shadow-blur` | `shadowBlur` | `string -> number` |
| `data-ci-3d-environment-map` | `environmentMap` | `string` |
| `data-ci-3d-environment-background` | `environmentBackground` | `'true' \| 'false'` |
| `data-ci-3d-tone-mapping` | `toneMapping` | `'none' \| 'linear' \| 'reinhard' \| 'aces' \| 'filmic'` |
| `data-ci-3d-tone-mapping-exposure` | `toneMappingExposure` | `string -> number` |
| `data-ci-3d-draco` | `draco` | `'true' \| 'false'` |
| `data-ci-3d-draco-decoder-path` | `dracoDecoderPath` | `string` |
| `data-ci-3d-animation` | `animation` | `string \| number` |
| `data-ci-3d-auto-play-animation` | `autoPlayAnimation` | `'true' \| 'false'` |
| `data-ci-3d-animation-speed` | `animationSpeed` | `string -> number` |
| `data-ci-3d-camera-position` | `cameraPosition` | `JSON string -> [number, number, number]` |
| `data-ci-3d-camera-fov` | `cameraFov` | `string -> number` |
| `data-ci-3d-camera-target` | `cameraTarget` | `JSON string -> [number, number, number]` |
| `data-ci-3d-pixel-ratio` | `pixelRatio` | `string -> number` |
| `data-ci-3d-antialias` | `antialias` | `'true' \| 'false'` |
| `data-ci-3d-lighting` | `lighting` | `JSON string -> LightingConfig` |

> **Note:** Callback options (`onLoadStart`, `onProgress`, `onLoad`, `onError`, `onCameraChange`, `onFullscreenChange`) are only available via the JavaScript API, as functions cannot be expressed as HTML attributes. To attach callbacks to HTML-initialized instances, retrieve the instance from `autoInit()` return value and call methods on it.

---

## 4. 3D Model Loading

### 4.1 Format Auto-Detection

The library detects the model format from the file extension in the `src` URL:

| Extension | Format | Loader |
|---|---|---|
| `.glb` | glTF Binary | `GLTFLoader` (+ optional `DRACOLoader`) |
| `.gltf` | glTF JSON | `GLTFLoader` (+ optional `DRACOLoader`) |
| `.obj` | Wavefront OBJ | `OBJLoader` (+ optional `MTLLoader`) |

If the URL has no recognizable extension (e.g. a CDN URL with query parameters), the library attempts to fetch the first few bytes and detect the format from the magic bytes (`glTF` header for GLB) or falls back to treating it as GLB.

### 4.2 Loader Architecture

The library uses an internal `FormatLoader` interface to decouple format-specific loading from the core viewer. This enables future format support (FBX, STL, USDZ) without modifying the core.

```ts
interface FormatLoader {
  /** File extensions this loader handles (e.g. ['.glb', '.gltf']) */
  extensions: string[];

  /** Load a model from a URL and return a Three.js object */
  load(
    url: string,
    options: LoaderOptions,
    onProgress?: (progress: number) => void,
  ): Promise<THREE.Group>;
}

interface LoaderOptions {
  /** Material library URL (for OBJ format) */
  mtlUrl?: string;

  /** Enable Draco decompression (for glTF format) */
  draco?: boolean;

  /** Draco decoder path */
  dracoDecoderPath?: string;
}
```

**Built-in loaders:**

- `GLTFFormatLoader` — handles `.glb` and `.gltf` files using Three.js `GLTFLoader`. Configures `DRACOLoader` when `draco: true` (default).
- `OBJFormatLoader` — handles `.obj` files using Three.js `OBJLoader`. Loads materials from `mtlSrc` if provided, or auto-detects a co-located `.mtl` file (same filename, same directory).

**Registering custom loaders (future API):**

```ts
CI3DView.registerLoader(loader: FormatLoader): void;
```

### 4.3 GLB/glTF Loading Details

GLB/glTF is the primary format and receives first-class support:

- **Draco compression:** Enabled by default (`draco: true`). The Draco WASM decoder is loaded from the Three.js CDN (`https://www.gstatic.com/draco/versioned/decoders/1.5.7/`). Override with `dracoDecoderPath`.
- **Embedded textures:** Textures embedded in GLB files are loaded automatically.
- **External textures:** Textures referenced by relative paths in `.gltf` files are resolved relative to the `.gltf` URL.
- **Animations:** glTF `AnimationClip` objects are extracted and made available via the animation API.
- **PBR materials:** `MeshStandardMaterial` and `MeshPhysicalMaterial` are preserved as-is from the glTF.

### 4.4 OBJ+MTL Loading Details

OBJ is supported as a secondary format for legacy assets:

- **MTL auto-detection:** If `mtlSrc` is not provided, the library tries to load `{filename}.mtl` from the same directory as the `.obj` file. If it fails (404), materials fall back to a neutral gray `MeshStandardMaterial`.
- **Texture paths:** Texture paths in `.mtl` files are resolved relative to the `.mtl` URL.
- **Material upgrade:** OBJ `MeshPhongMaterial` is automatically upgraded to `MeshStandardMaterial` for consistent PBR rendering with environment maps.

### 4.5 Progress Reporting

Model loading progress is reported through two channels:

1. **`onProgress` callback:** Fires during loading with a normalized `0–1` value. For glTF files with embedded resources, this reflects the overall file download. For glTF + external textures, progress covers the main file only (textures load after).
2. **Built-in progress bar:** A visual progress bar displayed in the loading overlay (see [Section 5](#5-visual-design)). Shows percentage text and an animated fill bar.

### 4.6 Auto-Centering & Scaling

After loading, the model is automatically centered and scaled to fit the viewer:

1. **Compute bounding box:** Calculate the axis-aligned bounding box of the loaded model
2. **Center:** Translate the model so its bounding box center is at the world origin `(0, 0, 0)`
3. **Scale:** Uniformly scale the model so its largest dimension fits within a unit sphere (diameter = 2). This ensures consistent camera framing regardless of the model's original scale.
4. **Camera fit:** Position the camera at a distance that frames the model with ~20% padding on each side

### 4.7 Error Handling

Loading errors are handled gracefully:

- **Network errors:** If the model URL returns a non-2xx status or the fetch fails, `onError` is called with a descriptive `Error` and an error overlay is displayed in the container
- **Parse errors:** If the file is not a valid model format, `onError` fires with the parse error
- **Missing textures:** Logged as warnings; the model renders with fallback materials
- **Missing MTL:** Logged as a warning; the model renders with default gray materials
- **WebGL not supported:** If `WebGLRenderingContext` is not available, an error overlay is displayed with a "WebGL is required" message

**Error overlay:** A centered overlay with an error icon, error message, and optional "Retry" button. Styled via CSS variables (see [Section 5](#5-visual-design)).

---

## 5. Visual Design

### 5.1 CSS Variables (Primary Theming Mechanism)

All visual customization of UI overlays and controls is done via CSS custom properties. Consumers override colors and sizes by setting CSS variables on the container or any ancestor element.

```css
/* === Container === */
--ci-3d-container-bg: transparent;
--ci-3d-container-border-radius: 0;

/* === Progress Bar === */
--ci-3d-progress-bar-height: 4px;
--ci-3d-progress-bar-bg: rgba(0, 0, 0, 0.1);
--ci-3d-progress-bar-fill: #0058a3;
--ci-3d-progress-bar-border-radius: 2px;

/* === Loading Overlay === */
--ci-3d-loading-bg: rgba(255, 255, 255, 0.9);
--ci-3d-loading-color: #333333;
--ci-3d-loading-font-family: inherit;
--ci-3d-loading-font-size: 14px;
--ci-3d-loading-spinner-size: 40px;
--ci-3d-loading-spinner-color: #0058a3;
--ci-3d-loading-spinner-width: 3px;

/* === Error Overlay === */
--ci-3d-error-bg: rgba(255, 255, 255, 0.95);
--ci-3d-error-color: #cc0000;
--ci-3d-error-font-size: 14px;
--ci-3d-error-icon-size: 48px;
--ci-3d-error-retry-bg: #0058a3;
--ci-3d-error-retry-color: #ffffff;
--ci-3d-error-retry-border-radius: 8px;
--ci-3d-error-retry-padding: 8px 16px;

/* === Controls (fullscreen, screenshot) === */
--ci-3d-controls-bg: rgba(255, 255, 255, 0.9);
--ci-3d-controls-color: #333333;
--ci-3d-controls-border-radius: 8px;
--ci-3d-controls-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
--ci-3d-controls-size: 36px;
--ci-3d-controls-gap: 8px;

/* === Fullscreen Button === */
--ci-3d-fullscreen-btn-position-top: 12px;
--ci-3d-fullscreen-btn-position-right: 12px;

/* === Animation Controls === */
--ci-3d-animation-controls-bg: rgba(255, 255, 255, 0.9);
--ci-3d-animation-controls-color: #333333;
--ci-3d-animation-controls-border-radius: 8px;
--ci-3d-animation-controls-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

/* === Transitions === */
--ci-3d-transition-duration: 300ms;
--ci-3d-transition-timing: ease;
```

**Custom theming example:**

```css
/* Dark product showcase */
.product-3d-viewer {
  --ci-3d-container-bg: #1a1a1a;
  --ci-3d-progress-bar-fill: #4fc3f7;
  --ci-3d-loading-bg: rgba(26, 26, 26, 0.9);
  --ci-3d-loading-color: #f0f0f0;
  --ci-3d-loading-spinner-color: #4fc3f7;
  --ci-3d-controls-bg: rgba(30, 30, 30, 0.9);
  --ci-3d-controls-color: #f0f0f0;
}
```

### 5.2 Light & Dark Themes

Themes are implemented as sets of CSS variable overrides. Setting `theme: 'dark'` (or `data-ci-3d-theme="dark"`) applies the `ci-3d-theme-dark` class to the container, which activates dark variable values.

**Dark theme overrides:**

```css
.ci-3d-theme-dark {
  --ci-3d-container-bg: #1a1a1a;
  --ci-3d-progress-bar-bg: rgba(255, 255, 255, 0.1);
  --ci-3d-progress-bar-fill: #4fc3f7;
  --ci-3d-loading-bg: rgba(26, 26, 26, 0.9);
  --ci-3d-loading-color: #f0f0f0;
  --ci-3d-loading-spinner-color: #4fc3f7;
  --ci-3d-error-bg: rgba(26, 26, 26, 0.95);
  --ci-3d-error-color: #ff6b6b;
  --ci-3d-error-retry-bg: #4fc3f7;
  --ci-3d-controls-bg: rgba(30, 30, 30, 0.9);
  --ci-3d-controls-color: #f0f0f0;
  --ci-3d-animation-controls-bg: rgba(30, 30, 30, 0.9);
  --ci-3d-animation-controls-color: #f0f0f0;
}
```

### 5.3 DOM Structure

```
<div class="ci-3d-container" role="application" aria-label="{alt}">
  <canvas class="ci-3d-canvas"></canvas>
  <div class="ci-3d-loading" aria-live="polite">
    <div class="ci-3d-loading-spinner"></div>
    <div class="ci-3d-loading-text">Loading... 45%</div>
    <div class="ci-3d-progress-bar">
      <div class="ci-3d-progress-bar-fill" style="width: 45%"></div>
    </div>
  </div>
  <div class="ci-3d-error" role="alert" aria-live="assertive">
    <div class="ci-3d-error-icon"><!-- SVG --></div>
    <div class="ci-3d-error-message">Failed to load model</div>
    <button class="ci-3d-error-retry">Retry</button>
  </div>
  <div class="ci-3d-controls">
    <button class="ci-3d-fullscreen-btn" aria-label="Enter fullscreen">
      <!-- Lucide Maximize2 SVG -->
    </button>
    <button class="ci-3d-screenshot-btn" aria-label="Take screenshot">
      <!-- Lucide Camera SVG -->
    </button>
  </div>
  <div class="ci-3d-animation-controls">
    <button class="ci-3d-animation-play" aria-label="Play animation">
      <!-- Lucide Play SVG -->
    </button>
    <button class="ci-3d-animation-pause" aria-label="Pause animation">
      <!-- Lucide Pause SVG -->
    </button>
    <button class="ci-3d-animation-stop" aria-label="Stop animation">
      <!-- Lucide Square SVG -->
    </button>
    <select class="ci-3d-animation-select" aria-label="Select animation">
      <option value="0">Walk</option>
      <option value="1">Run</option>
    </select>
  </div>
</div>
```

- The loading overlay is visible during model download and hides when the model is ready
- The error overlay replaces the loading overlay when a loading error occurs
- Control buttons are only rendered if their corresponding config options are enabled
- Animation controls are only rendered if the loaded model contains animations

### 5.4 Reduced Motion

All CSS animations and transitions respect the `prefers-reduced-motion` media query:

```css
@media (prefers-reduced-motion: reduce) {
  .ci-3d-loading-spinner,
  .ci-3d-progress-bar-fill,
  .ci-3d-controls button {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
}
```

When reduced motion is preferred:
- Loading spinner uses a static icon instead of a rotating animation
- Progress bar fill transitions are instant
- Auto-rotate is disabled by default (can still be explicitly enabled)
- Button hover/focus transitions are instant

---

## 6. Camera & Controls

### 6.1 OrbitControls

Camera interaction is provided by Three.js `OrbitControls`. The library wraps `OrbitControls` with additional behavior:

- **Auto-fit on load:** Camera is positioned to frame the model with padding
- **Damping:** Smooth inertia enabled by default (`damping: true`, `dampingFactor: 0.1`)
- **Constraints:** Zoom and polar angle limits are auto-calculated from the model's bounding box, overridable via config

### 6.2 Input Methods

| Input | Behavior |
|---|---|
| **Left-click + drag** | Orbit (rotate camera around the model) |
| **Right-click + drag** | Pan (translate camera laterally) |
| **Middle-click + drag** | Pan (same as right-click) |
| **Mouse wheel** | Zoom in/out (dolly toward/away from target) |
| **Single-finger drag** (touch) | Orbit |
| **Two-finger drag** (touch) | Pan |
| **Pinch** (touch) | Zoom in/out |
| **Double-tap** (touch) | Reset camera to initial position |
| **Arrow Up / Down** (keyboard) | Orbit vertically |
| **Arrow Left / Right** (keyboard) | Orbit horizontally |
| **`+` / `=`** (keyboard) | Zoom in |
| **`-`** (keyboard) | Zoom out |
| **`0`** (keyboard) | Reset camera |
| **`R`** (keyboard) | Toggle auto-rotate |
| **`F`** (keyboard) | Toggle fullscreen |

### 6.3 Damping

Damping provides smooth, physics-like deceleration when the user releases the mouse/finger:

- **Enabled by default** (`damping: true`)
- **Factor:** `dampingFactor: 0.1` (range 0–1). Lower values = more smooth gliding, higher values = more responsive/snappy.
- **Implementation:** Uses `OrbitControls.enableDamping` and `dampingFactor`. The animation loop calls `controls.update()` every frame to apply damping.

### 6.4 Zoom Constraints

- **Min distance:** Auto-calculated as `modelRadius * 1.2` — prevents the camera from entering the model. Overridable via `zoomMin`.
- **Max distance:** Auto-calculated as `modelRadius * 5` — prevents zooming too far out. Overridable via `zoomMax`.
- **Smooth transitions:** Zoom changes from keyboard or programmatic API animate with the controls' damping.

### 6.5 Polar Angle Constraints

- **Min polar angle:** `0` (top-down view allowed by default). Set `polarAngleMin: 10` to prevent top-down.
- **Max polar angle:** `180` (bottom-up view allowed by default). Set `polarAngleMax: 170` to prevent bottom-up.
- Values are in degrees for the config API; internally converted to radians for Three.js.

### 6.6 Auto-Rotate

When `autoRotate: true`, the model rotates continuously around the vertical axis:

- **Speed:** `autoRotateSpeed: 0.5` revolutions per second (default). Positive = counter-clockwise, negative = clockwise.
- **Pause on interact:** Rotation pauses when the user starts orbiting, zooming, or panning.
- **Resume delay:** Rotation resumes after `autoRotateDelay` milliseconds (default: 3000) of no interaction.
- **Implementation:** Uses `OrbitControls.autoRotate` and `autoRotateSpeed`. A timeout handler manages the pause/resume behavior.

### 6.7 Camera Reset

Programmatic camera reset (`instance.resetCamera()` or pressing `0`) smoothly animates the camera back to its initial position and target using a TWEEN-like interpolation over 500ms.

### 6.8 Touch Gestures

Touch input is handled by `OrbitControls` with these defaults:

| Gesture | Action |
|---|---|
| **One finger drag** | Orbit |
| **Two finger drag** | Pan |
| **Pinch spread** | Zoom in |
| **Pinch squeeze** | Zoom out |
| **Double-tap** | Reset camera (custom handler, not built into OrbitControls) |

Touch events use `{ passive: false }` where needed to prevent default scroll behavior while interacting with the viewer.

---

## 7. Lighting & Environment

### 7.1 Default 3-Point Lighting

The library sets up a classic 3-point lighting rig by default, providing professional-looking illumination for most models without any configuration:

```
              Key Light
              (1.0 intensity)
              [5, 8, 5]
                 ╲
                  ╲
                   ╲
                    ●──────── Model
                   ╱         (center)
                  ╱
                 ╱
              Fill Light          Rim Light
              (0.5 intensity)     (0.7 intensity)
              [-5, 4, -3]        [0, 4, -8]
```

**Default light configuration:**

| Light | Type | Intensity | Color | Position | Shadows |
|---|---|---|---|---|---|
| **Ambient** | `AmbientLight` | 0.4 | `#ffffff` | N/A | N/A |
| **Key** | `DirectionalLight` | 1.0 | `#ffffff` | `[5, 8, 5]` | Yes |
| **Fill** | `DirectionalLight` | 0.5 | `#ffffff` | `[-5, 4, -3]` | No |
| **Rim** | `DirectionalLight` | 0.7 | `#ffffff` | `[0, 4, -8]` | No |

- **Key light:** Main light source, positioned above-right-front. Casts shadows.
- **Fill light:** Soft secondary light from the opposite side, reduces harsh shadows.
- **Rim light:** Backlight behind and above the model, creates edge definition and separates the model from the background.
- **Ambient:** Flat omnidirectional light to fill in completely dark areas.

All lights are configurable via the `lighting` config option. Set any intensity to `0` to disable that light.

### 7.2 Image-Based Lighting (IBL)

When `environmentMap` is provided, the library loads an HDR/EXR environment map and uses it for image-based lighting:

- **Loader:** `RGBELoader` for `.hdr` files, `EXRLoader` for `.exr` files (auto-detected from extension)
- **Application:** The environment map is set on `scene.environment` for IBL (all PBR materials reflect it) and optionally on `scene.background` if `environmentBackground: true`
- **Interaction with lights:** When an environment map is active, the default 3-point lighting is reduced to 50% intensity to avoid over-lighting. This can be overridden by explicitly setting light intensities.

### 7.3 Tone Mapping

Tone mapping controls how HDR lighting values are mapped to the display's LDR range:

| Mode | Three.js Constant | Description |
|---|---|---|
| `'none'` | `NoToneMapping` | No tone mapping; raw linear values |
| `'linear'` | `LinearToneMapping` | Simple linear scaling |
| `'reinhard'` | `ReinhardToneMapping` | Soft rolloff in highlights |
| `'aces'` (default) | `ACESFilmicToneMapping` | Filmic curve; best for product visualization |
| `'filmic'` | `CineonToneMapping` | Cineon film emulation; slightly desaturated |

**Exposure:** `toneMappingExposure` (default: 1.0) scales the overall brightness. Values above 1.0 brighten the scene; below 1.0 darken it.

### 7.4 Ground Plane Shadows

When `shadows: true` (default), a transparent ground plane is placed beneath the model to receive contact shadows:

```
         ┌─────────┐
         │  Model   │
         │         │
         └────┬────┘
    ══════════╧══════════  ← Ground plane (invisible mesh)
         ░░░░░░░░░░░      ← Shadow (ShadowMaterial)
```

- **Shadow type:** `PCFSoftShadowMap` for smooth shadow edges
- **Ground plane:** A `PlaneGeometry` with `ShadowMaterial` (transparent, receives shadows only). Positioned at the bottom of the model's bounding box.
- **Opacity:** Configurable via `shadowOpacity` (default: 0.3)
- **Blur:** Configurable via `shadowBlur` (default: 2). Implemented by increasing the shadow map's `radius` parameter.
- **Auto-sizing:** The ground plane automatically sizes to 3x the model's footprint diameter.

---

## 8. React Wrapper API

### 8.1 Entry Point

```ts
import { CI3DViewer, useCI3DView } from '@cloudimage/3d-view/react';
```

The React wrapper is a **separate entry point** to avoid bundling React for vanilla JS consumers. React is an **optional peer dependency**.

### 8.2 `<CI3DViewer>` Component

```tsx
interface CI3DViewerProps {
  src: string;
  mtlSrc?: string;
  alt?: string;
  controls?: boolean;
  zoom?: boolean;
  pan?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  autoRotateDelay?: number;
  damping?: boolean;
  dampingFactor?: number;
  zoomMin?: number;
  zoomMax?: number;
  polarAngleMin?: number;
  polarAngleMax?: number;
  theme?: 'light' | 'dark';
  background?: string;
  showProgress?: boolean;
  fullscreenButton?: boolean;
  screenshotButton?: boolean;
  screenshotFilename?: string;
  screenshotScale?: number;
  shadows?: boolean;
  shadowOpacity?: number;
  shadowBlur?: number;
  lighting?: LightingConfig;
  environmentMap?: string;
  environmentBackground?: boolean;
  toneMapping?: CI3DViewConfig['toneMapping'];
  toneMappingExposure?: number;
  draco?: boolean;
  dracoDecoderPath?: string;
  animation?: number | string;
  autoPlayAnimation?: boolean;
  animationSpeed?: number;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  cameraTarget?: [number, number, number];
  pixelRatio?: number;
  antialias?: boolean;
  onLoadStart?: () => void;
  onProgress?: (progress: number) => void;
  onLoad?: (instance: CI3DViewInstance) => void;
  onError?: (error: Error) => void;
  onCameraChange?: (position: { x: number; y: number; z: number }, target: { x: number; y: number; z: number }) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}
```

**Usage example:**

```tsx
import { CI3DViewer } from '@cloudimage/3d-view/react';

function ProductViewer() {
  return (
    <CI3DViewer
      src="/models/sneaker.glb"
      alt="3D sneaker model"
      autoRotate
      shadows
      environmentMap="/env/studio.hdr"
      toneMapping="aces"
      onLoad={(instance) => console.log('Loaded:', instance.getAnimations())}
      onError={(error) => console.error('Error:', error)}
      style={{ width: '100%', aspectRatio: '16/9' }}
    />
  );
}
```

### 8.3 `useCI3DView` Hook

Provides direct access to the vanilla `CI3DViewInstance` for imperative control:

```tsx
import { useCI3DView } from '@cloudimage/3d-view/react';

function ProductViewer() {
  const { containerRef, instance } = useCI3DView({
    src: '/models/sneaker.glb',
    autoRotate: true,
    shadows: true,
  });

  return (
    <>
      <div ref={containerRef} style={{ width: '100%', aspectRatio: '16/9' }} />
      <button onClick={() => instance.current?.resetCamera()}>Reset Camera</button>
      <button onClick={() => instance.current?.setAutoRotate(false)}>Stop Rotation</button>
      <button onClick={() => instance.current?.downloadScreenshot()}>Screenshot</button>
    </>
  );
}
```

### 8.4 Ref API

The `<CI3DViewer>` component forwards a ref exposing instance methods:

```tsx
import { useRef } from 'react';
import { CI3DViewer, CI3DViewerRef } from '@cloudimage/3d-view/react';

function ProductViewer() {
  const viewerRef = useRef<CI3DViewerRef>(null);

  return (
    <>
      <CI3DViewer ref={viewerRef} src="/models/sneaker.glb" autoRotate shadows />
      <button onClick={() => viewerRef.current?.resetCamera()}>Reset</button>
      <button onClick={() => viewerRef.current?.playAnimation('Walk')}>Walk</button>
      <button onClick={() => viewerRef.current?.screenshot()}>Capture</button>
      <button onClick={() => viewerRef.current?.enterFullscreen()}>Fullscreen</button>
    </>
  );
}
```

### 8.5 SSR Safety

The React wrapper is SSR-safe:

- The vanilla core is instantiated inside `useEffect` (client-only)
- No `window`, `document`, `navigator`, or `WebGLRenderingContext` access during server rendering
- The component renders an empty container `<div>` on the server; hydration attaches the 3D viewer
- Three.js is only imported dynamically on the client side

---

## 9. Accessibility

### 9.1 WCAG 2.1 AA Compliance

The library targets WCAG 2.1 Level AA conformance across all interactive UI elements. The 3D canvas itself is inherently visual, but all overlay controls, loading states, and error messages are fully accessible.

### 9.2 Keyboard Navigation

| Key | Action |
|---|---|
| `Tab` | Move focus to the next interactive element (canvas, buttons, animation select) |
| `Shift + Tab` | Move focus to the previous interactive element |
| `Arrow Up` | Orbit camera up |
| `Arrow Down` | Orbit camera down |
| `Arrow Left` | Orbit camera left |
| `Arrow Right` | Orbit camera right |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| `0` | Reset camera to initial position |
| `R` | Toggle auto-rotate |
| `F` | Toggle fullscreen |
| `Space` | Play/pause animation (when animation controls are present) |
| `Enter` | Activate focused button |
| `Escape` | Exit fullscreen (when in fullscreen mode) |

Keyboard controls for orbiting and zooming are only active when the canvas or container has focus. This prevents conflicts with page-level keyboard shortcuts.

### 9.3 ARIA Attributes

**Container:**

```html
<div
  class="ci-3d-container"
  role="application"
  aria-label="3D model viewer: {alt}"
  aria-roledescription="3D viewer"
  tabindex="0"
>
```

**Canvas:**

```html
<canvas
  class="ci-3d-canvas"
  role="img"
  aria-label="{alt}"
></canvas>
```

**Controls:**

```html
<button class="ci-3d-fullscreen-btn" aria-label="Enter fullscreen" aria-pressed="false">
<button class="ci-3d-screenshot-btn" aria-label="Take screenshot">
<button class="ci-3d-animation-play" aria-label="Play animation">
<button class="ci-3d-animation-pause" aria-label="Pause animation">
<button class="ci-3d-animation-stop" aria-label="Stop animation">
<select class="ci-3d-animation-select" aria-label="Select animation">
```

**Loading state:**

```html
<div class="ci-3d-loading" aria-live="polite">
  <div class="ci-3d-loading-text">Loading model... 45%</div>
</div>
```

**Error state:**

```html
<div class="ci-3d-error" role="alert" aria-live="assertive">
  <div class="ci-3d-error-message">Failed to load model</div>
  <button class="ci-3d-error-retry">Retry</button>
</div>
```

### 9.4 Focus Management

- **Canvas focus:** The container is focusable (`tabindex="0"`). When focused, keyboard orbit/zoom controls are active. A visible focus ring is displayed via `:focus-visible`.
- **Button focus:** All control buttons display a visible focus ring and respond to `Enter` / `Space`.
- **Loading state:** When loading completes, focus is not automatically moved (avoids disorientation). The `aria-live="polite"` region announces completion.
- **Error state:** When an error occurs, the error message is announced via `aria-live="assertive"`. The Retry button receives focus.
- **Fullscreen:** When entering fullscreen, focus is moved to the container. When exiting, focus returns to the fullscreen button.

### 9.5 Screen Reader Support

- The container uses `role="application"` with `aria-roledescription="3D viewer"` to signal interactive content
- The canvas has `role="img"` with the `alt` text as `aria-label`
- Loading progress is announced via `aria-live="polite"` — screen readers announce progress updates at natural pauses
- Errors are announced via `aria-live="assertive"` — screen readers interrupt to announce the error
- Fullscreen state changes update `aria-pressed` on the fullscreen button and `aria-label` text
- All buttons have descriptive `aria-label` attributes

### 9.6 Reduced Motion

When `prefers-reduced-motion: reduce` is active:

- Auto-rotate is disabled by default (can still be explicitly enabled with `autoRotate: true`)
- Loading spinner uses a static icon
- Progress bar transitions are instant
- Camera reset animations are instant (no smooth interpolation)
- Control button hover/focus transitions are instant

---

## 10. Build & Distribution

### 10.1 Build Tool

**Vite** is used as the build tool, following the pattern established by Scaleflex's `cloudimage-360` and `js-cloudimage-hotspot` projects.

### 10.2 Output Formats

| Format | File | Use Case |
|---|---|---|
| **ESM** | `dist/@cloudimage/3d-view.esm.js` | Modern bundlers (Webpack, Vite, Rollup) |
| **CJS** | `dist/@cloudimage/3d-view.cjs.js` | Node.js, legacy bundlers |
| **UMD** | `dist/@cloudimage/3d-view.min.js` | CDN `<script>` tag, exposes `window.CI3DView` |
| **TypeScript** | `dist/index.d.ts` | Type definitions |
| **React ESM** | `dist/react/index.js` | React wrapper (ESM) |
| **React CJS** | `dist/react/index.cjs` | React wrapper (CJS) |
| **React Types** | `dist/react/index.d.ts` | React wrapper type definitions |

### 10.3 `package.json` Configuration

```json
{
  "name": "@cloudimage/3d-view",
  "version": "1.0.0",
  "description": "Interactive 3D model viewer with orbit controls, lighting, and accessibility",
  "license": "MIT",
  "author": "Scaleflex",
  "main": "dist/@cloudimage/3d-view.cjs.js",
  "module": "dist/@cloudimage/3d-view.esm.js",
  "unpkg": "dist/@cloudimage/3d-view.min.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/@cloudimage/3d-view.esm.js",
      "require": "./dist/@cloudimage/3d-view.cjs.js"
    },
    "./react": {
      "types": "./dist/react/index.d.ts",
      "import": "./dist/react/index.js",
      "require": "./dist/react/index.cjs"
    }
  },
  "files": [
    "dist"
  ],
  "peerDependencies": {
    "three": ">=0.150.0",
    "react": ">=17.0.0",
    "react-dom": ">=17.0.0"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true },
    "react-dom": { "optional": true }
  },
  "sideEffects": false
}
```

### 10.4 npm Scripts

| Script | Description |
|---|---|
| `dev` | Start Vite dev server with demo page |
| `dev:react` | Start Vite dev server with React demo |
| `build` | Build all formats (main bundle + React wrapper + type declarations) |
| `build:bundle` | Build main bundle only (ESM + CJS + UMD) |
| `build:react` | Build React wrapper only |
| `build:demo` | Build GitHub Pages demo site |
| `typecheck` | Run TypeScript type checking |
| `typecheck:emit` | Emit type declarations to `dist/` |
| `test` | Run tests with Vitest |
| `test:watch` | Run tests in watch mode |
| `test:coverage` | Run tests with coverage report |
| `lint` | Run ESLint |

### 10.5 Bundle Size Targets

| Bundle | Target |
|---|---|
| Core (UMD, minified + gzipped, excluding Three.js) | < 25 KB |
| Core (ESM, minified + gzipped, excluding Three.js) | < 20 KB |
| React wrapper (ESM, minified + gzipped) | < 3 KB |

> **Note:** These targets exclude Three.js itself (~150 KB gzipped). Three.js is externalized as a peer dependency and must be provided by the consumer.

### 10.6 CDN Usage

For CDN consumers, both Three.js and the library must be loaded:

```html
<!-- Three.js (peer dependency) -->
<script src="https://unpkg.com/three@0.170.0/build/three.min.js"></script>

<!-- @cloudimage/3d-view -->
<script src="https://cdn.cloudimage.io/3d-view/1.2.1/3d-view.min.js"></script>
```

The UMD build references `three` as an external global (`window.THREE`). When loaded via `<script>` tags in the correct order, `window.CI3DView` is available for initialization.

### 10.7 Three.js as Peer Dependency

Three.js is **not bundled** into the library. It is declared as a `peerDependency` (`>=0.150.0`):

- **Bundler consumers:** `npm install three @cloudimage/3d-view` — the bundler handles deduplication
- **CDN consumers:** Load Three.js via a `<script>` tag before the library
- **Why external:** Three.js is ~150 KB gzipped. Bundling it would make the library unusably large. Externalizing it also allows consumers to share a single Three.js instance across multiple libraries.

Three.js addons (`OrbitControls`, `GLTFLoader`, `OBJLoader`, `MTLLoader`, `DRACOLoader`, `RGBELoader`, `EXRLoader`) are imported from `three/addons/` (or `three/examples/jsm/` for older versions). The UMD build maps these to `window.THREE`.

---

## 11. Project Structure

```
@cloudimage/3d-view/
├── src/
│   ├── index.ts                    # Main entry — CI3DView class + autoInit
│   ├── core/
│   │   ├── ci-3d-view.ts           # Core class implementation
│   │   ├── config.ts               # Config parsing, defaults, data-attr mapping
│   │   ├── renderer.ts             # Three.js renderer setup (WebGLRenderer, resize, pixel ratio)
│   │   ├── scene.ts                # Scene setup (camera, controls, animation loop)
│   │   └── types.ts                # TypeScript interfaces and types
│   ├── loaders/
│   │   ├── loader-registry.ts      # Format detection and loader dispatch
│   │   ├── format-loader.ts        # FormatLoader interface definition
│   │   ├── gltf-loader.ts          # GLB/glTF loader (GLTFLoader + DRACOLoader)
│   │   └── obj-loader.ts           # OBJ+MTL loader (OBJLoader + MTLLoader)
│   ├── lighting/
│   │   ├── lighting.ts             # 3-point lighting setup
│   │   ├── environment.ts          # HDR/EXR environment map loading and application
│   │   └── shadows.ts              # Ground plane shadow setup
│   ├── controls/
│   │   ├── orbit-controls.ts       # OrbitControls wrapper (damping, constraints, auto-rotate)
│   │   ├── auto-rotate.ts          # Auto-rotate with pause-on-interact logic
│   │   └── camera-reset.ts         # Smooth camera reset animation
│   ├── animation/
│   │   ├── animation-mixer.ts      # AnimationMixer wrapper for glTF animations
│   │   └── animation-controls.ts   # Play/pause/stop UI and animation selection
│   ├── ui/
│   │   ├── loading.ts              # Loading overlay with progress bar
│   │   ├── error.ts                # Error overlay with retry button
│   │   ├── fullscreen.ts           # Fullscreen API wrapper and toggle button
│   │   └── screenshot.ts           # Screenshot capture and download
│   ├── a11y/
│   │   ├── keyboard.ts             # Keyboard navigation handler (orbit, zoom, shortcuts)
│   │   ├── focus.ts                # Focus management
│   │   └── aria.ts                 # ARIA attribute management
│   ├── utils/
│   │   ├── dom.ts                  # DOM utilities
│   │   ├── math.ts                 # Bounding box, auto-center, auto-scale calculations
│   │   ├── dispose.ts              # Three.js resource disposal (geometries, materials, textures)
│   │   └── events.ts               # Event emitter / listener helpers
│   ├── styles/
│   │   └── index.css               # All styles (injected at runtime or importable)
│   └── react/
│       ├── index.ts                # React entry point
│       ├── ci-3d-viewer.tsx         # React component
│       ├── use-ci-3d-view.ts        # React hook
│       └── types.ts                # React-specific types
├── demo/
│   ├── index.html                  # Vanilla JS demo page (GitHub Pages)
│   ├── demo.css                    # Demo-specific layout styles
│   ├── demo.ts                     # Demo initialization
│   ├── configurator.ts             # Interactive playground with code generation
│   └── react-demo/
│       ├── index.html              # React demo entry
│       ├── app.tsx                  # React demo application
│       └── main.tsx                # React demo mount
├── examples/
│   ├── vanilla/
│   │   ├── index.html              # Vanilla JS CodeSandbox example
│   │   ├── index.js                # Vanilla JS example code
│   │   ├── package.json            # Example dependencies
│   │   ├── vite.config.js          # Vite config for sandbox
│   │   └── sandbox.config.json     # CodeSandbox config
│   └── react/
│       ├── index.html              # React CodeSandbox example
│       ├── package.json            # Example dependencies
│       ├── vite.config.js          # Vite config for sandbox
│       ├── sandbox.config.json     # CodeSandbox config
│       └── src/
│           ├── App.jsx             # React example app
│           └── index.jsx           # React example mount
├── tests/
│   ├── core.test.ts                # Core functionality tests
│   ├── loaders.test.ts             # Model loading tests (GLB, OBJ, format detection)
│   ├── lighting.test.ts            # Lighting and environment map tests
│   ├── controls.test.ts            # OrbitControls, auto-rotate, camera reset tests
│   ├── animation.test.ts           # Animation playback tests
│   ├── ui.test.ts                  # Loading, error, fullscreen, screenshot tests
│   ├── a11y.test.ts                # Accessibility tests
│   ├── data-attr.test.ts           # HTML data-attribute init tests
│   ├── react.test.tsx              # React wrapper tests
│   ├── dispose.test.ts             # Resource disposal tests
│   ├── integration.test.ts         # End-to-end integration tests
│   ├── edge-cases.test.ts          # Edge case tests (SSR, WebGL loss, rapid ops)
│   └── setup.ts                    # Test setup (jsdom, WebGL mocks)
├── config/
│   ├── vite.config.ts              # Main bundle build config
│   ├── vite.react.config.ts        # React wrapper build config
│   └── vite.demo.config.ts         # Demo build config
├── dist/                           # Built output
│   ├── @cloudimage/3d-view.min.js
│   └── @cloudimage/3d-view.min.js.map
├── .github/
│   └── workflows/
│       ├── deploy-demo.yml         # GitHub Pages deployment workflow
│       └── deploy-pages.yml        # GitHub Pages build workflow
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── .eslintrc.cjs
├── .gitignore
├── LICENSE
├── README.md
├── CHANGELOG.md
├── IMPLEMENTATION.md               # Implementation record
└── docs/
    └── SPECS.md                    # This file
```

---

## 12. GitHub Pages Demo

The demo site is hosted at `https://scaleflex.github.io/@cloudimage/3d-view/` and deployed via GitHub Actions.

### 12.1 Demo Sections

| Section | Description |
|---|---|
| **Hero** | Gradient background with "Open Source Library" badge, animated heading, feature pills (Orbit Controls, Auto-Rotate, HDR Lighting, Shadows, React Ready), dual CTA buttons (Get Started / GitHub), sandbox links, and a live 3D viewer with auto-rotate |
| **Getting Started** | Side-by-side npm and CDN installation cards with dark-themed code blocks and copy-to-clipboard. CDN example shows both Three.js and library script tags. |
| **Format Support** | 2-column grid showing a GLB model and an OBJ model side-by-side, demonstrating format auto-detection |
| **Lighting & Environment** | Live viewer with toggle controls: 3-point lighting on/off, HDR environment map toggle, shadows toggle, tone mapping mode selector |
| **Animation Playback** | Animated model (e.g. character or mechanical part) with play/pause/stop controls and animation speed slider |
| **Interactive Configurator** | Two-panel layout (controls + preview) with toggles (auto-rotate, shadows, fullscreen button, screenshot button, damping) and selects (tone mapping, theme, background color). Real-time generated code with copy button |
| **React Integration** | Code example showing `<CI3DViewer>` component usage with props |
| **Footer** | Modern footer with Scaleflex logo, links to documentation, GitHub, npm |

The demo uses a **sticky navigation bar** with Scaleflex SVG logo, backdrop-filter blur effect, scroll-aware active link highlighting, and a **responsive burger menu** that collapses the nav links into a toggleable dropdown on screens below 868px.

### 12.2 Interactive Configurator

A panel that lets visitors:

- Toggle configuration options: auto-rotate, shadows, fullscreen button, screenshot button, damping
- Select values: tone mapping mode, theme, background color
- Adjust sliders: auto-rotate speed, shadow opacity, tone mapping exposure
- See the generated JavaScript code update in real-time
- Copy the generated code to clipboard

The configurator uses `instance.update()` to apply changes without recreating the viewer, with `minHeight` pinning to prevent layout shift during DOM updates.

### 12.3 Demo Assets

Demo models are royalty-free 3D models in GLB format:

- **Sneaker/shoe model** — hero section and configurator
- **Animated character** — animation playback demo
- **Furniture piece** — format support section (GLB + OBJ versions)
- **HDR studio environment** — lighting demo

All demo assets are served via `https://scaleflex.cloudimg.io/v7/plugins/@cloudimage/3d-view/` or from public model repositories.

---

## 13. Additional Features

### 13.1 Screenshot

Capture the current 3D view as a PNG image:

- **`instance.screenshot(scale?)`** — returns a data URL of the canvas content
- **`instance.downloadScreenshot(filename?, scale?)`** — triggers a browser download of the PNG
- **Scale:** Resolution multiplier. `scale: 2` (default) captures at 2x the canvas resolution for high-DPI output.
- **Implementation:** Renders one frame with `preserveDrawingBuffer: true`, calls `canvas.toDataURL('image/png')`, then triggers download via a temporary `<a>` element.
- **UI button:** When `screenshotButton: true`, a camera icon button appears in the controls bar. Lucide `Camera` SVG icon.

### 13.2 Animation Playback

For models with embedded animations (glTF `AnimationClip` objects):

- **Auto-play:** `autoPlayAnimation: true` plays the first animation immediately after load
- **Select by name/index:** `animation: 'Walk'` or `animation: 0` plays a specific animation on load
- **Playback speed:** `animationSpeed: 1.0` (default). `0.5` = half speed, `2.0` = double speed.
- **Programmatic API:**
  - `playAnimation(indexOrName?)` — start/resume playback
  - `pauseAnimation()` — pause at current frame
  - `stopAnimation()` — stop and reset to first frame
  - `setAnimationSpeed(speed)` — change playback speed
  - `getAnimations()` — list available animation names
- **UI controls:** When animations are present, a control bar appears at the bottom of the container with play/pause/stop buttons and an animation selection dropdown.
- **Implementation:** Uses Three.js `AnimationMixer` and `AnimationAction`. The animation loop updates the mixer on each frame via `mixer.update(delta)`.

### 13.3 Wireframe Toggle (v1.1)

A debug visualization mode that renders the model in wireframe:

- Toggle via `instance.setWireframe(enabled)` or a UI button
- Applies `material.wireframe = true` to all mesh materials in the scene
- Preserves original material state for toggling back

### 13.4 Bounding Box Helper (v1.1)

A debug visualization mode that shows the model's bounding box:

- Toggle via `instance.setBoundingBox(enabled)` or a UI button
- Renders a `THREE.Box3Helper` around the model

### 13.5 WebGL Context Loss Handling

The library handles WebGL context loss gracefully:

- **`webglcontextlost` event:** Pauses the animation loop, shows a "Restoring..." overlay
- **`webglcontextrestored` event:** Reinitializes the renderer, reloads the model, restores camera position and controls state
- **Permanent loss:** If context is not restored within 5 seconds, shows an error overlay with a "Reload" button

### 13.6 Responsive Container

The viewer automatically handles container resize:

- A `ResizeObserver` monitors the container element
- On resize, the Three.js renderer and camera aspect ratio are updated
- Resize handling is debounced (16ms) to match the frame rate
- The canvas always fills its container at 100% width and height

### 13.7 Resource Disposal

The `destroy()` method performs complete cleanup to prevent memory leaks:

1. **Stop animation loop:** Cancel the `requestAnimationFrame` callback
2. **Dispose Three.js objects:** Traverse the scene graph and dispose all geometries, materials, and textures
3. **Dispose renderer:** Call `renderer.dispose()` and remove the canvas from the DOM
4. **Dispose controls:** Call `controls.dispose()`
5. **Remove event listeners:** Remove all keyboard, mouse, touch, resize, and fullscreen listeners
6. **Remove DOM elements:** Remove all overlay elements (loading, error, controls) from the container
7. **Null references:** Clear all internal references to allow garbage collection

---

## 14. Competitor Feature Matrix

| Feature | @cloudimage/3d-view | `<model-viewer>` | Three.js (raw) | react-three-fiber | Babylon.js Viewer | Sketchfab Embed |
|---|---|---|---|---|---|---|
| **TypeScript** | Yes (first-class) | Yes | Yes (types available) | Yes | Yes | No (iframe) |
| **Framework** | Vanilla + React | Web Component | Vanilla | React only | Vanilla | iframe |
| **Bundle Size** (excl. engine) | < 25 KB gz | ~80 KB gz | 0 (raw Three.js) | ~25 KB gz | ~120 KB gz | N/A |
| **3D Engine** | Three.js (external) | Own fork of Three.js | Three.js | Three.js | Babylon.js | Proprietary |
| **GLB/glTF** | Yes | Yes | Manual setup | Manual setup | Yes | Yes |
| **OBJ+MTL** | Yes | No | Manual setup | Manual setup | Yes | Yes |
| **Draco Compression** | Yes (auto) | Yes (auto) | Manual setup | Manual setup | Yes | Yes |
| **Orbit Controls** | Yes (configurable) | Yes (limited config) | Manual setup | Manual setup | Yes | Yes |
| **Auto-Rotate** | Yes (pause/resume) | Yes | Manual setup | Manual setup | Yes | Yes |
| **3-Point Lighting** | Yes (default) | Fixed IBL | Manual setup | Manual setup | Default scene | N/A |
| **HDR Environment Maps** | Yes | Yes | Manual setup | Manual setup | Yes | N/A |
| **Shadows** | Yes (ground plane) | No | Manual setup | Manual setup | Yes | Yes |
| **Animation Playback** | Yes (UI + API) | Yes (limited) | Manual setup | Manual setup | Yes | Yes |
| **Screenshot** | Yes | No | Manual | Manual | No | Paid API |
| **Fullscreen** | Yes | No | Manual | Manual | Yes | Yes |
| **Accessibility (WCAG)** | AA compliant | Partial | None | None | None | None |
| **Keyboard Controls** | Full (orbit, zoom, pan) | Partial | None | None | None | Partial |
| **CSS Theming** | CSS variables | CSS parts | N/A | N/A | N/A | N/A |
| **HTML Init** | Yes (data-attrs) | Yes (attributes) | No | No (JSX) | No | iframe params |
| **React Support** | Yes (wrapper) | Via Web Component | No | Native | No | Via iframe |
| **Progressive Loading** | Yes (progress bar) | Yes (poster + loading) | Manual | Manual | Yes | Yes |
| **Boilerplate** | ~5 lines | ~3 lines (HTML) | ~100+ lines | ~50+ lines | ~10 lines | ~3 lines (iframe) |
| **Customization** | Full Three.js access | Limited | Unlimited | Unlimited | Full Babylon access | None |
| **License** | MIT | Apache 2.0 | MIT | MIT | Apache 2.0 | Proprietary |

### Key Differentiators

1. **Turnkey + customizable:** The simplicity of `<model-viewer>` (few lines to get started) with full Three.js scene access for advanced customization
2. **Dual initialization** (JS API + HTML data-attributes) — `<model-viewer>` has attributes but no JS constructor API; Three.js and r3f have no HTML init
3. **Multi-format** support (GLB + OBJ) out of the box with extensible loader architecture — `<model-viewer>` only supports GLB/glTF
4. **Full accessibility** with keyboard orbit/zoom/pan controls and screen reader support — no competitor offers comprehensive 3D viewer accessibility
5. **CSS variable theming** for all UI overlays — no competitor uses CSS custom properties for theming
6. **React wrapper as a first-class citizen** — not a web component workaround, not React-only
7. **Three.js externalized** — consumers control the Three.js version, share it with other libraries, and keep the bundle small

---

## 15. Roadmap

### v1.0 — Core Release

- Core viewer with Three.js renderer setup (WebGLRenderer, resize, pixel ratio, antialias)
- GLB/glTF loading with Draco decompression support
- OBJ+MTL loading with material auto-upgrade
- Format auto-detection from file extension
- Auto-centering and auto-scaling of loaded models
- OrbitControls with orbit, zoom, pan, and damping
- Configurable zoom and polar angle constraints
- Auto-rotate with pause-on-interact and configurable resume delay
- 3-point lighting (ambient, key, fill, rim) with per-light configuration
- HDR/EXR environment map loading for image-based lighting
- Tone mapping (none, linear, reinhard, ACES, filmic) with exposure control
- Ground plane contact shadows with configurable opacity and blur
- Loading overlay with progress bar and percentage text
- Error overlay with retry button
- Fullscreen toggle button with Fullscreen API
- Screenshot capture and download
- glTF animation playback (play/pause/stop, speed, selection by name/index)
- Animation controls UI (play/pause/stop buttons, animation dropdown)
- Full keyboard navigation (orbit, zoom, pan, shortcuts)
- WCAG 2.1 AA accessibility (ARIA attributes, focus management, screen reader support)
- Reduced motion support
- CSS variable theming (light and dark themes)
- JavaScript API initialization (`new CI3DView()`)
- HTML data-attribute initialization (`CI3DView.autoInit()`)
- React wrapper (`CI3DViewer` component, `useCI3DView` hook, ref API)
- SSR compatibility
- TypeScript type definitions
- ESM + CJS + UMD build output (Three.js externalized)
- Resource disposal and cleanup
- WebGL context loss handling
- Responsive container with ResizeObserver
- GitHub Pages demo site with interactive configurator
- Vitest test suite
- < 25 KB gzipped bundle (excluding Three.js)

### v1.1 — Polish & Debug Tools

- Wireframe toggle mode
- Bounding box helper visualization
- Performance optimizations (frustum culling, LOD hints)
- Additional camera presets (front, back, top, left, right)
- Camera animation/flyto API
- Improved touch gesture handling
- Additional CSS variable hooks for deeper customization
- Community-requested features and bug fixes
- Expanded test coverage
- Documentation improvements

### v1.2 — More Formats & AR

- **FBX loader** — `FBXLoader` for legacy 3D assets
- **STL loader** — `STLLoader` for CAD/3D printing models
- **USDZ loader** — Apple's 3D format for AR Quick Look integration
- **AR button** — Launch AR Quick Look (iOS) or Scene Viewer (Android) with the loaded model
- **Custom loader registration** — `CI3DView.registerLoader()` public API

### v2.0 — Future Vision

- **3D Annotations/Hotspots** — clickable markers placed on the 3D model surface (integrating with `js-cloudimage-hotspot` patterns)
- **Plugin system** — community extensions for custom controls, post-processing effects, etc.
- **Multi-model scenes** — load and arrange multiple models in a single scene
- **Post-processing** — bloom, SSAO, outline effects via Three.js `EffectComposer`
- **Vue wrapper** — `<CI3DViewer>` component for Vue 3
- **Svelte wrapper** — `<CI3DViewer>` component for Svelte

---

## 16. Appendices

### A. CSS Class Reference

All CSS classes use the `ci-3d` prefix.

| Class | Element | Description |
|---|---|---|
| `.ci-3d-container` | Outer wrapper | Root container; `position: relative; overflow: hidden` |
| `.ci-3d-container--fullscreen` | Outer wrapper | Applied when in fullscreen mode; `width: 100vw; height: 100vh; background: black` |
| `.ci-3d-canvas` | `<canvas>` | Three.js WebGL canvas; `width: 100%; height: 100%` |
| `.ci-3d-loading` | Loading overlay | Centered overlay shown during model loading |
| `.ci-3d-loading--hidden` | Loading overlay | Applied when loading is complete (triggers fade-out) |
| `.ci-3d-loading-spinner` | Spinner element | Rotating spinner animation |
| `.ci-3d-loading-text` | `<div>` | "Loading... 45%" text |
| `.ci-3d-progress-bar` | Progress bar track | Background track for the progress bar |
| `.ci-3d-progress-bar-fill` | Progress bar fill | Animated fill element (`width` driven by loading progress) |
| `.ci-3d-error` | Error overlay | Centered overlay shown on loading error |
| `.ci-3d-error--hidden` | Error overlay | Applied when error is dismissed |
| `.ci-3d-error-icon` | Error icon | SVG warning/error icon |
| `.ci-3d-error-message` | `<div>` | Error description text |
| `.ci-3d-error-retry` | `<button>` | Retry button |
| `.ci-3d-controls` | Controls wrapper | Container for fullscreen and screenshot buttons |
| `.ci-3d-fullscreen-btn` | `<button>` | Fullscreen toggle button (top-right by default) |
| `.ci-3d-fullscreen-btn--active` | `<button>` | Applied when in fullscreen mode |
| `.ci-3d-screenshot-btn` | `<button>` | Screenshot capture button |
| `.ci-3d-animation-controls` | Animation controls wrapper | Container for animation playback buttons and dropdown |
| `.ci-3d-animation-play` | `<button>` | Play animation button |
| `.ci-3d-animation-pause` | `<button>` | Pause animation button |
| `.ci-3d-animation-stop` | `<button>` | Stop animation button |
| `.ci-3d-animation-select` | `<select>` | Animation selection dropdown |
| `.ci-3d-theme-dark` | Container | Dark theme modifier class |

### B. Event / Callback Reference

Events are delivered via callback functions in the configuration object. No custom DOM events are dispatched (to keep the API surface minimal and tree-shakeable).

| Callback | Signature | Trigger |
|---|---|---|
| `onLoadStart` | `() => void` | Model loading begins |
| `onProgress` | `(progress: number) => void` | Model loading progress (0–1) |
| `onLoad` | `(instance: CI3DViewInstance) => void` | Model fully loaded and rendered |
| `onError` | `(error: Error) => void` | Loading or rendering error |
| `onCameraChange` | `(position: {x, y, z}, target: {x, y, z}) => void` | Camera position/target changes (throttled 60fps) |
| `onFullscreenChange` | `(isFullscreen: boolean) => void` | Fullscreen state changes |

### C. Data Attribute Reference

All data attributes use the `data-ci-3d-` prefix.

| Attribute | Type | Maps to |
|---|---|---|
| `data-ci-3d-src` | `string` | `config.src` |
| `data-ci-3d-mtl-src` | `string` | `config.mtlSrc` |
| `data-ci-3d-alt` | `string` | `config.alt` |
| `data-ci-3d-controls` | `boolean string` | `config.controls` |
| `data-ci-3d-zoom` | `boolean string` | `config.zoom` |
| `data-ci-3d-pan` | `boolean string` | `config.pan` |
| `data-ci-3d-auto-rotate` | `boolean string` | `config.autoRotate` |
| `data-ci-3d-auto-rotate-speed` | `number string` | `config.autoRotateSpeed` |
| `data-ci-3d-auto-rotate-delay` | `number string` | `config.autoRotateDelay` |
| `data-ci-3d-damping` | `boolean string` | `config.damping` |
| `data-ci-3d-damping-factor` | `number string` | `config.dampingFactor` |
| `data-ci-3d-zoom-min` | `number string` | `config.zoomMin` |
| `data-ci-3d-zoom-max` | `number string` | `config.zoomMax` |
| `data-ci-3d-polar-angle-min` | `number string` | `config.polarAngleMin` |
| `data-ci-3d-polar-angle-max` | `number string` | `config.polarAngleMax` |
| `data-ci-3d-theme` | `string` | `config.theme` |
| `data-ci-3d-background` | `string` | `config.background` |
| `data-ci-3d-show-progress` | `boolean string` | `config.showProgress` |
| `data-ci-3d-fullscreen-button` | `boolean string` | `config.fullscreenButton` |
| `data-ci-3d-screenshot-button` | `boolean string` | `config.screenshotButton` |
| `data-ci-3d-screenshot-filename` | `string` | `config.screenshotFilename` |
| `data-ci-3d-screenshot-scale` | `number string` | `config.screenshotScale` |
| `data-ci-3d-shadows` | `boolean string` | `config.shadows` |
| `data-ci-3d-shadow-opacity` | `number string` | `config.shadowOpacity` |
| `data-ci-3d-shadow-blur` | `number string` | `config.shadowBlur` |
| `data-ci-3d-environment-map` | `string` | `config.environmentMap` |
| `data-ci-3d-environment-background` | `boolean string` | `config.environmentBackground` |
| `data-ci-3d-tone-mapping` | `string` | `config.toneMapping` |
| `data-ci-3d-tone-mapping-exposure` | `number string` | `config.toneMappingExposure` |
| `data-ci-3d-draco` | `boolean string` | `config.draco` |
| `data-ci-3d-draco-decoder-path` | `string` | `config.dracoDecoderPath` |
| `data-ci-3d-animation` | `string` | `config.animation` |
| `data-ci-3d-auto-play-animation` | `boolean string` | `config.autoPlayAnimation` |
| `data-ci-3d-animation-speed` | `number string` | `config.animationSpeed` |
| `data-ci-3d-camera-position` | `JSON string` | `config.cameraPosition` |
| `data-ci-3d-camera-fov` | `number string` | `config.cameraFov` |
| `data-ci-3d-camera-target` | `JSON string` | `config.cameraTarget` |
| `data-ci-3d-pixel-ratio` | `number string` | `config.pixelRatio` |
| `data-ci-3d-antialias` | `boolean string` | `config.antialias` |
| `data-ci-3d-lighting` | `JSON string` | `config.lighting` |

### D. Three.js Version Compatibility

| Three.js Version | Status | Notes |
|---|---|---|
| `0.170.x` | Fully supported | Primary development target |
| `0.160.x` – `0.169.x` | Supported | All features work |
| `0.150.x` – `0.159.x` | Supported | Minimum peer dependency version; some addon import paths may differ |
| `< 0.150.0` | Unsupported | Breaking changes in addon module structure |

The library imports from `three/addons/` (introduced in r151). For Three.js versions 0.150.x that use `three/examples/jsm/`, the bundler's module resolution handles the mapping. The UMD build maps all addons to `window.THREE`.

### E. WebGL Requirements

| Requirement | Minimum | Recommended |
|---|---|---|
| **WebGL version** | WebGL 1.0 | WebGL 2.0 |
| **GPU memory** | 256 MB | 512 MB+ |
| **Max texture size** | 4096 × 4096 | 8192 × 8192 |
| **Browser** | Chrome 80+, Firefox 78+, Safari 14+, Edge 80+ | Latest stable |
| **Mobile** | iOS Safari 14+, Chrome Android 80+ | Latest stable |

The library detects WebGL support on initialization. If `WebGLRenderingContext` is not available, a user-friendly error message is displayed in the container (no console-only failure).

---
