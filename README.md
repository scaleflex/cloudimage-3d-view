<p align="center">
  <img src="https://scaleflex.cloudimg.io/v7/plugins/scaleflex/logo.png?vh=b0a502&radius=25&w=700" alt="Scaleflex" width="350">
</p>

<h1 align="center">@cloudimage/3d-view</h1>

<p align="center">
  Interactive 3D model viewer with orbit controls, lighting, animations, and accessibility. Powered by Three.js.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@cloudimage/3d-view"><img src="https://img.shields.io/npm/v/@cloudimage/3d-view.svg?style=flat-square" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/@cloudimage/3d-view"><img src="https://img.shields.io/npm/dm/@cloudimage/3d-view.svg?style=flat-square" alt="npm downloads"></a>
  <a href="https://github.com/scaleflex/cloudimage-3d-view/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@cloudimage/3d-view.svg?style=flat-square" alt="license"></a>
  <a href="https://bundlephobia.com/package/@cloudimage/3d-view"><img src="https://img.shields.io/bundlephobia/minzip/@cloudimage/3d-view?style=flat-square" alt="bundle size"></a>
</p>

<p align="center">
  <a href="https://scaleflex.github.io/cloudimage-3d-view/">Live Demo</a> ·
  <a href="https://codesandbox.io/p/devbox/github/scaleflex/cloudimage-3d-view/tree/main/examples/vanilla">Vanilla Sandbox</a> ·
  <a href="https://codesandbox.io/p/devbox/github/scaleflex/cloudimage-3d-view/tree/main/examples/react">React Sandbox</a>
</p>

---

## Why @cloudimage/3d-view?

Embedding 3D models on the web shouldn't require writing Three.js boilerplate. This library handles all the heavy lifting:

- **Drop-in viewer** — one line of JS or a single HTML element to display any 3D model
- **Multi-format** — GLTF/GLB, OBJ+MTL, STL, FBX, 3DS, and AMF out of the box
- **Accessible by default** — WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- **Framework-agnostic** — works with vanilla JS, React, or any framework
- **Full camera controls** — orbit, zoom, pan, auto-rotate with damping
- **Animations** — play, pause, stop, speed control for embedded animations
- **Lighting & environment** — 3-point lighting, HDR/EXR environment maps, tone mapping
- **Lightweight** — ~14 KB gzipped (Three.js as peer dependency)

---

## Features

- **Orbit controls** — mouse/touch rotation, zoom, and pan with configurable damping
- **Auto-rotate** — configurable speed with pause-on-interact and resume delay
- **Animation playback** — play/pause/stop/speed control with toolbar buttons
- **3-point lighting** — ambient + key/fill/rim lights, fully configurable
- **Environment maps** — HDR/EXR support with PMREM, optional background display
- **Tone mapping** — ACES filmic, Reinhard, Cineon, Linear, or None
- **Shadows** — soft shadow ground plane with configurable opacity
- **Screenshot** — capture and download the current view as PNG
- **Fullscreen** — one-click fullscreen toggle
- **Themes** — light and dark themes
- **Progress bar** — loading progress with accessible ARIA attributes
- **Ctrl+scroll zoom** — optional scroll interception with tooltip hint
- **DRACO compression** — automatic DRACO decoder for compressed GLTF/GLB
- **40+ data attributes** — fully declarative HTML configuration
- **WCAG 2.1 AA** — keyboard navigation, ARIA attributes, focus management, reduced motion
- **React wrapper** — component, hook, and ref API with SSR safety
- **TypeScript** — full type definitions with strict mode

## Installation

```bash
npm install @cloudimage/3d-view three
```

### CDN

```html
<script src="https://unpkg.com/three/build/three.min.js"></script>
<script src="https://scaleflex.cloudimg.io/v7/plugins/cloudimage/3d-view/1.2.0/3d-view.min.js?vh=b234c0&func=proxy"></script>
```

## Quick Start

### JavaScript API

```js
import CI3DView from '@cloudimage/3d-view';

const viewer = new CI3DView('#my-container', {
  src: 'https://example.com/model.glb',
  autoRotate: true,
  shadows: true,
  theme: 'dark',
  onLoad(instance) {
    console.log('Model loaded!', instance.getAnimations());
  },
});
```

### HTML Data-Attributes

```html
<div
  data-ci-3d-src="https://example.com/model.glb"
  data-ci-3d-auto-rotate
  data-ci-3d-shadows
  data-ci-3d-theme="dark"
  style="width: 100%; height: 500px;"
></div>

<script>
  CI3DView.autoInit();
</script>
```

## Supported Formats

| Format | Extensions | Notes |
|--------|-----------|-------|
| glTF / GLB | `.gltf`, `.glb` | Recommended. Supports DRACO compression, animations, PBR materials |
| OBJ | `.obj` | Optional `.mtl` material file via `mtlSrc` config |
| STL | `.stl` | Mesh-only, auto-assigned standard material |
| FBX | `.fbx` | Supports skeletal animations |
| 3DS | `.3ds` | Legacy Autodesk format |
| AMF | `.amf` | Additive manufacturing format |

