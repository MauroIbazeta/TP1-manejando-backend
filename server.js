const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

let conceptos = [];
let nextId = 1;

function sendJSON(res, statusCode, data) {
  const json = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(json);
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        if (!body) return resolve({});
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

function serveStatic(req, res) {
  let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 - Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(content);
    }
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (pathname.startsWith('/api/concepts')) {
    try {
      if (req.method === 'GET' && pathname === '/api/concepts') {
        return sendJSON(res, 200, conceptos);
      }

      const idMatch = pathname.match(/^\/api\/concepts\/(\d+)$/);
      if (req.method === 'GET' && idMatch) {
        const id = Number(idMatch[1]);
        const item = conceptos.find(c => c.id === id);
        if (!item) return sendJSON(res, 404, { message: 'No existe concepto con ese id' });
        return sendJSON(res, 200, item);
      }

      if (req.method === 'POST' && pathname === '/api/concepts') {
        const body = await parseRequestBody(req);
        if (!body.name || !body.description) {
          return sendJSON(res, 400, { message: 'Faltan nombre o descripcion' });
        }
        const newConcept = { id: nextId++, name: body.name, description: body.description };
        conceptos.push(newConcept);
        return sendJSON(res, 201, newConcept);
      }

      if (req.method === 'DELETE' && pathname === '/api/concepts') {
        conceptos = [];
        return sendJSON(res, 200, { message: 'Todos los conceptos eliminados' });
      }

      if (req.method === 'DELETE' && idMatch) {
        const id = Number(idMatch[1]);
        const idx = conceptos.findIndex(c => c.id === id);
        if (idx === -1) return sendJSON(res, 404, { message: 'No existe este concepto' });
        const deleted = conceptos.splice(idx, 1)[0];
        return sendJSON(res, 200, { message: 'Eliminado', deleted });
      }

      return sendJSON(res, 404, { message: 'Ruta API no encontrada' });

    } catch (err) {
      console.error('API ERROR', err);
      return sendJSON(res, 500, { message: 'Error del servidor', error: err.message });
    }
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
