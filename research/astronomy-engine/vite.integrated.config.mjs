import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
// Separate review build: does not change deployment settings or public assets.
export default defineConfig({
 root:fileURLToPath(new URL('../../',import.meta.url)),
 build:{outDir:fileURLToPath(new URL('./integrated-dist/',import.meta.url)),emptyOutDir:true,rollupOptions:{output:{inlineDynamicImports:true}}},
});
