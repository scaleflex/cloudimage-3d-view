# Implementation Plan: @cloudimage/3d-view

## Summary

Build `@cloudimage/3d-view` from scratch — a Three.js-powered TypeScript library for interactive 3D model viewers with orbit controls, lighting, environment maps, shadows, animation playback, and WCAG 2.1 AA accessibility. Ten implementation phases, following the same build system pattern as `js-cloudimage-hotspot`.

## Target Metrics

| Metric | Target |
|--------|--------|
| ESM bundle (excl. Three.js) | < 20 KB gzipped |
| UMD bundle (excl. Three.js) | < 25 KB gzipped |
| React wrapper | < 3 KB gzipped |
| Runtime dependencies | Zero (Three.js is a peer dependency) |
| Test coverage | > 80% on critical paths |
| Total source files | ~40 |
| Total test files | ~13 |

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 3D engine | Three.js (peer dep `>=0.150.0`) | MIT, industry standard, addons for all needed loaders/controls |
| Addon import path | `three/addons/` | Introduced in r151; the `three/examples/jsm/` alias still works for older versions |
| Draco decoder | CDN default (`https://www.gstatic.com/draco/versioned/decoders/1.5.7/`) | Avoids bundling 1.5 MB WASM; configurable via `dracoDecoderPath` |
| CSS strategy | Runtime injection via `injectStyles()` | Single import, no separate CSS file needed; matches hotspot pattern |
| Tone mapping default | `ACESFilmicToneMapping` | Best general-purpose look for product visualization |
| Shadow technique | `ShadowMaterial` on ground `PlaneGeometry` | Transparent ground that only renders shadow; built into Three.js core |
| Environment maps | `PMREMGenerator.fromEquirectangular()` | Converts HDR/EXR to prefiltered radiance maps for PBR materials |
| Auto-rotate speed unit | Revolutions per second in config, converted internally | `controls.autoRotateSpeed = config.autoRotateSpeed * 60` (OrbitControls uses 30s/orbit at speed=2) |
| Polar angles in config | Degrees, converted to radians internally | `controls.minPolarAngle = (config.polarAngleMin * Math.PI) / 180` |
| Screenshot | Render extra frame with `preserveDrawingBuffer`, then `toDataURL` | Avoids permanently setting `preserveDrawingBuffer: true` which hurts performance |
| UMD globals | `three` → `window.THREE` (function form for all subpaths) | Three.js UMD puts addons on the `THREE` global |
| Declaration generation | `vite-plugin-dts` with `rollupTypes: true` | Integrated into Vite build; produces single `.d.ts` per entry |
| Testing WebGL | Mock `THREE.WebGLRenderer` in jsdom | Real WebGL requires a browser; mock covers all DOM + logic paths |

---

## Phase 1: Project Scaffolding, Build Pipeline & Types

**Goal:** Establish Vite build toolchain, TypeScript config, linting, testing infra, and all core type definitions.

### Files

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Created | Full setup: vite, vitest, typescript, eslint, @vitejs/plugin-react, vite-plugin-dts, jsdom; `three` as peer dep; react/react-dom as optional peer deps; `exports` map with `"."` and `"./react"`; `main`, `module`, `unpkg`, `types`, `files`, `peerDependencies`, `sideEffects: false`; all npm scripts (dev, build, build:bundle, build:react, build:demo, typecheck, test, lint) |
| `tsconfig.json` | Created | Target ES2020, module ESNext, moduleResolution bundler, jsx react-jsx, declaration true, strict, dom/dom.iterable libs, paths alias `three` |
| `tsconfig.build.json` | Created | Extends base, scoped declaration emit config |
| `config/vite.config.ts` | Created | Library mode: entry `src/index.ts` → ESM (.esm.js) + CJS (.cjs.js) + UMD (.min.js), name `CI3DView`. Externalize `three` and `/^three\/.*/` via regex. UMD globals: function form mapping all `three/*` to `'THREE'`. CSS injected at runtime. `vite-plugin-dts` with `rollupTypes: true` |
| `config/vite.react.config.ts` | Created | Library mode: entry `src/react/index.ts`, externalize three + react/react-dom/react-jsx-runtime, output ESM + CJS to `dist/react/`. `vite-plugin-dts` for React types |
| `config/vite.demo.config.ts` | Created | App mode targeting `demo/index.html` → `dist-demo/` |
| `.eslintrc.cjs` | Created | TypeScript-eslint recommended rules |
| `vitest.config.ts` | Created | jsdom environment, coverage settings, setup file |
| `src/core/types.ts` | Created | All TypeScript interfaces: `CI3DViewConfig`, `CI3DViewInstance`, `LightingConfig`, `DirectionalLightConfig`, `FormatLoader`, `LoaderOptions`, `LoadResult` (model + animations), `Theme`, `ToneMappingMode`, internal types |
| `src/index.ts` | Created | Stub CI3DView class + static `autoInit`, re-exported types |
| `tests/setup.ts` | Created | jsdom setup, `WebGLRenderingContext` mock, `ResizeObserver` mock, `requestAnimationFrame` mock, Three.js module mocks |
| `tests/types.test.ts` | Created | Type-level validation tests |
| `.gitignore` | Created | dist/, dist-demo/, node_modules/, coverage/, .DS_Store |

### Implementation Details

**Vite config — externalizing Three.js:**

```ts
// config/vite.config.ts
rollupOptions: {
  external: ['three', /^three\/.*/],
  output: {
    globals: (id: string) => {
      if (id === 'three' || id.startsWith('three/')) return 'THREE';
      return id;
    },
  },
}
```

**Test setup — WebGL mock:**

