import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({
 root:fileURLToPath(new URL('./browser/',import.meta.url)),
 server:{host:'0.0.0.0',port:5174,strictPort:true,fs:{allow:[fileURLToPath(new URL('./',import.meta.url))]}},
 preview:{host:'0.0.0.0',port:4174,strictPort:true},
 build:{outDir:fileURLToPath(new URL('./browser-dist/',import.meta.url)),emptyOutDir:true},
});
