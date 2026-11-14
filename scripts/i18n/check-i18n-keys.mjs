// Falla si el código de src/app usa una clave que no existe en src/assets/i18n/es.json, o si es.json
// tiene una clave que nada usa (principios 1 y 5 de CLAUDE.md). Una clave usada es cualquier literal
// de cadena cuyo primer segmento es una sección de es.json (`'sales.checkout.finish'`); por eso las
// claves se escriben completas, nunca armadas por concatenación. Los *.spec.ts quedan fuera.
// Uso: node scripts/i18n/check-i18n-keys.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const APP_DIR = join(ROOT, 'src', 'app');
const DICTIONARY = join(ROOT, 'src', 'assets', 'i18n', 'es.json');
// Cada tipo de comilla se busca por separado: en una plantilla, una clave entre comillas simples suele ir
// dentro de un atributo entre comillas dobles (`[title]="'sales.cart.remove' | translate"`).
const STRING_LITERALS = [/'([^'\\\n]*)'/g, /"([^"\\\n]*)"/g, /`([^`$\\]*)`/g];
const KEY_SHAPE = /^[a-z][A-Za-z0-9]*(\.[A-Za-z0-9]+)+$/;

const rel = (path) => relative(ROOT, path).replace(/\\/g, '/');

function flatten(node, prefix = '', keys = new Map()) {
  for (const [name, value] of Object.entries(node)) {
    const key = prefix ? `${prefix}.${name}` : name;
    if (value && typeof value === 'object') flatten(value, key, keys);
    else keys.set(key, value);
  }
  return keys;
}

function listSourceFiles(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) listSourceFiles(path, files);
    else if (name.endsWith('.ts') && !name.endsWith('.spec.ts')) files.push(path);
  }
  return files;
}

function findUsedKeys(files, sections) {
  const used = new Map();
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      const literals = STRING_LITERALS.flatMap((pattern) => [...line.matchAll(pattern)].map((match) => match[1]));
      for (const literal of new Set(literals)) {
        if (!KEY_SHAPE.test(literal) || !sections.has(literal.split('.')[0])) continue;
        if (!used.has(literal)) used.set(literal, []);
        used.get(literal).push(`${rel(file)}:${index + 1}`);
      }
    });
  }
  return used;
}

function check() {
  const dictionary = JSON.parse(readFileSync(DICTIONARY, 'utf8'));
  const keys = flatten(dictionary);
  const sections = new Set(Object.keys(dictionary));
  const used = findUsedKeys(listSourceFiles(APP_DIR), sections);
  const problems = [];

  for (const [key, value] of keys) {
    if (typeof value !== 'string' || value.trim() === '') problems.push(`clave sin texto: ${key}`);
  }
  for (const [key, places] of used) {
    if (!keys.has(key)) problems.push(`clave faltante en es.json: ${key} (${places.join(', ')})`);
  }
  for (const key of keys.keys()) {
    if (!used.has(key)) problems.push(`clave huérfana (nada la usa): ${key}`);
  }

  if (problems.length > 0) {
    console.error(`[i18n] ${problems.length} problema(s) en ${rel(DICTIONARY)} (principios 1 y 5 de CLAUDE.md):`);
    for (const problem of problems) console.error(`[i18n]   ${problem}`);
    console.error('[i18n] Agrega la clave que falta, quita la que nadie usa y escribe las claves completas en el código.');
    return false;
  }
  console.log(`[i18n] ${keys.size} claves de es.json, todas usadas y ninguna faltante.`);
  return true;
}

process.exit(check() ? 0 : 1);
