const http = require('http');
const config = require('./config');
const { routes, fleet, getPayload } = require('./api');

const server = http.createServer((req, res) => {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8', 'Allow': 'GET' });
    res.end(JSON.stringify({ error: 'method_not_allowed' }));
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const result = getPayload(url.pathname);
  res.writeHead(result.statusCode, {
    'Content-Type': result.contentType,
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(result.raw ? result.body : JSON.stringify(result.body));
});

server.listen(config.port, '0.0.0.0', () => {
  console.log(`[mock-rastreamento-api] porta=${config.port} rotas=${routes.length} veiculos=${fleet.length}`);
});
