import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// La app se compila dentro de ../citas (carpeta del subdominio), sin borrar la API PHP.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: { outDir: '../citas', emptyOutDir: false, assetsDir: 'app' },
  server: { fs: { allow: ['..'] }, proxy: { '/api': 'http://localhost:8900', '/r/': 'http://localhost:8900' } },
});
