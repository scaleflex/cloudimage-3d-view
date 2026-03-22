# Code Review Issues

Deep code review of the `@cloudimage/3d-view` codebase. Issues organized by severity.

---

## Critical

### ~~1. Race condition: concurrent `loadModel` calls can corrupt state~~
**File:** `src/core/ci-3d-view.ts`

~~Fixed: `loadGeneration` counter incremented on each load; stale results are detected and disposed.~~

### ~~2. DRACOLoader WebWorker never disposed — memory leak per load~~
**File:** `src/loaders/gltf-loader.ts`

~~Fixed: Shared singleton `DRACOLoader` instance reused across loads via `getSharedDRACOLoader()`.~~

### ~~3. React hook race condition: instance null during async import~~
**File:** `src/react/use-ci-3d-view.ts`

~~Fixed: `ready` state exposed; `destroyed` flag prevents stale initialization; React ref methods gracefully no-op when instance is null.~~

---

## High

### ~~4. OrbitControls leak on model reload~~
**File:** `src/core/ci-3d-view.ts`

~~Fixed: Controls are created once in `setupThreeJS()` and reused via `updateControlsConstraints()` — never recreated on model reload.~~

### ~~5. AutoRotateController holds stale controls reference after recreation~~
**File:** `src/core/ci-3d-view.ts`

