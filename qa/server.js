import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform, virtualFiles } from './sandbox.js';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
export async function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const virtual = virtualFiles[path];
      if (virtual !== undefined) {
        res.writeHead(200, { 'Content-Type': path.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8' });
        return res.end(virtual);
      }
      const relative = path === '/' ? 'index.html' : path.slice(1);
      const full = resolve(root, relative);
      if (!full.startsWith(root + sep)) { res.writeHead(403); return res.end(); }
      let content = await readFile(full);
      const type = extname(full);
      if (['.html', '.js'].includes(type)) content = transform(content.toString(), relative);
      res.writeHead(200, { 'Content-Type': ({ '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css' })[type] || 'application/octet-stream', 'Cache-Control':'no-store' });
      res.end(content);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
  await new Promise((ok, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', ok); });
  return {
    url: 'http://127.0.0.1:' + server.address().port,
    close: () => new Promise((ok, fail) => server.close(e => e ? fail(e) : ok()))
  };
}
