const path = require('path');

module.exports = {
  port: Number(process.env.PORT || 3000),
  routesDir: process.env.ROUTES_DIR || path.join(__dirname, '..', 'routes'),
  timezone: process.env.TZ || 'America/Sao_Paulo',
  auth: {
    enabled: String(process.env.AUTH_ENABLED || 'true').toLowerCase() !== 'false',
    username: process.env.WSSEC_USERNAME || 'rastreamento',
    password: process.env.WSSEC_PASSWORD || 'troque-no-railway'
  },
  // Metros por segundo usados para avançar o veículo ao longo do trajeto.
  // 8.33 m/s ~= 30 km/h.
  baseMetersPerSecond: Number(process.env.BASE_METERS_PER_SECOND || 8.33),
  // Atualização lógica do snapshot. Não há estado em memória: a posição é derivada do relógio.
  snapshotSeconds: Math.max(1, Number(process.env.SNAPSHOT_SECONDS || 5)),
  // Quantidade de veículos distribuídos entre as linhas com KML.
  vehicles: [
    '20200','20210','20220','20230','20240','20250','20260','20270','20280','20290',
    '2030.','2040.','2050.','210','215','2350','2355','2360','2365','2370','25100','25110','25120'
  ]
};