~~Fixed: Controls are no longer recreated (see #4), so the reference stays valid.~~

### ~~6. Auto-rotate resumes after interaction even when explicitly stopped~~
**File:** `src/controls/auto-rotate.ts`

~~Fixed: `enabled` flag added. `stop()` sets it to `false`, checked in `onInteractEnd` before scheduling resume.~~

### ~~7. `reduceLightingForIBL` is not idempotent — repeated calls keep halving intensity~~
**File:** `src/lighting/lighting.ts`

~~Fixed: Uses `originalIntensities` stored at creation time — always multiplies from original values, not current.~~

### ~~8. Double-dispose of same texture when `background === environment`~~
**File:** `src/lighting/environment.ts`

~~Fixed: `sameTexture` check prevents disposing the background texture when it's the same object as environment.~~

### ~~9. No cancellation for `smoothCameraReset` animation~~
**File:** `src/controls/camera-reset.ts`

~~Fixed: Returns `CameraResetHandle` with `cancel()`. Previous reset is cancelled before starting a new one.~~

### ~~10. Unhandled Promise rejections from fullscreen API~~
**File:** `src/ui/fullscreen.ts`, `src/core/ci-3d-view.ts`

~~Fixed: `.catch(() => {})` added to all `requestFullscreen()` and `exitFullscreen()` calls.~~

### ~~11. `captureScreenshot` does not restore renderer state on error~~
**File:** `src/ui/screenshot.ts`, `src/core/ci-3d-view.ts`

~~Fixed: Wrapped in `try/catch/finally` — renderer size always restored in `finally` block.~~

### ~~12. `toDataURL()` throws on tainted canvases with no error handling~~
**File:** `src/ui/screenshot.ts`, `src/core/ci-3d-view.ts`

~~Fixed: `catch` block catches `SecurityError` and returns empty string.~~

### ~~13. `emit()` handler throw stops all subsequent handlers~~
**File:** `src/utils/events.ts`

~~Fixed: Each handler invocation wrapped in `try/catch` with `console.error`.~~

### ~~14. Set mutation during iteration in `once()` — re-entrant emit risk~~
**File:** `src/utils/events.ts`

~~Fixed: Uses `[...handlers]` spread to iterate a copy of the set.~~

---

## Medium

### ~~15. `webkitfullscreenchange` listener never removed on destroy~~
**File:** `src/core/ci-3d-view.ts`

~~Fixed: Both `fullscreenchange` and `webkitfullscreenchange` listeners removed in `destroy()`.~~

### ~~16. `mixer.uncacheRoot(this.model!)` when model may be null~~
**File:** `src/core/ci-3d-view.ts`

~~Fixed: Added `if (this.model)` guard before `mixer.uncacheRoot()`.~~

### ~~17. Unhandled promise rejection in `update()` when loading new src~~
**File:** `src/core/ci-3d-view.ts`

~~Fixed: Added `.catch(() => {})` to `this.loadModel()` call in `update()`.~~

### ~~18. Resize observer timeout fires after destroy~~
**File:** `src/core/renderer.ts`

~~Fixed: Patched `observer.disconnect()` to also clear the pending debounce timeout.~~

### ~~19. No WebGL context loss handling~~
**File:** `src/core/renderer.ts`

~~Fixed: Added `webglcontextlost` (with `preventDefault()`) and `webglcontextrestored` listeners that re-initialize renderer state.~~

### ~~20. No post-destroy guards on public methods~~
**File:** `src/core/ci-3d-view.ts`

~~Fixed: Added `if (this.destroyed) return` guards on `loadModel`, `setCameraPosition`, `setCameraTarget`, `resetCamera`, `screenshot`, and `update`.~~

### ~~21. `scaleToFit` uses `multiplyScalar` — compounds on repeated calls~~
**File:** `src/utils/math.ts`

~~Fixed: Uses `model.scale.set(scale, scale, scale)` for absolute scaling.~~

### ~~22. `fitCameraToModel` ignores aspect ratio~~
**File:** `src/utils/math.ts`

~~Fixed: Computes both vertical and horizontal FOV, uses `Math.min(vFov, hFov)` for effective FOV to ensure model fits both axes.~~

### ~~23. Skinned mesh bounding box uses bind pose, not animated pose~~
**File:** `src/utils/math.ts`

~~Fixed: Uses `child.computeBoundingBox()` for `SkinnedMesh` to account for bone transforms.~~

### ~~24. `disposeObject3D` only handles `isMesh` — misses Lines, Points, Sprites~~
**File:** `src/utils/dispose.ts`

~~Fixed: Now checks for `geometry` and `material` properties directly, handling all Object3D subtypes (Mesh, Line, LineSegments, Points, Sprite).~~

### ~~25. Shared materials/textures disposed multiple times~~
**File:** `src/utils/dispose.ts`

~~Fixed: Uses `Set<Material>` and `Set<Texture>` to track already-disposed resources.~~

### ~~26. `once()` prevents `off()` from removing handler before event fires~~
**File:** `src/utils/events.ts`

~~Fixed: Added `onceMap` to store original→wrapper handler mapping. `off()` checks `onceMap` to remove once handlers by original reference.~~

### ~~27. Global mutable loader array with no dedup or cleanup~~
**File:** `src/loaders/loader-registry.ts`

~~Fixed: `registerLoader()` checks for extension overlap before pushing to prevent duplicate registrations.~~

### ~~28. OBJ material upgrade may break shared textures~~
**File:** `src/loaders/obj-loader.ts`

~~Fixed: Null out `mat.map` before `mat.dispose()` to prevent shared texture disposal.~~

### ~~29. Environment map URL format detection fragile with query strings~~
**File:** `src/lighting/environment.ts`

~~Fixed: URL is stripped of query string and hash before checking `.exr` extension.~~

### ~~30. Shadow camera frustum hardcoded — doesn't adapt to model size~~
**File:** `src/lighting/lighting.ts`

~~Fixed: Added `updateShadowFrustum()` that adapts shadow camera frustum to model size based on bounding sphere radius.~~

### ~~31. Progress callbacks can report values > 1.0~~
**File:** All loaders

~~Fixed: All loaders now clamp progress with `Math.min(event.loaded / event.total, 1)`.~~

### ~~32. Loading overlay progress not clamped~~
**File:** `src/core/ci-3d-view.ts`

~~Fixed: `updateProgress()` now clamps input to [0, 1] range.~~

### ~~33. Progress bar missing ARIA attributes~~
**File:** `src/core/ci-3d-view.ts`

~~Fixed: Added `role="progressbar"`, `aria-valuemin`, `aria-valuemax`, `aria-valuenow` attributes. `aria-valuenow` updated on each progress change.~~

### ~~34. Error overlay `retryBtn.focus()` steals focus unconditionally~~
**File:** `src/ui/error.ts`

~~Fixed: Only focuses retry button when the container already has focus.~~

### ~~35. Escape key toggles fullscreen instead of only exiting~~
**File:** `src/a11y/keyboard.ts`

~~Fixed: Escape now only calls `onToggleFullscreen()` when already in fullscreen mode.~~

### ~~36. Keyboard zoom bypasses OrbitControls min/max distance~~
**File:** `src/a11y/keyboard.ts`

~~Fixed: Keyboard zoom now computes new distance and clamps it to `controls.minDistance` / `controls.maxDistance`.~~

### ~~37. `role="application"` without keyboard instructions~~
**File:** `src/a11y/aria.ts`, `src/core/ci-3d-view.ts`

~~Fixed: Added hidden keyboard help element with `aria-describedby` and `.ci-3d-sr-only` CSS class for screen-reader-only content.~~

### ~~38. `screenshot()` returns empty string when React instance not ready~~
**File:** `src/react/types.ts`

~~Fixed: Added JSDoc documenting that methods return defaults (empty string, empty array, false, etc.) when instance is not yet initialized.~~

### ~~39. React `destroy()` on ref can cause double-destroy~~
**File:** `src/react/ci-3d-viewer.tsx:29`

~~Fixed: `destroyed` flag in `CI3DView.destroy()` prevents double-dispose.~~

### ~~40. React hook only re-inits on `src` change~~
**File:** `src/react/use-ci-3d-view.ts`

~~Fixed: Added second `useEffect` that calls `instance.update()` for prop changes (autoRotate, theme, background, shadows, etc.) without full re-init.~~

### ~~41. `autoPlayAnimation` vs `animation` logic is identical~~
**File:** `src/core/ci-3d-view.ts`

~~Fixed: Consolidated into a single condition: `if (autoPlayAnimation || animation !== undefined)`.~~

### ~~42. `.usdz` in known extensions but no loader supports it~~
**File:** `src/loaders/loader-registry.ts`

~~Fixed: `.usdz` removed from `knownExtensions` after USDZ support rollback.~~

### ~~43. `throttle` return type cast is unsound~~
**File:** `src/utils/events.ts`

~~Fixed: Added `ThrottledFunction<T>` type that properly extends `T` with `cancel()` method. No unsafe cast.~~

### ~~44. Old environment not disposed before overwriting with new one~~
**File:** `src/lighting/environment.ts`

~~Fixed: `disposeEnvironment(scene)` called at the start of `loadEnvironmentMap()` before loading new texture.~~

### ~~45. `screenshot()` scale parameter not validated~~
**File:** `src/core/ci-3d-view.ts`

~~Fixed: Scale clamped to [0.1, 8] range.~~

### ~~46. `AnimationMixerWrapper.play()` after dispose() will crash~~
**File:** `src/animation/animation-mixer.ts`

~~Fixed: Added `disposed` flag, checked in all methods (`play`, `pause`, `resume`, `stop`, `setSpeed`, `update`).~~

### ~~47. Animation controls don't indicate current playback state~~
**File:** `src/animation/animation-controls.ts`

~~Fixed: Added `aria-pressed` on play/pause buttons. `updateButtonStates()` helper tracks playing/paused/stopped state.~~

### ~~48. React `CI3DViewerRef` types claim always-valid returns~~
**File:** `src/react/types.ts`

~~Fixed: Added JSDoc documenting that methods return defaults when instance is not yet initialized. Use `ready` state to check readiness.~~

### ~~49. Polar angle and zoom range validation missing~~
**File:** `src/controls/orbit-controls.ts`

~~Fixed: Min/max values validated and swapped if inverted for both polar angle and zoom ranges.~~

### ~~50. `updateControlsConstraints` with radius=0 locks zoom~~
**File:** `src/controls/orbit-controls.ts`

~~Fixed: Radius clamped to minimum of 0.01.~~

---

## Low

### ~~51. `groundPlane` typed as `any`~~
**File:** `src/core/ci-3d-view.ts`

~~Fixed: Typed as `Mesh | null`.~~

### ~~52. `LoadResult.animations` typed as `any[]`~~
**File:** `src/core/types.ts`

~~Fixed: Typed as `AnimationClip[]`.~~

### ~~53. `CI3DViewInstance.controls` typed as `any`~~
**File:** `src/core/types.ts`

~~Fixed: Typed as `OrbitControls`.~~

### ~~54. `loadMtl` return type is `Promise<any>`~~
**File:** `src/loaders/obj-loader.ts`

~~Fixed: Return type is `Promise<InstanceType<typeof MTLLoader.MaterialCreator>>`.~~

### ~~55. `toBool` only checks `'true'` — `'1'`, `'yes'`, empty attribute all return `false`~~
**File:** `src/core/config.ts`

~~Fixed: `toBool` now accepts `'true'`, `'1'`, `'yes'`, and empty string `''`.~~

### ~~56. `JSON.parse` failure in data attributes silently swallowed~~
**File:** `src/core/config.ts`

~~Fixed: Added `console.warn` for malformed data attributes.~~

### ~~57. `Number()` coercion: `Number('')` returns 0~~
**File:** `src/core/config.ts`

~~Fixed: Added `toNumber()` function that returns `undefined` for empty/NaN strings. All numeric data attributes use `toNumber`.~~

### ~~58. `validateConfig` doesn't validate numeric ranges~~
**File:** `src/core/config.ts`

~~Fixed: Validates polarAngle [0,180], shadowOpacity [0,1], animationSpeed >= 0, pixelRatio > 0.~~

### ~~59. Camera `near`/`far` planes not dynamically adjusted~~
**File:** `src/core/scene.ts`, `src/utils/math.ts`

~~Fixed: `fitCameraToModel()` dynamically sets `near` and `far` based on the computed distance to the model.~~

### ~~60. `detectFormat` and `hasFileExtension` duplicate URL parsing logic~~
**File:** `src/loaders/loader-registry.ts`

~~Fixed: Extracted `extractFilename()` helper to deduplicate URL parsing.~~

### ~~61. Unused `SkinnedMesh` import~~
**File:** `src/utils/math.ts`

~~Fixed: Import was already removed.~~

### ~~62. `any` type in `computeBoundingBox` traverse callback~~
**File:** `src/utils/math.ts`

~~Fixed: Uses `instanceof Mesh` and `instanceof SkinnedMesh` checks instead of `any` type with duck-typing.~~

### ~~63. Injected styles never removed on destroy~~
**File:** `src/utils/dom.ts`

~~Fixed: Added reference counting with `removeStyles(id)` that decrements and removes style element when count reaches 0.~~

### ~~64. `throttle` has no `cancel()` method~~
**File:** `src/utils/events.ts`

~~Fixed: `ThrottledFunction` type includes `cancel()` method. `throttledCameraChange?.cancel()` called in `destroy()`.~~

### ~~65. `onCameraChange` fires every frame even when camera hasn't moved~~
**File:** `src/core/ci-3d-view.ts`

~~Fixed: Stores `lastCameraPos`/`lastCameraTarget` and only fires callback when position or target actually changed.~~

### ~~66. SVG icons missing `aria-hidden="true"`~~
**File:** `src/ui/error.ts`, `src/ui/fullscreen.ts`, `src/animation/animation-controls.ts`

~~Fixed: All SVG icon constants now include `aria-hidden="true"`.~~

### ~~67. `AnimationMixerWrapper.setSpeed()` only affects current action~~
**File:** `src/animation/animation-mixer.ts`

~~Fixed: Added `speed` field that persists across animation switches. Applied to new actions in `play()`.~~

### ~~68. Ground plane too small for tall/thin models~~
**File:** `src/lighting/shadows.ts`

~~Fixed: Diameter now uses `Math.max(size.x, size.y, size.z) * 3` to include vertical dimension.~~

### ~~69. `disposeEnvironment` nulling background overwrites theme background~~
**File:** `src/lighting/environment.ts`

~~Fixed: Only disposes background if it's a texture (not a Color set by the theme). Preserves Color backgrounds.~~

### ~~70. `cameraPosition`/`cameraTarget` tuple length not validated at runtime~~
**File:** `src/core/config.ts`

~~Fixed: Data attribute coercers validate 3-element numeric tuples, rejecting invalid arrays.~~

---

## Round 2 — Deep Code Review

### High

### ~~71. Retry handler fires `loadModelInternal` without `.catch()`~~
**File:** `src/core/ci-3d-view.ts:521`

~~Fixed: Added `.catch(() => {})` to the retry handler's `loadModelInternal()` call.~~

### ~~72. `loadEnvironmentMap` disposes old environment before new load succeeds~~
**File:** `src/lighting/environment.ts:29`

~~Fixed: Moved `disposeEnvironment(scene)` inside the success callback, so old environment is only disposed after new texture loads successfully.~~

---

### Medium

### ~~73. Old DRACOLoader not disposed on decoder path change~~
**File:** `src/loaders/gltf-loader.ts:11-14`

~~Fixed: Added `sharedDraco?.dispose()` before creating new DRACOLoader instance.~~

### ~~74. `webglcontextrestored` handler uses stale config closure~~
**File:** `src/core/renderer.ts:48-57`

~~Fixed: Extracted `applyToneMapping()` helper; context restored handler re-reads current config values.~~

### ~~75. OBJ material upgrade doesn't handle material arrays~~
**File:** `src/loaders/obj-loader.ts:38-52`

~~Fixed: Handles both single materials and `Material[]` arrays using `Array.isArray` check.~~

### ~~76. SkinnedMesh bounding box not transformed to world space~~
**File:** `src/utils/math.ts:18-24`

~~Fixed: Added `applyMatrix4(child.matrixWorld)` to transform SkinnedMesh bounding box to world space.~~

### ~~77. `cameraFov` not validated in `validateConfig`~~
**File:** `src/core/config.ts:153-184`

~~Fixed: Added validation that `cameraFov` must be between 0 (exclusive) and 180 (exclusive).~~

### ~~78. Toolbar SVG icons missing `aria-hidden="true"`~~
**File:** `src/ui/toolbar.ts:4-9`

~~Fixed: Added `aria-hidden="true"` to all 6 toolbar SVG icon constants.~~

---

### Low

### ~~79. Tuple validation accepts `Infinity`~~
**File:** `src/core/config.ts:98,106`

~~Fixed: Changed `isNaN(n)` to `!isFinite(n)` to reject both NaN and Infinity.~~

### ~~80. Shadow-casting traversal uses `any` type~~
**File:** `src/core/ci-3d-view.ts:716`

~~Fixed: Uses `instanceof Mesh` instead of `any` duck-typing. `Mesh` was already imported.~~

### ~~81. `disposeObject3D` traverse callback uses `any` type~~
**File:** `src/utils/dispose.ts:7`

~~Fixed: Removed `any` annotation; uses typed `meshLike` local with structural type assertion for geometry/material access.~~

### ~~82. Unused `prefix` variable in `parseDataAttributes`~~
**File:** `src/core/config.ts:119`

~~Fixed: Removed unused `prefix` variable.~~

### ~~83. Screenshot download anchor not in try/finally~~
**File:** `src/ui/screenshot.ts:26-28`

~~Fixed: Wrapped `a.click()` in try/finally to ensure anchor is always removed from DOM.~~

### ~~84. `navigator.platform` is deprecated~~
**File:** `src/core/ci-3d-view.ts:575`

~~Fixed: Uses `navigator.userAgentData?.platform` with `navigator.platform` fallback.~~

---

## Round 3 — Final Code Review

### Medium

### ~~85. `disposeModel()` doesn't uncache AnimationMixer + wrong ordering~~
**File:** `src/core/ci-3d-view.ts:886-900`

~~Fixed: Reordered to clean up mixer (with `uncacheRoot`) before nulling the model reference.~~

### ~~86. `loadModel()` doesn't cancel pending camera reset animation~~
**File:** `src/core/ci-3d-view.ts:147-158`

~~Fixed: Added `this.cameraResetHandle?.cancel()` at the start of `loadModel()`.~~

### ~~87. `disposeEnvironment()` called before `fromEquirectangular()` succeeds~~
**File:** `src/lighting/environment.ts:33-35`

~~Fixed: Reordered to create envMap via `fromEquirectangular()` first, then dispose old environment only after success.~~

---

### Low

### ~~88. Unused `inferMtlUrl` function~~
**File:** `src/loaders/obj-loader.ts:6-8`

~~Fixed: Removed dead code.~~

### ~~89. `downloadScreenshot()` doesn't guard against empty `dataUrl`~~
**File:** `src/ui/screenshot.ts:22-31`

~~Fixed: Early return when `dataUrl` is empty.~~

### ~~90. `retryBtn.focus()` is unconditional (regression from #34)~~
**File:** `src/ui/error.ts:45`

~~Fixed: Only focuses retry button when the viewer container already has focus.~~

### ~~91. Keyboard handler doesn't check `contenteditable` elements~~
**File:** `src/a11y/keyboard.ts:34-40`

~~Fixed: Added `contenteditable="true"` check to the input element filter.~~

### ~~92. `removeStyles()` defaults to count=1 for unknown IDs~~
**File:** `src/utils/dom.ts:62`

~~Fixed: Defaults to 0 and early returns if count goes negative.~~

---

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 3 | 3 |
| High | 13 | 13 |
| Medium | 45 | 45 |
| Low | 31 | 31 |
| **Total** | **92** | **92** |
