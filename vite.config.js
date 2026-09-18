import {defineConfig} from 'vite';

export default defineConfig({
  root: 'browser',
  publicDir: false,
  server: {
    host: '127.0.0.1',
  },
  preview: {
    host: '127.0.0.1',
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