```ts
// tests/setup.ts
class MockWebGLRenderer {
  domElement = document.createElement('canvas');
  shadowMap = { enabled: false, type: 0 };
  toneMapping = 0;
  toneMappingExposure = 1;
  setSize = vi.fn();
  setPixelRatio = vi.fn();
  render = vi.fn();
  dispose = vi.fn();
  getContext = vi.fn(() => ({}));
}
vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return { ...actual, WebGLRenderer: MockWebGLRenderer };
});
```

### Expected Results
- `npm install` succeeds
- `npm run build` produces ESM, CJS, UMD in `dist/` (stub)
- `npm run typecheck` passes
- `npm test` runs setup and type tests
- UMD exposes `window.CI3DView`

---

## Phase 2: Utility Layer & CSS Foundation

**Goal:** Build all shared utility modules and the complete CSS stylesheet.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/utils/dom.ts` | Created | `createElement(tag, className, attrs?)`, `addClass/removeClass/toggleClass`, `getElement(selectorOrElement)`, `injectStyles(css, id)` (idempotent `<style>` injection), `isBrowser()` (SSR guard) |
| `src/utils/math.ts` | Created | `computeBoundingBox(object3D)` → `Box3`, `computeBoundingSphere(object3D)` → `Sphere`, `centerModel(model, box)` → centers at origin, `scaleToFit(model, box, targetSize=2)` → uniform scale, `fitCameraToModel(camera, sphere, padding=1.2)` → positions camera, `degreesToRadians(deg)`, `radiansToDegrees(rad)` |
| `src/utils/dispose.ts` | Created | `disposeObject3D(object)` → traverses scene graph, disposes all geometries (`geometry.dispose()`), materials (`material.dispose()`, handles arrays), textures (`texture.dispose()` for map, normalMap, roughnessMap, etc.), and child objects |
| `src/utils/events.ts` | Created | Minimal typed `EventEmitter` (on/off/emit/once), `addListener(el, event, handler, options)` → returns cleanup fn, `throttle(fn, ms)` |
| `src/styles/index.css` | Created | Complete stylesheet: 30+ CSS variables, container (position: relative, overflow: hidden, 100% width/height), canvas (absolute fill), loading overlay (centered flex, spinner keyframes, progress bar), error overlay (centered, alert icon), controls (absolute top-right, flex column, gap), animation controls (absolute bottom-center, flex row), dark theme overrides (`.ci-3d-theme-dark`), fullscreen modifier (`.ci-3d-container--fullscreen`), reduced motion media query, focus-visible outlines |
| `tests/math.test.ts` | Created | Bounding box computation, centering, scaling, camera fit, degree/radian conversion |
| `tests/events.test.ts` | Created | EventEmitter lifecycle, throttle |
| `tests/dom.test.ts` | Created | Element creation, class ops, style injection, SSR guard |
| `tests/dispose.test.ts` | Created | Traverse + dispose geometry, material, textures; handle material arrays |

### Implementation Details

**Auto-center + scale algorithm:**

```ts
export function centerModel(model: Object3D, box: Box3): Vector3 {
  const center = box.getCenter(new Vector3());
  model.position.sub(center);
  return center;
}

export function scaleToFit(model: Object3D, box: Box3, targetSize = 2): number {
  const size = box.getSize(new Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = targetSize / maxDim;
  model.scale.multiplyScalar(scale);
  return scale;
}

export function fitCameraToModel(
  camera: PerspectiveCamera,
  sphere: Sphere,
  padding = 1.2,
): void {
  const fov = camera.fov * (Math.PI / 180);
  const distance = (sphere.radius * padding) / Math.sin(fov / 2);
  camera.position.set(0, sphere.radius * 0.5, distance);
  camera.lookAt(0, 0, 0);
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
}
```

**Resource disposal traversal:**

```ts
export function disposeObject3D(object: Object3D): void {
  object.traverse((child) => {
    if ((child as Mesh).isMesh) {
      const mesh = child as Mesh;
      mesh.geometry?.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        for (const key of Object.keys(mat)) {
          const value = (mat as any)[key];
          if (value?.isTexture) value.dispose();
        }
        mat.dispose();
      }
    }
  });
}
```

### Expected Results
- All utility unit tests pass
- `centerModel` + `scaleToFit` normalize any model to origin with diameter 2
- `disposeObject3D` visits all children and disposes all GPU resources
- CSS string importable and injectable

---

## Phase 3: Three.js Renderer, Scene & Model Loading

**Goal:** Set up WebGLRenderer, scene, camera, animation loop, and implement the model loading system with format auto-detection.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/core/renderer.ts` | Created | `createRenderer(canvas, config)` → `WebGLRenderer` with: `antialias`, `alpha: true` (for transparent bg), `powerPreference: 'high-performance'`, `pixelRatio: min(dpr, config.pixelRatio ?? 2)`, `shadowMap.enabled = config.shadows`, `shadowMap.type = PCFSoftShadowMap`, `toneMapping` from config string → Three.js constant, `toneMappingExposure`. `handleResize(renderer, camera, container)` → `ResizeObserver` callback updates renderer size + camera aspect + projection matrix (debounced 16ms). `startAnimationLoop(callback)` / `stopAnimationLoop()` wrapping `requestAnimationFrame` |
| `src/core/scene.ts` | Created | `createScene(config)` → `Scene` with optional background color. `createCamera(config)` → `PerspectiveCamera` with `fov`, `aspect`, `near: 0.01`, `far: 1000` |
| `src/loaders/format-loader.ts` | Created | `FormatLoader` interface definition and `LoadResult` type: `{ model: Group, animations: AnimationClip[] }` |
| `src/loaders/loader-registry.ts` | Created | `detectFormat(url)` → file extension extraction with query string stripping, fallback to magic bytes fetch. `getLoader(url)` → returns appropriate `FormatLoader`. Internal registry map (`.glb`/`.gltf` → GLTFFormatLoader, `.obj` → OBJFormatLoader) |
| `src/loaders/gltf-loader.ts` | Created | `GLTFFormatLoader` implementing `FormatLoader`: uses `GLTFLoader` from `three/addons/loaders/GLTFLoader.js`. Optionally configures `DRACOLoader` from `three/addons/loaders/DRACOLoader.js` with `setDecoderPath()`. `.load()` returns `{ model: gltf.scene, animations: gltf.animations }`. Progress normalization from `ProgressEvent.loaded / ProgressEvent.total` → 0–1 |
| `src/loaders/obj-loader.ts` | Created | `OBJFormatLoader` implementing `FormatLoader`: uses `OBJLoader` from `three/addons/loaders/OBJLoader.js`. If `mtlUrl` provided (or auto-detected), loads via `MTLLoader` from `three/addons/loaders/MTLLoader.js`, calls `materials.preload()`, then `objLoader.setMaterials(materials)`. Material upgrade: traverses loaded group, replaces `MeshPhongMaterial` with `MeshStandardMaterial` preserving color/map. Returns `{ model: group, animations: [] }` |
| `tests/loaders.test.ts` | Created | Format detection (extension extraction, query strings, hash fragments), GLTFFormatLoader mock (DRACOLoader attachment, progress normalization), OBJFormatLoader mock (MTL auto-detect URL construction, material upgrade), loader registry dispatch |

