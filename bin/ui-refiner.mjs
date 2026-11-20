#!/usr/bin/env node
try {
  await import('../src/cli.mjs');
} catch (error) {
  if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error;
  console.error(`UI Refiner: ${error.message}\nRun npm ci in the UI Refiner checkout, then rerun ui-refiner doctor.`);
  process.exitCode = 2;
}