## API Reference

### Constructor

```ts
new CI3DView(element: HTMLElement | string, config: CI3DViewConfig)
```

### Config

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `src` | `string` | — | Model URL (required) |
| `mtlSrc` | `string` | — | MTL material URL (for OBJ models) |
| `alt` | `string` | `''` | Accessible description |
| `controls` | `boolean` | `true` | Enable orbit controls |
| `zoom` | `boolean` | `true` | Enable zoom |
| `pan` | `boolean` | `true` | Enable pan |
| `scrollToZoom` | `boolean` | `false` | Allow direct scroll-to-zoom (default: Ctrl+scroll) |
| `autoRotate` | `boolean` | `false` | Enable auto-rotation |
| `autoRotateSpeed` | `number` | `0.5` | Auto-rotate speed |
| `autoRotateDelay` | `number` | `3000` | Delay (ms) before auto-rotate resumes after interaction |
| `damping` | `boolean` | `true` | Enable inertia damping |
| `dampingFactor` | `number` | `0.1` | Damping strength (0-1) |
| `zoomMin` | `number` | — | Minimum zoom distance |
| `zoomMax` | `number` | — | Maximum zoom distance |
| `polarAngleMin` | `number` | `0` | Min vertical angle in degrees (0 = top) |
| `polarAngleMax` | `number` | `180` | Max vertical angle in degrees (180 = bottom) |
| `theme` | `'light' \| 'dark'` | `'light'` | Theme |
| `background` | `string` | `'transparent'` | Background color |
| `showProgress` | `boolean` | `true` | Show loading progress bar |
| `fullscreenButton` | `boolean` | `true` | Show fullscreen button |
| `screenshotButton` | `boolean` | `false` | Show screenshot button |
| `screenshotFilename` | `string` | `'screenshot'` | Screenshot download filename |
| `screenshotScale` | `number` | `2` | Screenshot resolution multiplier |
| `resetCameraButton` | `boolean` | `true` | Show reset camera button |
| `autoRotateButton` | `boolean` | `true` | Show auto-rotate toggle button |
| `animationButtons` | `boolean` | `true` | Show animation play/pause/stop buttons |
| `toolbarPosition` | `string` | `'bottom-center'` | `'bottom-left'`, `'bottom-center'`, or `'bottom-right'` |
| `shadows` | `boolean` | `true` | Enable shadow ground plane |
| `shadowOpacity` | `number` | `0.3` | Shadow opacity (0-1) |
| `shadowBlur` | `number` | `2` | Shadow blur amount |
| `environmentMap` | `string` | — | HDR/EXR environment map URL |
| `environmentBackground` | `boolean` | `false` | Show environment map as scene background |
| `toneMapping` | `string` | `'aces'` | `'none'`, `'linear'`, `'reinhard'`, `'aces'`, or `'filmic'` |
| `toneMappingExposure` | `number` | `1.0` | Tone mapping exposure |
| `draco` | `boolean` | `true` | Enable DRACO decoder for GLTF |
| `dracoDecoderPath` | `string` | — | Custom DRACO decoder path |
| `animation` | `number \| string` | — | Animation index or name to play on load |
| `autoPlayAnimation` | `boolean` | `false` | Auto-play first animation on load |
| `animationSpeed` | `number` | `1.0` | Animation playback speed |
| `cameraPosition` | `[x, y, z]` | — | Custom initial camera position |
| `cameraFov` | `number` | `45` | Camera field of view (degrees) |
| `cameraTarget` | `[x, y, z]` | — | Custom camera look-at target |
| `pixelRatio` | `number` | `2` | Max device pixel ratio |
| `antialias` | `boolean` | `true` | Enable antialiasing |
| `aspectRatio` | `string` | — | Container aspect ratio (e.g. `'16:9'`, `'4:3'`, `'1:1'`) |
| `lighting` | `LightingConfig` | — | Custom lighting configuration |

### Callbacks

| Callback | Type | Description |
|----------|------|-------------|
| `onLoadStart` | `() => void` | Fired when model loading begins |
| `onProgress` | `(progress: number) => void` | Loading progress (0-1) |
| `onLoad` | `(instance) => void` | Fired when model is loaded and ready |
| `onError` | `(error: Error) => void` | Fired on load error |
| `onCameraChange` | `(position, target) => void` | Fired when camera moves |
| `onFullscreenChange` | `(isFullscreen: boolean) => void` | Fired on fullscreen toggle |

### Instance Methods