### Implementation Details

**Tone mapping config → Three.js constant mapping:**

```ts
const TONE_MAPPING_MAP: Record<string, ToneMapping> = {
  'none': NoToneMapping,
  'linear': LinearToneMapping,
  'reinhard': ReinhardToneMapping,
  'aces': ACESFilmicToneMapping,
  'filmic': CineonToneMapping,
};
```

**GLTFFormatLoader core:**

```ts
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const DEFAULT_DRACO_PATH = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';

export class GLTFFormatLoader implements FormatLoader {
  extensions = ['.glb', '.gltf'];

  async load(url, options, onProgress): Promise<LoadResult> {
    const loader = new GLTFLoader();
    if (options.draco !== false) {
      const draco = new DRACOLoader();
      draco.setDecoderPath(options.dracoDecoderPath || DEFAULT_DRACO_PATH);
      loader.setDRACOLoader(draco);
    }
    return new Promise((resolve, reject) => {
      loader.load(url, (gltf) => {
        resolve({ model: gltf.scene, animations: gltf.animations });
      }, (event) => {
        if (event.total > 0 && onProgress) onProgress(event.loaded / event.total);
      }, reject);
    });
  }
}
```

**OBJ+MTL auto-detect:**

```ts
function inferMtlUrl(objUrl: string): string {
  return objUrl.replace(/\.obj(\?.*)?$/i, '.mtl$1');
}
```

### Expected Results
- `createRenderer` produces a configured WebGLRenderer with correct tone mapping
- `ResizeObserver` keeps renderer and camera in sync with container
- `GLTFFormatLoader` loads GLB with Draco and extracts animations
- `OBJFormatLoader` loads OBJ+MTL with material upgrade
- Format auto-detection works with query-string URLs

---

## Phase 4: Lighting, Environment & Shadows

**Goal:** Implement 3-point lighting, HDR/EXR environment map loading via PMREMGenerator, and ground plane contact shadows.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/lighting/lighting.ts` | Created | `create3PointLighting(scene, config?)` → creates `AmbientLight` + 3 `DirectionalLight` (key/fill/rim) with defaults from spec. `applyLightingConfig(lights, config)` → updates intensities, colors, positions. `reduceLightingForIBL(lights)` → halves all intensities when env map active. `disposeLighting(lights)` → removes from scene. Shadow map setup on key light: `shadow.mapSize.set(1024, 1024)`, `shadow.camera` frustum auto-sized to model bounds, `shadow.radius` from `config.shadowBlur` |
| `src/lighting/environment.ts` | Created | `loadEnvironmentMap(url, renderer)` → detects `.hdr`/`.exr` extension, uses `RGBELoader` from `three/addons/loaders/RGBELoader.js` or `EXRLoader` from `three/addons/loaders/EXRLoader.js`, generates prefiltered env map via `PMREMGenerator.fromEquirectangular()`, sets `scene.environment`, optionally sets `scene.background`. Disposes source texture and PMREMGenerator after conversion. `disposeEnvironment(scene)` → disposes env map texture, nulls `scene.environment` and `scene.background` |
| `src/lighting/shadows.ts` | Created | `createGroundPlane(modelBounds, config)` → `PlaneGeometry` sized to 3× model footprint, `ShadowMaterial` with `opacity: config.shadowOpacity`, rotated -π/2 on X axis, positioned at model's min Y. `disposeGroundPlane(plane)` → geometry + material dispose, remove from scene |
| `tests/lighting.test.ts` | Created | 3-point light creation (positions, intensities, colors), config override application, IBL intensity reduction, env map extension detection, ground plane sizing/positioning, shadow config |

### Implementation Details

**3-point lighting defaults:**

```ts
const LIGHT_DEFAULTS = {
  ambient: { intensity: 0.4, color: '#ffffff' },
  key:  { intensity: 1.0, color: '#ffffff', position: [5, 8, 5],    castShadow: true },
  fill: { intensity: 0.5, color: '#ffffff', position: [-5, 4, -3],  castShadow: false },
  rim:  { intensity: 0.7, color: '#ffffff', position: [0, 4, -8],   castShadow: false },
};
```

**Environment map loading:**

```ts
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';

