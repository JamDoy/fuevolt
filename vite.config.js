import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// In dev mode, replace production bundle references with source entry point
function devEntryPlugin() {
  return {
    name: 'dev-entry-point',
    transformIndexHtml(html, ctx) {
      if (ctx.server) {
        return html
          .replace(/<script type="module" crossorigin src="\/assets\/index-[^"]+\.js"><\/script>/, '<script type="module" src="/src/main.jsx"></script>')
          .replace(/<link rel="stylesheet" crossorigin href="\/assets\/index-[^"]+\.css">\s*/, '');
      }
      return html;
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devEntryPlugin()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
