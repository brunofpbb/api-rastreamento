const http = require('http');
const config = require('./config');
const { routes, fleet, getPayload } = require('./api');
const { authenticate } = require('./auth');

const server = http.createServer((req, res) => {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8', Allow: 'GET' });
    res.end(JSON.stringify({ error: 'method_not_allowed' }));
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const isPublic = url.pathname === '/' || url.pathname === '/health';

  if (!isPublic) {
    const auth = authenticate(req);
    if (!auth.ok) {
      res.writeHead(401, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ error: 'unauthorized', message: 'Usuario e senha obrigatorios em cada chamada.' }));
      return;
    }
  }

  const result = getPayload(url.pathname);
  res.writeHead(result.statusCode, {
    'Content-Type': result.contentType,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(result.raw ? result.body : JSON.stringify(result.body));
});

server.listen(config.port, '0.0.0.0', () => {
  console.log(`[mock-rastreamento-api] porta=${config.port} rotas=${routes.length} veiculos=${fleet.length} auth=${config.auth.enabled ? 'on' : 'off'}`);
});