export async function loadEnvironmentMap(
  url: string,
  renderer: WebGLRenderer,
  scene: Scene,
  showBackground: boolean,
): Promise<void> {
  const pmrem = new PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const loader = url.endsWith('.exr') ? new EXRLoader() : new RGBELoader();

  return new Promise((resolve, reject) => {
    loader.load(url, (texture) => {
      const envMap = pmrem.fromEquirectangular(texture).texture;
      scene.environment = envMap;
      if (showBackground) scene.background = envMap;
      texture.dispose();
      pmrem.dispose();
      resolve();
    }, undefined, reject);
  });
}
```

**Ground plane shadow:**

```ts
export function createGroundPlane(box: Box3, config: { shadowOpacity: number }): Mesh {
  const size = box.getSize(new Vector3());
  const diameter = Math.max(size.x, size.z) * 3;
  const geometry = new PlaneGeometry(diameter, diameter);
  const material = new ShadowMaterial({ opacity: config.shadowOpacity });
  const plane = new Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = box.min.y;
  plane.receiveShadow = true;
  return plane;
}
```

### Expected Results
- 3-point lighting creates 4 lights with correct defaults
- Key light casts shadows, fill and rim do not
- Environment map loads HDR/EXR and sets `scene.environment`
- Ground plane invisible except for shadow
- All lights disposable

---

## Phase 5: Camera Controls & Auto-Rotate

**Goal:** Wrap OrbitControls with configurable damping, zoom/polar constraints, auto-rotate with pause-on-interact, smooth camera reset, and double-tap handler.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/controls/orbit-controls.ts` | Created | `setupOrbitControls(camera, canvas, config)` → `OrbitControls` from `three/addons/controls/OrbitControls.js` with: `enableDamping = config.damping`, `dampingFactor = config.dampingFactor`, `enableZoom = config.zoom`, `enablePan = config.pan`, `enableRotate = config.controls`, `minDistance` / `maxDistance` from config or auto-calculated, `minPolarAngle` / `maxPolarAngle` converted from degrees to radians. `updateControlsConstraints(controls, modelSphere, config)` → sets zoom/polar limits from model bounds. Returns controls instance |
| `src/controls/auto-rotate.ts` | Created | `class AutoRotateController`: constructor takes `controls` + config. `start()` → sets `controls.autoRotate = true`, `controls.autoRotateSpeed = config.autoRotateSpeed * 60` (conversion from rev/s to OrbitControls unit). `stop()` → sets `controls.autoRotate = false`. `pauseOnInteract()` → listens to OrbitControls `'start'` event, calls `stop()`, starts `setTimeout(resume, config.autoRotateDelay)`. `'end'` event resets the timeout. `destroy()` → removes listeners, clears timeout |
| `src/controls/camera-reset.ts` | Created | `smoothCameraReset(camera, controls, initialPosition, initialTarget, duration=500)` → animates camera.position and controls.target from current to initial using `requestAnimationFrame` + lerp over `duration` ms. Respects `prefers-reduced-motion` (instant if reduced). Returns a `Promise<void>` resolved on completion |
| `tests/controls.test.ts` | Created | OrbitControls setup (damping, constraints, enable/disable), auto-rotate speed conversion, pause/resume timeout logic, camera reset interpolation, polar angle degree→radian conversion |

### Implementation Details

**Auto-rotate speed conversion:**

OrbitControls `autoRotateSpeed` unit: speed N = one full orbit in `60/N` seconds. Our config uses revolutions per second. Conversion: `controls.autoRotateSpeed = configSpeed * 60`.

- Config `0.5` rev/s → OrbitControls speed `30` → full orbit in 2 seconds
- Config `0.033` rev/s → OrbitControls speed `2` → full orbit in 30 seconds

**Pause-on-interact pattern:**

```ts
export class AutoRotateController {
  private resumeTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private controls: OrbitControls, private config: AutoRotateConfig) {
    controls.addEventListener('start', this.onInteractStart);
    controls.addEventListener('end', this.onInteractEnd);
  }

  private onInteractStart = () => {
    this.controls.autoRotate = false;
    if (this.resumeTimeout) clearTimeout(this.resumeTimeout);
  };

  private onInteractEnd = () => {
    this.resumeTimeout = setTimeout(() => {
      this.controls.autoRotate = true;
    }, this.config.autoRotateDelay);
  };
}
```

**Camera reset with lerp:**

```ts
export function smoothCameraReset(
  camera: PerspectiveCamera,
  controls: OrbitControls,
  initialPos: Vector3,
  initialTarget: Vector3,
  duration = 500,
): Promise<void> {
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const startTime = performance.now();

  return new Promise((resolve) => {
    function animate() {
      const elapsed = performance.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic

      camera.position.lerpVectors(startPos, initialPos, eased);
      controls.target.lerpVectors(startTarget, initialTarget, eased);
      controls.update();

      if (t < 1) requestAnimationFrame(animate);
      else resolve();
    }
    requestAnimationFrame(animate);
  });
}
```

### Expected Results
- OrbitControls configured with correct damping, zoom limits, polar limits
- Auto-rotate pauses on drag, resumes after delay
- Speed conversion produces expected rotation rates
- Camera reset smoothly interpolates back to initial state
- `prefers-reduced-motion` makes reset instant

---

## Phase 6: Core CI3DView Class, Config Parsing & autoInit