```ts
// Model
instance.loadModel(src: string, mtlSrc?: string): Promise<void>
instance.update(config: Partial<CI3DViewConfig>): void
instance.destroy(): void

// Camera
instance.setCameraPosition(x: number, y: number, z: number): void
instance.setCameraTarget(x: number, y: number, z: number): void
instance.resetCamera(): void

// Auto-rotate
instance.setAutoRotate(enabled: boolean): void

// Animation
instance.playAnimation(indexOrName?: number | string): void
instance.pauseAnimation(): void
instance.stopAnimation(): void
instance.setAnimationSpeed(speed: number): void
instance.getAnimations(): string[]

// Screenshot
instance.screenshot(scale?: number): string       // Returns data URL
instance.downloadScreenshot(filename?: string, scale?: number): void

// Fullscreen
instance.enterFullscreen(): void
instance.exitFullscreen(): void
instance.isFullscreen(): boolean

// Three.js access
instance.getThreeObjects(): { scene, camera, renderer, controls, model }
instance.getElements(): { container, canvas }
```

### Static Methods

```ts
CI3DView.autoInit(root?: HTMLElement): CI3DViewInstance[]
```

## React Usage

```tsx
import { CI3DViewer, useCI3DView } from '@cloudimage/3d-view/react';

// Component
function ModelViewer() {
  return (
    <CI3DViewer
      src="/model.glb"
      autoRotate
      shadows
      theme="dark"
      style={{ width: '100%', height: 500 }}
      onLoad={(instance) => console.log('Loaded!', instance.getAnimations())}
    />
  );
}

// Ref API
function ModelViewer() {
  const ref = useRef<CI3DViewerRef>(null);
  return (
    <>
      <CI3DViewer ref={ref} src="/model.glb" shadows />
      <button onClick={() => ref.current?.resetCamera()}>Reset</button>
      <button onClick={() => ref.current?.downloadScreenshot()}>Screenshot</button>
    </>
  );
}

// Hook
function ModelViewer() {
  const { containerRef, instance, ready } = useCI3DView({
    src: '/model.glb',
    autoRotate: true,
    shadows: true,
  });

  return (
    <>
      <div ref={containerRef} style={{ width: '100%', height: 500 }} />
      {ready && <button onClick={() => instance.current?.resetCamera()}>Reset</button>}
    </>
  );
}
```

## Lighting Configuration

Customize the 3-point lighting system:

```js
new CI3DView('#el', {
  src: '/model.glb',
  lighting: {
    ambientIntensity: 0.4,
    ambientColor: '#ffffff',
    keyLight: {
      intensity: 1.0,
      color: '#ffffff',
      position: [5, 10, 7],
      castShadow: true,
    },
    fillLight: {
      intensity: 0.5,
      position: [-5, 5, 5],
    },
    rimLight: {
      intensity: 0.3,
      position: [0, 5, -10],
    },
  },
});
```

## Environment Maps

Use HDR or EXR environment maps for realistic reflections:

```js
new CI3DView('#el', {
  src: '/model.glb',
  environmentMap: '/studio.hdr',
  environmentBackground: true,
  toneMapping: 'aces',
  toneMappingExposure: 1.2,
});
```

## Data Attributes

All config options can be set via HTML data attributes with the `data-ci-3d-` prefix:

```html
<div
  data-ci-3d-src="/model.glb"
  data-ci-3d-auto-rotate
  data-ci-3d-auto-rotate-speed="1.0"
  data-ci-3d-shadows
  data-ci-3d-shadow-opacity="0.5"
  data-ci-3d-theme="dark"
  data-ci-3d-background="#1a1a1a"
  data-ci-3d-environment-map="/studio.hdr"
  data-ci-3d-tone-mapping="aces"
  data-ci-3d-camera-position="[0, 2, 5]"
  data-ci-3d-auto-play-animation
  data-ci-3d-animation-speed="0.5"
  data-ci-3d-scroll-to-zoom
  style="width: 100%; height: 500px;"
></div>
```

Boolean attributes are `true` when present (empty value), or accept `"true"`, `"1"`, `"yes"`.

## Accessibility

- All interactive elements are keyboard-navigable
- `Arrow keys` rotate the model
- `+` / `-` zoom in/out
- `0` resets camera
- `R` toggles auto-rotate
- `F` toggles fullscreen
- `Space` toggles animation playback
- `Escape` exits fullscreen
- `Tab` / `Shift+Tab` navigates toolbar buttons
- `role="application"` with `aria-describedby` keyboard instructions
- `aria-label` on all buttons, `aria-pressed` on toggles
- Progress bar with `role="progressbar"` and `aria-valuenow`
- `prefers-reduced-motion` disables auto-rotate and uses instant transitions

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome  | 80+     |
| Firefox | 80+     |
| Safari  | 14+     |
| Edge    | 80+     |

Requires WebGL 2.0 support.

## License

[MIT](./LICENSE)

---

## Support

If this library helped your project, consider buying me a coffee!

<a href="https://buymeacoffee.com/dzmitry.stramavus">
  <img src="https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black" alt="Buy Me A Coffee">
</a>

---

<p align="center">
  Made with care by the <a href="https://www.scaleflex.com">Scaleflex</a> team
</p>
