import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative assets + hash routes work under any static hosting subdirectory.
  base: './',
  server: { allowedHosts: true },
  build: { target: 'es2022', chunkSizeWarningLimit: 800 },
});