**Goal:** Build the central orchestrator that ties renderer, scene, loading, lighting, controls, and CSS injection together. Implement config parsing with defaults, data-attribute mapping, and autoInit.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/core/config.ts` | Created | `DEFAULT_CONFIG` object with all defaults from SPECS.md. `mergeConfig(userConfig)` → deep merge with defaults. `parseDataAttributes(element)` → reads all `data-ci-3d-*` attributes, applies `DATA_ATTR_MAP` for type coercion (boolean strings, number strings, JSON strings). `validateConfig(config)` → ensures `src` is present, validates enum values (theme, toneMapping). `DATA_ATTR_MAP` constant mapping 40 attribute names → config paths + coercion functions |
| `src/core/ci-3d-view.ts` | Created | Core class. **Constructor**: resolve element (`getElement`), merge config, inject CSS (`injectStyles`), apply theme class, create canvas element, create renderer (`createRenderer`), create scene + camera (`createScene`, `createCamera`), setup lighting (`create3PointLighting`), load model (async — show loading overlay, call `getLoader` + `loader.load`, auto-center + scale, setup shadows, setup controls, load env map if configured, setup animations, hide loading, fire `onLoad`), handle errors (show error overlay, fire `onError`). **Instance methods**: `loadModel` (dispose old, load new), `setCameraPosition/Target`, `resetCamera`, `setAutoRotate`, `screenshot/downloadScreenshot`, animation methods (delegated to AnimationMixerWrapper), `enterFullscreen/exitFullscreen/isFullscreen`, `update(config)` (re-apply changed options), `destroy` (stop loop, dispose all, remove DOM). **Animation loop**: `requestAnimationFrame` → `controls.update()`, `mixer?.update(delta)`, `renderer.render(scene, camera)`, fire throttled `onCameraChange` |
| `src/index.ts` | Modified | Default export `CI3DView` class, static `autoInit(root?)` → `querySelectorAll('[data-ci-3d-src]')` → `new CI3DView(el, parseDataAttributes(el))` for each → return instances array. Named type exports |
| `tests/core.test.ts` | Created | Instantiation, DOM structure creation (container classes, canvas, overlays), config merging, theme class application, destroy cleanup (renderer.dispose called, DOM removed, loop stopped), update partial config |
| `tests/data-attr.test.ts` | Created | Attribute parsing (boolean coercion `"true"`→`true`, number coercion `"0.5"`→`0.5`, JSON parsing `"[1,2,3]"`→array), autoInit discovery (`querySelectorAll`), missing `src` validation, enum validation |

### Implementation Details

**Config default → data-attribute mapping example:**

```ts
const DATA_ATTR_MAP: Record<string, { key: string; coerce: (v: string) => unknown }> = {
  'src':                  { key: 'src',                  coerce: String },
  'mtl-src':              { key: 'mtlSrc',               coerce: String },
  'auto-rotate':          { key: 'autoRotate',           coerce: toBool },
  'auto-rotate-speed':    { key: 'autoRotateSpeed',      coerce: Number },
  'shadows':              { key: 'shadows',              coerce: toBool },
  'shadow-opacity':       { key: 'shadowOpacity',        coerce: Number },
  'camera-position':      { key: 'cameraPosition',       coerce: JSON.parse },
  'lighting':             { key: 'lighting',             coerce: JSON.parse },
  'tone-mapping':         { key: 'toneMapping',          coerce: String },
  // ... all 40 attributes
};

function toBool(v: string): boolean { return v === 'true'; }
```

**Core class lifecycle (simplified):**

```ts
export class CI3DView {
  private renderer: WebGLRenderer;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private controls: OrbitControls;
  private model: Group | null = null;
  private animationId: number | null = null;

  constructor(element: HTMLElement | string, config: Partial<CI3DViewConfig>) {
    const container = getElement(element);
    this.config = mergeConfig(config);
    injectStyles(CSS_STRING, 'ci-3d-styles');
    // Build DOM: canvas + overlays
    // Create renderer, scene, camera
    // Setup lighting
    // Start animation loop
    // Begin async model load
  }

