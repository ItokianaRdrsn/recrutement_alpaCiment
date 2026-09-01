import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const backendUrl = env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

    return {
        plugins: [react()],
        build: {
            cssMinify: true,
            chunkSizeWarningLimit: 1000,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('node_modules/lucide-react')) {
                            return 'vendor-icons';
                        }
                        if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                            return 'vendor-react';
                        }
                    },
                },
            },
        },
        optimizeDeps: {
            include: ['react', 'react-dom', 'lucide-react'],
            holdUntilCrawlEnd: false,
        },
        server: {
            port: 5173,
            strictPort: true,
            warmup: {
                clientFiles: ['./src/main.jsx', './src/api/client.js', './src/styles.css'],
            },
            proxy: {
                '/api': {
                    target: backendUrl,
                    changeOrigin: true,
                },
                '/logout': {
                    target: backendUrl,
                    changeOrigin: true,
                },
                '/login': {
                    target: backendUrl,
                    changeOrigin: true,
                },
            },
        },
    };
});
