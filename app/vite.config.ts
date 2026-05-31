import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: [
			{ find: '@', replacement: path.resolve(__dirname, './src') },
		],
	},
	server:{
		allowedHosts:true
	}
});