  destroy(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.controls.dispose();
    if (this.model) disposeObject3D(this.model);
    this.renderer.dispose();
    // Remove all DOM elements, event listeners
  }
}
```

### Expected Results
- `new CI3DView('#el', { src: 'model.glb' })` creates full DOM structure
- Config parsed correctly from data attributes
- `CI3DView.autoInit()` finds and initializes all `data-ci-3d-src` elements
- `instance.destroy()` cleans up all Three.js resources and DOM
- `instance.update({ shadows: false })` re-applies changed options

---

## Phase 7: UI Overlays & Animation Playback

**Goal:** Build loading overlay with progress bar, error overlay with retry, fullscreen toggle, screenshot capture, and animation playback controls.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/ui/loading.ts` | Created | `createLoadingOverlay(container)` → builds DOM from spec (spinner + text + progress bar), returns `{ element, updateProgress(0-1), hide(), show(), destroy() }`. Progress updates set `fill.style.width` and text content. `hide()` adds `ci-3d-loading--hidden` class with fade-out transition, then removes element after transition ends |
| `src/ui/error.ts` | Created | `createErrorOverlay(container, onRetry)` → builds DOM (error icon SVG + message + retry button), returns `{ element, show(message), hide(), destroy() }`. Retry button click calls `onRetry`. Error icon is inline SVG (Lucide `AlertTriangle`). `show()` moves focus to retry button for a11y |
| `src/ui/fullscreen.ts` | Created | `createFullscreenButton(container, onChange?)` → Fullscreen API wrapper with webkit prefix fallback. Button with Lucide `Maximize2`/`Minimize2` SVG icons. `enterFullscreen()`, `exitFullscreen()`, `isFullscreen()`, `toggle()`. Listens to `fullscreenchange` event to update icon + `aria-pressed` + `aria-label`. Graceful degradation: button not rendered if Fullscreen API unavailable. `destroy()` → remove listener + button |
| `src/ui/screenshot.ts` | Created | `captureScreenshot(renderer, scene, camera, scale=2)` → temporarily resize renderer to `width*scale × height*scale`, render one frame, call `renderer.domElement.toDataURL('image/png')`, restore original size, return data URL. `downloadScreenshot(dataUrl, filename)` → create temp `<a>` with `download` attribute, click, remove. Button creation: Lucide `Camera` SVG icon |
| `src/animation/animation-mixer.ts` | Created | `class AnimationMixerWrapper`: constructor takes `model: Group`, `clips: AnimationClip[]`. `play(indexOrName?)` → `mixer.clipAction(clip).reset().play()`. `pause()` → `currentAction.paused = true`. `stop()` → `currentAction.stop()`. `setSpeed(speed)` → `currentAction.timeScale = speed`. `getAnimations()` → clip names. `update(delta)` → `mixer.update(delta)`. `dispose()` → `mixer.stopAllAction()`, `mixer.uncacheRoot()` |
| `src/animation/animation-controls.ts` | Created | `createAnimationControls(container, mixer)` → builds DOM (play/pause/stop buttons with Lucide SVGs + `<select>` dropdown populated from `mixer.getAnimations()`). Button clicks call mixer methods. Dropdown `change` calls `mixer.play(selectedIndex)`. Only rendered if `animations.length > 0`. `destroy()` → remove DOM + listeners |
| `src/core/ci-3d-view.ts` | Modified | Integrated all UI modules: loading shown on init → hidden after load; error shown on failure with retry wired to `loadModel(config.src)`; fullscreen button created if `config.fullscreenButton`; screenshot button if `config.screenshotButton`; animation controls created after load if model has animations; all destroyed in `destroy()` |
| `tests/ui.test.ts` | Created | Loading overlay show/hide/progress, error overlay show/retry/focus, fullscreen button state toggle + ARIA, screenshot canvas resize + restore, Fullscreen API unavailable → button not rendered |
| `tests/animation.test.ts` | Created | AnimationMixerWrapper play/pause/stop/speed, animation list, update delta, dispose |

### Implementation Details

**Screenshot with temporary resize:**

```ts
export function captureScreenshot(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  scale = 2,
): string {
  const { width, height } = renderer.getSize(new Vector2());
  renderer.setSize(width * scale, height * scale, false);
  renderer.render(scene, camera);
  const dataUrl = renderer.domElement.toDataURL('image/png');
  renderer.setSize(width, height, false);
  return dataUrl;
}
```

**AnimationMixer integration in animation loop:**

```ts
private clock = new Clock();

private animate = () => {
  this.animationId = requestAnimationFrame(this.animate);
  const delta = this.clock.getDelta();
  this.controls.update();
  this.animationMixer?.update(delta);
  this.renderer.render(this.scene, this.camera);
};
```

### Expected Results
- Loading overlay shows spinner + progress bar during load, fades out on complete
- Error overlay shows on failure with retry button that reloads
- Fullscreen button toggles fullscreen with correct icons and ARIA
- Screenshot captures at 2x resolution and triggers download
- Animation controls appear only when model has animations
- Play/pause/stop/speed/select all function correctly

---

## Phase 8: Accessibility Layer

