/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    target: 'es2019',
    outDir: 'dist',
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    // Sem o helper de preload do Vite, que emite uma referência a fetch()
    // e faria a trava de rede da Task 16 acusar falso positivo.
    modulePreload: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
