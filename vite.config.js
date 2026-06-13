import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const ALLOWED_HOST = 'api.chess.com'
const ALLOWED_PREFIX = '/pub/'

function chessApiProxy() {
  return {
    name: 'chess-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/chess')) return next()

        const { searchParams } = new URL(req.url, 'http://localhost')
        const target = searchParams.get('url')
        if (!target) {
          res.statusCode = 400
          res.end('Missing url parameter')
          return
        }

        let targetUrl
        try {
          targetUrl = new URL(target)
        } catch {
          res.statusCode = 400
          res.end('Invalid url')
          return
        }

        if (
          targetUrl.protocol !== 'https:' ||
          targetUrl.hostname !== ALLOWED_HOST ||
          !targetUrl.pathname.startsWith(ALLOWED_PREFIX)
        ) {
          res.statusCode = 403
          res.end('Forbidden host or path')
          return
        }

        try {
          const upstream = await fetch(targetUrl.toString(), {
            headers: { 'User-Agent': 'ChessAnalyzer/1.0 (dev)' },
          })
          res.statusCode = upstream.status
          res.setHeader('Content-Type', upstream.headers.get('Content-Type') || 'application/json')
          res.end(await upstream.text())
        } catch {
          res.statusCode = 502
          res.end('Upstream fetch failed')
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), chessApiProxy()],
})