**Goal:** Implement full WCAG 2.1 AA compliance: keyboard-driven orbit, zoom, and pan; focus management; ARIA attribute management.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/a11y/keyboard.ts` | Created | `class KeyboardHandler`: listens to `keydown` on container. Arrow keys → orbit (adjusts camera spherical coordinates via `controls.rotateLeft/Up` or direct manipulation). `+`/`=` → zoom in (`controls.dollyIn`). `-` → zoom out (`controls.dollyOut`). `0` → reset camera. `R` → toggle auto-rotate. `F` → toggle fullscreen. `Space` → play/pause animation. `Escape` → exit fullscreen. All keyboard handlers only active when container has focus (`document.activeElement` check). Orbit step size: 5 degrees per keypress. Zoom step: 10% of current distance. `destroy()` → remove listener |
| `src/a11y/focus.ts` | Created | `setupFocusManagement(container, elements)` → makes container focusable (`tabindex="0"`), applies visible focus ring on `:focus-visible`, manages focus on fullscreen enter/exit (move to container / restore to button), moves focus to retry button on error |
| `src/a11y/aria.ts` | Created | `setContainerAria(container, config)` → `role="application"`, `aria-label="3D model viewer: {alt}"`, `aria-roledescription="3D viewer"`. `setCanvasAria(canvas, config)` → `role="img"`, `aria-label="{alt}"`. `setButtonAria(button, label, pressed?)` → `aria-label`, optional `aria-pressed`. `setLoadingAria(overlay)` → `aria-live="polite"`. `setErrorAria(overlay)` → `role="alert"`, `aria-live="assertive"`. `updateFullscreenAria(button, isFullscreen)` → toggle label + pressed |
| `src/core/ci-3d-view.ts` | Modified | Integrated KeyboardHandler (created after controls, destroyed on destroy), focus management (container tabindex, fullscreen focus), ARIA attributes (set on DOM creation) |
| `tests/a11y.test.ts` | Created | Keyboard orbit (arrow key → camera position change), keyboard zoom (+/- → distance change), keyboard reset (0 → initial position), keyboard shortcuts (R/F/Space), focus management (container tabindex, `:focus-visible`), ARIA attributes on all elements, loading `aria-live`, error `role="alert"` |

### Implementation Details

**Keyboard orbit via OrbitControls internal API:**

OrbitControls doesn't expose direct keyboard orbit methods. Implementation approach: simulate small orbit movements by adjusting the camera's spherical coordinates relative to the target.

```ts
private handleArrowKeys(key: string): void {
  const step = (5 * Math.PI) / 180; // 5 degrees
  switch (key) {
    case 'ArrowLeft':  this.controls.rotateLeft(step); break;  // azimuth (not a public API — we manipulate spherical directly)
    case 'ArrowRight': this.controls.rotateLeft(-step); break;
    case 'ArrowUp':    this.controls.rotateUp(step); break;
    case 'ArrowDown':  this.controls.rotateUp(-step); break;
  }
  this.controls.update();
}
```

Note: `OrbitControls.rotateLeft()` and `rotateUp()` are undocumented semi-public methods. If they're not available in the target Three.js version, fall back to direct spherical coordinate manipulation on the camera position.

**Keyboard zoom:**

```ts
private handleZoomKeys(key: string): void {
  const factor = 0.9; // 10% zoom step
  if (key === '+' || key === '=') {
    // Dolly in: move camera 10% closer to target
    const direction = new Vector3().subVectors(this.controls.target, this.camera.position);
    this.camera.position.addScaledVector(direction, 1 - factor);
  } else if (key === '-') {
    const direction = new Vector3().subVectors(this.controls.target, this.camera.position);
    this.camera.position.addScaledVector(direction, 1 - (1 / factor));
  }
  this.controls.update();
}
```

### Expected Results
- Arrow keys orbit camera when container focused
- +/- keys zoom in/out
- 0 resets camera
- R toggles auto-rotate, F toggles fullscreen, Space toggles animation
- Keyboard-only navigation is fully functional
- All ARIA attributes present and correct
- Screen reader announces loading progress and errors

---

## Phase 9: React Wrapper

**Goal:** Build separate entry point with `<CI3DViewer>` component, `useCI3DView` hook, and ref API. SSR-safe.

### Files

| File | Action | Description |
|------|--------|-------------|
| `src/react/types.ts` | Created | `CI3DViewerProps` (mirrors all `CI3DViewConfig` props + `className` + `style`), `CI3DViewerRef` (mirrors `CI3DViewInstance` methods), `UseCI3DViewOptions`, `UseCI3DViewReturn` |
| `src/react/use-ci-3d-view.ts` | Created | `useCI3DView(options)` → creates `containerRef: RefObject<HTMLDivElement>`, `instance: MutableRefObject<CI3DViewInstance | null>`. `useEffect` (client-only): `instance.current = new CI3DView(containerRef.current, options)`. Cleanup: `instance.current?.destroy()`. Dependency array: serialized config for re-init on change. Returns `{ containerRef, instance }` |
| `src/react/ci-3d-viewer.tsx` | Created | `forwardRef` component. Uses `useCI3DView` internally. `useImperativeHandle` exposes all instance methods (loadModel, setCameraPosition, resetCamera, setAutoRotate, screenshot, downloadScreenshot, playAnimation, pauseAnimation, stopAnimation, setAnimationSpeed, getAnimations, enterFullscreen, exitFullscreen, isFullscreen, update, destroy). Renders `<div ref={containerRef} className={className} style={style} />` |
| `src/react/index.ts` | Created | Named exports: `CI3DViewer` component, `useCI3DView` hook, types |
| `tests/react.test.tsx` | Created | Render component (container div created), mount lifecycle (CI3DView instantiated in useEffect), ref API (methods callable), prop changes (update called), unmount cleanup (destroy called), SSR safety (no errors during server render) |

### Implementation Details

**SSR safety in hook:**

```ts
export function useCI3DView(options: UseCI3DViewOptions): UseCI3DViewReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const instance = useRef<CI3DViewInstance | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    instance.current = new CI3DView(containerRef.current, options);

    return () => {
      instance.current?.destroy();
      instance.current = null;
    };
  }, [/* serialized config deps */]);

  return { containerRef, instance };
}
```

No `window`, `document`, `navigator`, or `WebGLRenderingContext` access outside `useEffect`. The component renders a plain `<div>` on the server.

**useImperativeHandle for ref API:**

```ts
useImperativeHandle(ref, () => ({
  loadModel: (...args) => instance.current?.loadModel(...args),
  setCameraPosition: (...args) => instance.current?.setCameraPosition(...args),
  resetCamera: () => instance.current?.resetCamera(),
  setAutoRotate: (enabled) => instance.current?.setAutoRotate(enabled),
  screenshot: (scale) => instance.current?.screenshot(scale) ?? '',
  downloadScreenshot: (...args) => instance.current?.downloadScreenshot(...args),
  playAnimation: (...args) => instance.current?.playAnimation(...args),
  pauseAnimation: () => instance.current?.pauseAnimation(),
  stopAnimation: () => instance.current?.stopAnimation(),
  setAnimationSpeed: (speed) => instance.current?.setAnimationSpeed(speed),
  getAnimations: () => instance.current?.getAnimations() ?? [],
  enterFullscreen: () => instance.current?.enterFullscreen(),
  exitFullscreen: () => instance.current?.exitFullscreen(),
  isFullscreen: () => instance.current?.isFullscreen() ?? false,
  update: (config) => instance.current?.update(config),
  destroy: () => instance.current?.destroy(),
  getThreeObjects: () => instance.current?.getThreeObjects() ?? null,
  getElements: () => instance.current?.getElements() ?? null,
}), []);
```

### Expected Results
- `<CI3DViewer src="model.glb" />` renders and mounts viewer
- Ref API methods all delegate correctly
- Unmount calls `destroy()` for cleanup
- Server-side render produces empty `<div>` without errors
- React build externalized react/react-dom + three

---

## Phase 10: Demo Site, Testing & Release

**Goal:** Build comprehensive demo site, achieve test coverage targets, write README, finalize release artifacts.

### Files

| File | Action | Description |
|------|--------|-------------|
| `demo/index.html` | Created | Single-page layout: sticky nav with Scaleflex SVG logo + responsive burger menu, hero section (gradient bg, feature pills, live auto-rotating 3D viewer), getting started (npm + CDN cards), format support (GLB + OBJ side-by-side), lighting & environment (HDR toggle, shadows toggle, tone mapping selector), animation playback (animated model + controls + speed slider), interactive configurator (controls panel + live preview + generated code), React integration (code example), footer (Scaleflex logo + links) |
| `demo/demo.css` | Created | Demo-specific styles: sticky nav with backdrop-filter blur, hero gradient, card components, responsive grid (768px breakpoint), code blocks with dark theme, form controls, Inter font, blue (#0058a3) primary palette, burger menu for mobile (<868px) |
| `demo/demo.ts` | Created | Initializes all demo viewers, scroll-aware nav highlighting, burger menu toggle, copy-to-clipboard handlers |
| `demo/configurator.ts` | Created | Interactive playground: toggles (auto-rotate, shadows, fullscreen, screenshot, damping), selects (tone mapping, theme, background), sliders (rotation speed, shadow opacity, exposure), live code generation with copy, uses `instance.update()` for non-destructive updates with `minHeight` pinning |
| `demo/react-demo/index.html` | Created | React demo entry |
| `demo/react-demo/main.tsx` | Created | React demo mount |
| `demo/react-demo/app.tsx` | Created | React demo showcasing `<CI3DViewer>` component, `useCI3DView` hook, ref API |
| `examples/vanilla/` | Created | CodeSandbox example: index.html, index.js (imports CI3DView, creates viewer), package.json (deps: three, @cloudimage/3d-view, vite), vite.config.js, sandbox.config.json |
| `examples/react/` | Created | React CodeSandbox example: index.html, src/App.jsx, src/index.jsx, package.json (deps: three, @cloudimage/3d-view, react, vite), vite.config.js, sandbox.config.json |
| `README.md` | Created | Badges, features, installation (npm + CDN with Three.js), quick start, full API reference, React usage, theming, accessibility, TypeScript, browser support |
| `LICENSE` | Created | MIT license, Scaleflex copyright |
| `CHANGELOG.md` | Created | v1.0.0 changelog |
| `.github/workflows/deploy-demo.yml` | Created | GitHub Actions: checkout → install → build demo → deploy to gh-pages branch |
| `.github/workflows/deploy-pages.yml` | Created | GitHub Pages build workflow |
| `tests/integration.test.ts` | Created | End-to-end: init → loading overlay → model loaded → orbit via keyboard → zoom → reset → screenshot → fullscreen → destroy |
| `tests/edge-cases.test.ts` | Created | Missing src, invalid format, WebGL context loss simulation, rapid load/destroy, multiple instances on same page, SSR environment (no window), container resize during load |
| `package.json` | Modified | Final: repository, bugs, homepage, author, keywords fields |

### Expected Results
- `npm run dev` starts local dev server with working demo
- All demo sections functional with live 3D viewers
- `npm run build:demo` produces static site for GitHub Pages
- All tests pass (target: 150+ tests across 13 files)
- `npm run typecheck` + `npm run lint` clean
- Bundle sizes within targets (ESM < 20 KB, UMD < 25 KB gzipped, excluding Three.js)
- CodeSandbox examples functional

---

## Dependency Graph (Execution Order)

```
Phase 1:  Types + Build Pipeline
    |
