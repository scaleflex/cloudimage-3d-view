import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Standalone UMD build that bundles Three.js and all addons.
 * Used for CDN embedding where no module bundler is available.
 * Only `web-ifc` remains external (optional IFC support).
 */
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, '../src/index.ts'),
    },
    rollupOptions: {
      external: ['web-ifc'],
      output: [
        {
          format: 'umd',
          entryFileNames: '3d-view.standalone.min.js',
          inlineDynamicImports: true,
          name: 'CI3DView',
          exports: 'named',
          globals: {
            'web-ifc': 'WebIFC',
          },
        },
      ],
    },
    sourcemap: true,
    minify: 'esbuild',
    outDir: resolve(__dirname, '../dist'),
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
    },
  },
});
