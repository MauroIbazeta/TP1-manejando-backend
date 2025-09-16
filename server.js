// Servidor Node.js para API REST

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// Array para almacenar los conceptos
let conceptos = [];
let nextId = 1;

// Envia una respuesta JSON con el codigo de estado indicado
function sendJSON(res, statusCode, data) {
  const json = JSON.stringify(data, null, 2);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(json);
}

// Parsea el cuerpo de la peticion (POST/DELETE) y lo convierte a objeto JS
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

// Sirve archivos estáticos desde la carpeta /public
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

// Crea el servidor HTTP
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Manejo de rutas de la API REST
  if (pathname.startsWith('/api/concepts')) {
    try {
      // GET /api/concepts - Devuelve todos los conceptos
      if (req.method === 'GET' && pathname === '/api/concepts') {
        return sendJSON(res, 200, conceptos);
      }

      // Detecta si la ruta tiene un id numerico al final
      const idMatch = pathname.match(/^\/api\/concepts\/(\d+)$/);

      // GET /api/concepts/:id - Devuelve un concepto por id
      if (req.method === 'GET' && idMatch) {
        const id = Number(idMatch[1]);
        const item = conceptos.find(c => c.id === id);
        if (!item) return sendJSON(res, 404, { message: 'No existe concepto con ese id' });
        return sendJSON(res, 200, item);
      }

      // POST /api/concepts - Crea un nuevo concepto
      if (req.method === 'POST' && pathname === '/api/concepts') {
        const body = await parseRequestBody(req);
        if (!body.name || !body.description) {
          return sendJSON(res, 400, { message: 'Faltan nombre o descripcion' });
        }
        const newConcept = { id: nextId++, name: body.name, description: body.description };
        conceptos.push(newConcept);
        return sendJSON(res, 201, newConcept);
      }

      // DELETE /api/concepts - Elimina todos los conceptos
      if (req.method === 'DELETE' && pathname === '/api/concepts') {
        conceptos = [];
        return sendJSON(res, 200, { message: 'Todos los conceptos eliminados' });
      }

      // DELETE /api/concepts/:id - Elimina un concepto por id
      if (req.method === 'DELETE' && idMatch) {
        const id = Number(idMatch[1]);
        const idx = conceptos.findIndex(c => c.id === id);
        if (idx === -1) return sendJSON(res, 404, { message: 'No existe este concepto' });
        const deleted = conceptos.splice(idx, 1)[0];
        return sendJSON(res, 200, { message: 'Eliminado', deleted });
      }

      // Ruta no encontrada en la API
      return sendJSON(res, 404, { message: 'Ruta API no encontrada' });

    } catch (err) {
      // Error interno del servidor
      console.error('API ERROR', err);
      return sendJSON(res, 500, { message: 'Error del servidor', error: err.message });
    }
  }

  // Si no es API, sirve archivos estáticos
  serveStatic(req, res);
});

// Inicia el servidor en el puerto indicado
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
