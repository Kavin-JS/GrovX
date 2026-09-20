import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Deployed to https://Kavin-JS.github.io/GrovX/, so every asset URL must start with /GrovX/.
// The app uses hash-based routing (#/lab, #/benchmarks, ...), so no server rewrites are needed.
export default defineConfig({
  base: '/GrovX/',
  plugins: [react()],
  test: { environment: 'node' },
});
