import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('project and CLI use the ui-refiner identity', async () => {
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.name, 'ui-refiner');
  assert.equal(pkg.version, '0.4.0');
  assert.equal(pkg.bin['ui-refiner'], './bin/ui-refiner.mjs');
  await access(path.join(root, 'skills/ui-refiner-agent/SKILL.md'));
  const cli = spawnSync(process.execPath, [path.join(root, 'bin/ui-refiner.mjs'), '--help'], {encoding:'utf8'});
  assert.equal(cli.status, 0, cli.stderr);
  assert.match(cli.stdout, /UI Refiner 0\.4\.0/);
  assert.match(cli.stdout, /ui-refiner\.config\.json/);
});

test('ui-refiner CLI initializes a web project under its new config name', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'ui-refiner-name-'));
  try {
    const cli = spawnSync(process.execPath, [path.join(root, 'bin/ui-refiner.mjs'), 'init', '--dir', dir], {encoding:'utf8'});
    assert.equal(cli.status, 0, cli.stderr);
    assert.match(cli.stdout, /Created ui-refiner\.config\.json/);
    const config = JSON.parse(await readFile(path.join(dir, 'ui-refiner.config.json'), 'utf8'));
    assert.equal(config.reportDir, 'artifacts/ui-refiner');
    assert.equal(config.preset, 'web');
  } finally {
    await rm(dir, {recursive:true, force:true});
  }
});
