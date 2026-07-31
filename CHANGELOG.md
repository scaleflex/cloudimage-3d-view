# Changelog

All notable changes to this project will be documented in this file.

## [1.2.2] - 2026-07-31

### Fixed
- IFC loading with an absolute `ifcWasmPath`: the path is now marked absolute so
  web-ifc resolves the `.wasm` URL instead of prefixing its own base path

### Changed
- Auto-rotate control now uses the Lucide Orbit icon
- Documented `ifcWasmPath` and aligned the `web-ifc` peer dependency range
- Demo: replaced the "Also by" carousel with a plugins catalog and shared footer,
  with corrected Cloudimage plugin display names
- Docs and demo now point at `cdn.cloudimage.io`
- The built UMD bundle is no longer tracked in git

## [1.2.0] - 2026-03-06

### Added
- `autoLoad` option to defer Three.js initialization until user click
- Click-to-activate overlay with optional `thumbnail` preview image
- `data-ci-3d-auto-load` and `data-ci-3d-thumbnail` data attributes
- Keyboard-accessible overlay button with `:focus-visible` style
- Programmatic `loadModel()` auto-initializes when `autoLoad` is false

### Fixed
- Public API methods no longer crash when called before initialization
- `getThreeObjects()` returns `null` instead of `undefined` for uninitialized fields
- `validateConfig` no longer warns about missing `src` when `autoLoad` is false

## [1.0.0] - 2025-02-17

### Added
- Core 3D viewer with Three.js integration
- GLB/glTF format support with DRACO compression
- OBJ + MTL format support with material auto-detection
- STL format support with auto-assigned standard material
- FBX format support with skeletal animations
- 3DS format support (legacy Autodesk format)
- AMF format support (additive manufacturing)
- Orbit controls with damping, zoom, and rotation constraints
- Ctrl+scroll to zoom (prevents scroll hijacking) with tooltip hint
- Auto-rotate with configurable speed and pause-on-interact
- 3-point lighting system (ambient + key/fill/rim)
- HDR/EXR environment map support via PMREMGenerator
- ACES filmic, Reinhard, Cineon, and Linear tone mapping
- Shadow rendering with transparent ground plane
- Animation playback (play/pause/stop/speed) via AnimationMixer
- Screenshot capture and download
- Fullscreen toggle with browser API
- Light and dark theme support with background toggle button
- 40+ HTML data-attributes for declarative configuration
- `CI3DView.autoInit()` for automatic element discovery
- Smooth camera reset with ease-out cubic interpolation
- WCAG 2.1 AA accessibility (keyboard navigation, ARIA attributes, focus management)
- `prefers-reduced-motion` support (disables auto-rotate, instant camera transitions)
- React wrapper component (`CI3DViewer`) with SSR safety
- React ref API for imperative control
- React hook (`useCI3DView`) for custom integrations
- Full TypeScript support with strict mode
- ESM, CJS, and UMD output formats
- Zero runtime dependencies (Three.js as peer dependency)
- Comprehensive test suite (170 tests)
- Interactive demo site with configurator
- GitHub Actions CI (Node 18/20/22) and demo deployment
