const fs = require('fs');
const path = require('path');

function decodeXml(text) {
  return String(text)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeName(text) {
  return decodeXml(String(text || ''))
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractLineCode(xml, fallback) {
  const number = xml.match(/N[uú]mero\s+([0-9A-Za-z.\-]+)/i);
  if (number) return number[1].trim();
  return fallback;
}

function extractLineName(xml, fallback) {
  const line = xml.match(/Linha:\s*([^<\r\n]+)/i);
  if (line) return normalizeName(line[1]);
  const folderName = xml.match(/<Folder>.*?<name>(.*?)<\/name>/is);
  if (folderName) return normalizeName(folderName[1]);
  return fallback;
}

function extractCoordinates(xml) {
  const match = xml.match(/<LineString>[\s\S]*?<coordinates>([\s\S]*?)<\/coordinates>[\s\S]*?<\/LineString>/i);
  if (!match) return [];

  const points = [];
  for (const token of match[1].trim().split(/\s+/)) {
    const [lonRaw, latRaw] = token.split(',');
    const longitude = Number(lonRaw);
    const latitude = Number(latRaw);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      const prev = points[points.length - 1];
      // Remove apenas duplicatas consecutivas, comuns nos KMLs fornecidos.
      if (!prev || prev.latitude !== latitude || prev.longitude !== longitude) {
        points.push({ latitude, longitude });
      }
    }
  }
  return points;
}

function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function enrichRoute(route) {
  const cumulative = [0];
  let total = 0;
  for (let i = 1; i < route.points.length; i++) {
    total += haversineMeters(route.points[i - 1], route.points[i]);
    cumulative.push(total);
  }
  return { ...route, cumulative, totalMeters: total };
}

function loadRoutes(routesDir) {
  const files = fs.readdirSync(routesDir).filter((f) => f.toLowerCase().endsWith('.kml')).sort();
  const routes = [];
  for (const file of files) {
    const fullPath = path.join(routesDir, file);
    const xml = fs.readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, '');
    const fallback = path.basename(file, path.extname(file));
    const points = extractCoordinates(xml);
    if (points.length < 2) continue;
    routes.push(enrichRoute({
      code: extractLineCode(xml, fallback),
      name: extractLineName(xml, fallback),
      file,
      points
    }));
  }
  return routes;
}

module.exports = { loadRoutes, haversineMeters };
