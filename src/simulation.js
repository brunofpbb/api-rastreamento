function stableHash(value) {
  let h = 2166136261;
  for (const ch of String(value)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function interpolate(a, b, t) {
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * t,
    longitude: a.longitude + (b.longitude - a.longitude) * t
  };
}

function pointAtDistance(route, distanceMeters) {
  const total = route.totalMeters;
  if (!total || route.points.length < 2) return route.points[0];

  const d = Math.max(0, Math.min(total, distanceMeters));
  let lo = 0;
  let hi = route.cumulative.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (route.cumulative[mid] < d) lo = mid + 1;
    else hi = mid;
  }

  const idx = Math.max(1, lo);
  const d0 = route.cumulative[idx - 1];
  const d1 = route.cumulative[idx];
  const span = d1 - d0;
  const t = span > 0 ? (d - d0) / span : 0;
  return interpolate(route.points[idx - 1], route.points[idx], t);
}

function routeDistanceAtTime(route, vehicleId, epochSeconds, baseMetersPerSecond) {
  const hash = stableHash(vehicleId);
  const speedFactor = 0.82 + (hash % 37) / 100; // 0.82 a 1.18
  const metersPerSecond = baseMetersPerSecond * speedFactor;
  const cycle = route.totalMeters * 2;
  if (!cycle) return { distance: 0, metersPerSecond: 0, direction: 1 };

  const offset = (hash % 10000) / 10000 * cycle;
  const raw = (epochSeconds * metersPerSecond + offset) % cycle;
  const outbound = raw <= route.totalMeters;
  const distance = outbound ? raw : cycle - raw;
  return { distance, metersPerSecond, direction: outbound ? 1 : -1 };
}

function simulatedSpeedKmh(vehicleId, epochSeconds, baseKmh) {
  const hash = stableHash(vehicleId);
  const phase = ((epochSeconds / 18) + (hash % 360)) * Math.PI / 180;
  let speed = baseKmh * (0.72 + 0.28 * (0.5 + 0.5 * Math.sin(phase)));

  // Paradas curtas e determinísticas para permitir testar VELOCIDADE=0.
  const stopWindow = (Math.floor(epochSeconds / 20) + (hash % 23)) % 29;
  if (stopWindow === 0) speed = 0;

  return Number(speed.toFixed(2));
}

function formatDataHora(date, timeZone = 'America/Sao_Paulo') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: '2-digit', day: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return `${get('month')}-${get('day')}-${get('year')} ${get('hour')}:${get('minute')}:${get('second')}`;
}

function createFleet(routes, vehicleIds) {
  if (!routes.length) return [];
  return vehicleIds.map((id, index) => ({
    id,
    route: routes[index % routes.length]
  }));
}

function snapshotVehicle(vehicle, now, config) {
  // Trava o relógio em blocos para simular snapshots de GPS periódicos.
  const seconds = Math.floor(now.getTime() / 1000 / config.snapshotSeconds) * config.snapshotSeconds;
  const sampledAt = new Date(seconds * 1000);
  const motion = routeDistanceAtTime(vehicle.route, vehicle.id, seconds, config.baseMetersPerSecond);
  const point = pointAtDistance(vehicle.route, motion.distance);
  const speed = simulatedSpeedKmh(vehicle.id, seconds, motion.metersPerSecond * 3.6);

  return {
    dataHora: formatDataHora(sampledAt, config.timezone),
    ordem: vehicle.id,
    linha: vehicle.route.code,
    latitude: Number(point.latitude.toFixed(6)),
    longitude: Number(point.longitude.toFixed(6)),
    velocidade: speed
  };
}

module.exports = { createFleet, snapshotVehicle, pointAtDistance, stableHash, formatDataHora };
