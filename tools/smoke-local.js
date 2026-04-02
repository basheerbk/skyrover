#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = process.cwd();
const PORT = Number(process.env.SMOKE_PORT || 5005);
const HOST = process.env.SMOKE_HOST || '127.0.0.1';

function ok(msg) {
  console.log(`OK   ${msg}`);
}
function fail(msg) {
  console.error(`FAIL ${msg}`);
}

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (_) {
    return null;
  }
}

function assertContains(content, needle, label) {
  if (content && content.includes(needle)) {
    ok(label);
    return true;
  }
  fail(label);
  return false;
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => req.destroy(new Error('timeout')));
  });
}

async function main() {
  let failed = false;

  const indexPath = path.join(ROOT, 'index.html');
  const bundlePath = path.join(ROOT, 'dist', 'blockide_bundle.js');
  const islandsPath = path.join(ROOT, 'dist', 'ui_islands.js');
  const uploadStatePath = path.join(ROOT, 'js', 'ui_legacy', 'upload_state_runtime.js');

  const index = readFileSafe(indexPath);
  if (!index) {
    fail('index.html exists');
    process.exit(1);
  } else {
    ok('index.html exists');
  }

  if (fs.existsSync(bundlePath)) ok('dist/blockide_bundle.js exists');
  else {
    fail('dist/blockide_bundle.js exists');
    failed = true;
  }

  if (fs.existsSync(islandsPath)) ok('dist/ui_islands.js exists');
  else {
    fail('dist/ui_islands.js exists');
    failed = true;
  }

  if (fs.existsSync(uploadStatePath)) ok('ui legacy upload state runtime exists');
  else {
    fail('ui legacy upload state runtime exists');
    failed = true;
  }

  if (!assertContains(index, 'js/ui_legacy/upload_state_runtime.js', 'index wires upload state runtime')) failed = true;
  if (!assertContains(index, 'dist/ui_islands.js', 'index wires ui islands bundle')) failed = true;
  if (!assertContains(index, 'css/ui-modern.css', 'index wires ui-modern.css')) failed = true;

  if (!assertContains(index, 'id="load"', 'index has hidden file input for Open project')) failed = true;
  if (!assertContains(index, 'id="menu_10"', 'index FILES menu New (menu_10)')) failed = true;
  if (!assertContains(index, 'id="menu_11"', 'index FILES menu Open (menu_11)')) failed = true;
  if (!assertContains(index, 'id="menu_12"', 'index FILES menu Save as (menu_12)')) failed = true;
  if (!assertContains(index, 'id="menu_131"', 'index FILES Examples modal (menu_131)')) failed = true;

  const electronBtns = readFileSafe(path.join(ROOT, 'core', 'BlocklyArduino', 'blockly@rduino_functions_buttons_Electron.js'));
  if (
    electronBtns
    && electronBtns.includes('document.createElement(\'a\')')
    && electronBtns.includes('setAttribute(\'download\', defaultFilename)')
  ) {
    ok('saveXmlFile web path uses programmatic download <a>');
  } else {
    fail('saveXmlFile web path uses programmatic download <a>');
    failed = true;
  }

  const electronCore = readFileSafe(path.join(ROOT, 'core', 'BlocklyArduino', 'blockly@rduino_core_Electron.js'));
  if (electronCore && electronCore.includes('#menu_132')) {
    ok('Examples link selector uses #menu_132');
  } else {
    fail('Examples link selector uses #menu_132');
    failed = true;
  }

  if (process.env.SMOKE_SKIP_SERVER === '1' || process.env.SMOKE_SKIP_SERVER === 'true') {
    ok('server reachability check skipped (SMOKE_SKIP_SERVER)');
  } else {
    try {
      const res = await httpGet(`http://${HOST}:${PORT}/`);
      if (res.status === 200) ok(`server reachable at http://${HOST}:${PORT}/`);
      else {
        fail(`server reachable at http://${HOST}:${PORT}/ (status ${res.status})`);
        failed = true;
      }
      if (!assertContains(res.body, 'side_btn_upload', 'served HTML contains upload button')) failed = true;
    } catch (e) {
      fail(`server reachable at http://${HOST}:${PORT}/ (${e.message})`);
      failed = true;
    }
  }

  if (failed) {
    console.error('\nSmoke test FAILED');
    process.exit(1);
  }
  console.log('\nSmoke test PASSED');
}

main();