Phase 2:  Utilities + CSS
    |
Phase 3:  Renderer, Scene & Model Loading
    |
    ├── Phase 4:  Lighting, Environment & Shadows
    |
    └── Phase 5:  Camera Controls & Auto-Rotate
          |
Phase 6:  Core CI3DView Class + Config + autoInit
    |
Phase 7:  UI Overlays & Animation Playback
    |
Phase 8:  Accessibility Layer
    |
Phase 9:  React Wrapper
    |
Phase 10: Demo Site, Testing & Release
```

Phases 4 and 5 can be implemented in parallel (both depend on Phase 3 but not on each other). All other phases are sequential.

---

## Testing Strategy

### WebGL Mocking

Three.js `WebGLRenderer` requires a real WebGL context not available in jsdom. The testing strategy:

1. **Mock `WebGLRenderer`** in `tests/setup.ts` — provides a fake canvas element and stub methods (`render`, `setSize`, `dispose`, etc.)
2. **Test DOM + logic paths** — config parsing, data-attribute mapping, DOM structure creation, overlay show/hide, keyboard handler dispatch, ARIA attributes, event callbacks, resource disposal traversal
3. **Test Three.js math** with real Three.js classes — `Vector3`, `Box3`, `Sphere`, `Matrix4` work in Node.js without WebGL
4. **Mock loaders** — `GLTFLoader.load` and `OBJLoader.load` are mocked to return synthetic model data
5. **Integration tests** use mocked renderer but real scene graph traversal

### What's NOT Tested in Unit Tests

- Actual WebGL rendering output (requires browser)
- Visual regression (pixel comparison)
- Real model file parsing (requires network + WebGL)
- Touch gesture recognition (requires real touch events)

These would be covered by browser-based E2E tests (Playwright) in a future CI pipeline.
