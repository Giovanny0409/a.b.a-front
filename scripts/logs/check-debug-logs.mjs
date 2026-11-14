// Falla si el código de src/ llama a console.log, console.debug, console.info o console.trace,
// aunque la llamada esté comentada. Los *.spec.ts quedan fuera; console.warn y console.error se permiten.
// Uso: node scripts/logs/check-debug-logs.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC_DIR = join(ROOT, 'src');
const DEBUG_CALL = /\bconsole\s*\.\s*(log|debug|info|trace)\s*\(/;

const rel = (path) => relative(ROOT, path).replace(/\\/g, '/');

function listSourceFiles(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) listSourceFiles(path, files);
    else if (name.endsWith('.ts') && !name.endsWith('.spec.ts')) files.push(path);
  }
  return files;
}

function findDebugLogs(files) {
  const findings = [];
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, index) => {
      if (DEBUG_CALL.test(line)) findings.push(`${rel(file)}:${index + 1}  ${line.trim()}`);
    });
  }
  return findings;
}

function check() {
  const files = listSourceFiles(SRC_DIR);
  const findings = findDebugLogs(files);

  if (findings.length > 0) {
    console.error(`[logs] ${findings.length} log(s) de depuración en src/ (principio 5 de CLAUDE.md: sin logs de depuración, tampoco comentados):`);
    for (const finding of findings) console.error(`[logs]   ${finding}`);
    console.error('[logs] Quítalos, o usa console.warn / console.error si reportan un error.');
    return false;
  }
  console.log(`[logs] ${files.length} archivos .ts de src/ sin logs de depuración.`);
  return true;
}

process.exit(check() ? 0 : 1);
