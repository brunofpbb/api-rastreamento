const config = require('./config');
const { loadRoutes } = require('./kml');
const { createFleet, snapshotVehicle } = require('./simulation');

const COLUMNS = ['DATAHORA', 'ORDEM', 'LINHA', 'LATITUDE', 'LONGITUDE', 'VELOCIDADE'];
const routes = loadRoutes(config.routesDir);
const fleet = createFleet(routes, config.vehicles);

function toOfficialJson(rows) {
  return {
    COLUMNS,
    DATA: rows.map((v) => [v.dataHora, v.ordem, v.linha, v.latitude, v.longitude, v.velocidade])
  };
}

function snapshots(filterFn = () => true, now = new Date()) {
  return fleet.filter(filterFn).map((vehicle) => snapshotVehicle(vehicle, now, config));
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows) {
  const lines = [COLUMNS.join(',')];
  for (const v of rows) {
    lines.push([v.dataHora, v.ordem, v.linha, v.latitude, v.longitude, v.velocidade].map(csvEscape).join(','));
  }
  return lines.join('\r\n') + '\r\n';
}

function getPayload(pathname) {
  if (pathname === '/') {
    return {
      statusCode: 200,
      contentType: 'application/json; charset=utf-8',
      body: {
        service: 'Mock Rastreamento API',
        contract: 'Web Service - Modelo 3',
        status: 'ok',
        endpoints: [
          '/obterTodasPosicoes',
          '/obterPosicoesDaLinha/:linha',
          '/obterPosicoesDoOnibus/:ordem',
          '/onibus',
          '/onibus/linha/:linha',
          '/onibus/veiculo/:ordem',
          '/csv/onibus',
          '/health'
        ]
      }
    };
  }

  if (pathname === '/health') {
    return {
      statusCode: 200,
      contentType: 'application/json; charset=utf-8',
      body: { status: 'ok', routes: routes.length, vehicles: fleet.length }
    };
  }

  if (pathname === '/obterTodasPosicoes' || pathname === '/onibus') {
    return { statusCode: 200, contentType: 'application/json; charset=utf-8', body: toOfficialJson(snapshots()) };
  }

  let match = pathname.match(/^\/(?:obterPosicoesDaLinha|onibus\/linha)\/([^/]+)$/);
  if (match) {
    const linha = decodeURIComponent(match[1]);
    return {
      statusCode: 200,
      contentType: 'application/json; charset=utf-8',
      body: toOfficialJson(snapshots((v) => String(v.route.code) === linha))
    };
  }

  match = pathname.match(/^\/(?:obterPosicoesDoOnibus|onibus\/veiculo)\/([^/]+)$/);
  if (match) {
    const ordem = decodeURIComponent(match[1]);
    return {
      statusCode: 200,
      contentType: 'application/json; charset=utf-8',
      body: toOfficialJson(snapshots((v) => String(v.id) === ordem))
    };
  }

  if (pathname === '/csv/onibus') {
    return { statusCode: 200, contentType: 'text/csv; charset=utf-8', body: toCsv(snapshots()), raw: true };
  }

  match = pathname.match(/^\/csv\/onibus\/linha\/([^/]+)$/);
  if (match) {
    const linha = decodeURIComponent(match[1]);
    return {
      statusCode: 200,
      contentType: 'text/csv; charset=utf-8',
      body: toCsv(snapshots((v) => String(v.route.code) === linha)),
      raw: true
    };
  }

  match = pathname.match(/^\/csv\/onibus\/veiculo\/([^/]+)$/);
  if (match) {
    const ordem = decodeURIComponent(match[1]);
    return {
      statusCode: 200,
      contentType: 'text/csv; charset=utf-8',
      body: toCsv(snapshots((v) => String(v.id) === ordem)),
      raw: true
    };
  }

  return {
    statusCode: 404,
    contentType: 'application/json; charset=utf-8',
    body: { error: 'not_found', message: 'Endpoint não encontrado' }
  };
}

module.exports = { routes, fleet, COLUMNS, snapshots, toOfficialJson, toCsv, getPayload };
