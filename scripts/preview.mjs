import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const publicDir = path.join(repoRoot, 'public');
const port = Number(process.argv[2] || process.env.PORT || 8767);
const runtimeOverrideFile = process.env.JOURNAL_RUNTIME_FILE
  ? path.resolve(process.env.JOURNAL_RUNTIME_FILE)
  : '';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function safeJoinPublic(urlPath) {
  const normalized = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  const requested = normalized === '' ? 'Journal.html' : normalized;
  if (requested === 'runtime.js' && runtimeOverrideFile) {
    return runtimeOverrideFile;
  }
  const fullPath = path.resolve(publicDir, requested);
  if (!fullPath.startsWith(publicDir)) return null;
  return fullPath;
}

const server = http.createServer(async (req, res) => {
  const filePath = safeJoinPublic(req.url || '/');
  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    const resolvedPath = stat.isDirectory() ? path.join(filePath, 'Journal.html') : filePath;
    const body = await fs.readFile(resolvedPath);
    const ext = path.extname(resolvedPath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  }
});

server.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Try: npm run preview -- 8768`);
    process.exitCode = 1;
    return;
  }
  throw error;
});

server.listen(port, () => {
  console.log(`Journal preview running at http://localhost:${port}/Journal.html`);
});
