import { defineConfig } from 'vite';
import { resolve } from 'path';
import { cpSync } from 'fs';

export default defineConfig({
  base: '/cloudimage-3d-view/',
  root: resolve(__dirname, '../demo'),
  build: {
    outDir: resolve(__dirname, '../dist-demo'),
    emptyOutDir: true,
  },
  plugins: [
    {
      name: 'copy-previews',
      closeBundle() {
        cpSync(
          resolve(__dirname, '../demo/previews'),
          resolve(__dirname, '../dist-demo/previews'),
          { recursive: true },
        );
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, '../src'),
    },
  },
});
