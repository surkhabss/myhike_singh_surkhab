import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({ build: { rollupOptions: {
  input: Object.fromEntries(['index', 'login', 'main', 'eachHike', 'skeleton']
    .map(name => [name, resolve(process.cwd(), `${name}.html`)])),
} } });
