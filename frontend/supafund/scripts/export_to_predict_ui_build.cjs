#!/usr/bin/env node
'use strict';

/**
 * Export the Supafund Next.js frontend as a static bundle
 * and sync it into the Quickstart service's predict-ui-build directory.
 *
 * Usage:
 *   yarn supafund:export
 */

const { execSync } = require('node:child_process');
const { cpSync, existsSync, mkdirSync, rmSync } = require('node:fs');
const path = require('node:path');

const FRONTEND_ROOT = process.cwd();
const TARGET_DIR = path.resolve(
  FRONTEND_ROOT,
  '../quickstart/supafund-trader/packages/valory/skills/trader_abci/predict-ui-build',
);
const TARGET_PARENT = path.dirname(TARGET_DIR);
const EXPORT_DIR = path.resolve(FRONTEND_ROOT, 'out');

const run = (command) => {
  execSync(command, {
    stdio: 'inherit',
    cwd: FRONTEND_ROOT,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: '1',
    },
  });
};

const log = (message) => {
  // eslint-disable-next-line no-console
  console.log(`[supafund:export] ${message}`);
};

try {
  if (existsSync(EXPORT_DIR)) {
    log('Cleaning previous static output…');
    rmSync(EXPORT_DIR, { recursive: true, force: true });
  }

  log('Running production build…');
  run('yarn run build');
} catch (error) {
  log('Build failed.');
  process.exit(error?.status ?? 1);
}

if (!existsSync(EXPORT_DIR)) {
  log('Expected static output directory "out" was not created.');
  process.exit(1);
}

if (existsSync(TARGET_DIR)) {
  log('Removing previous predict-ui-build directory…');
  rmSync(TARGET_DIR, { recursive: true, force: true });
}

mkdirSync(TARGET_PARENT, { recursive: true });
log('Copying exported assets into predict-ui-build…');
cpSync(EXPORT_DIR, TARGET_DIR, { recursive: true });

log(`Done! Static bundle synced to:\n  ${TARGET_DIR}`);
