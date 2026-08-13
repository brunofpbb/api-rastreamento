const test = require('node:test');
const assert = require('node:assert/strict');
const { routes, fleet, COLUMNS, toOfficialJson, getPayload } = require('../src/api');
const { snapshotVehicle } = require('../src/simulation');
const config = require('../src/config');

test('carrega rotas reais dos KMLs', () => {
  assert.equal(routes.length, 12);
  assert.ok(routes.every((r) => r.points.length >= 2));
  assert.ok(routes.every((r) => r.totalMeters > 0));
});

test('distribui todos os prefixos de veiculos', () => {
  assert.equal(fleet.length, config.vehicles.length);
  assert.equal(fleet.length, 23);
});

test('snapshot segue colunas oficiais', () => {
  const row = snapshotVehicle(fleet[0], new Date('2026-08-13T12:00:00Z'), config);
  const result = toOfficialJson([row]);
  assert.deepEqual(result.COLUMNS, COLUMNS);
  assert.equal(result.DATA.length, 1);
  assert.equal(result.DATA[0].length, 6);
  assert.equal(result.DATA[0][1], fleet[0].id);
  assert.equal(result.DATA[0][2], fleet[0].route.code);
  assert.ok(Number.isFinite(result.DATA[0][3]));
  assert.ok(Number.isFinite(result.DATA[0][4]));
  assert.ok(Number.isFinite(result.DATA[0][5]));
});

test('veiculo muda de posicao com o tempo', () => {
  const a = snapshotVehicle(fleet[0], new Date('2026-08-13T12:00:00Z'), config);
  const b = snapshotVehicle(fleet[0], new Date('2026-08-13T12:01:00Z'), config);
  assert.notDeepEqual([a.latitude, a.longitude], [b.latitude, b.longitude]);
});

test('endpoint oficial retorna formato COLUMNS + DATA', () => {
  const result = getPayload('/obterTodasPosicoes');
  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body.COLUMNS, COLUMNS);
  assert.equal(result.body.DATA.length, 23);
});

test('filtro por linha e veiculo funciona', () => {
  const line = fleet[0].route.code;
  const vehicle = fleet[0].id;
  const byLine = getPayload(`/obterPosicoesDaLinha/${encodeURIComponent(line)}`);
  const byVehicle = getPayload(`/obterPosicoesDoOnibus/${encodeURIComponent(vehicle)}`);
  assert.ok(byLine.body.DATA.length >= 1);
  assert.equal(byVehicle.body.DATA.length, 1);
  assert.equal(byVehicle.body.DATA[0][1], vehicle);
});
