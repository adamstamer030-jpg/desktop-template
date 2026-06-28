import { ipcMain } from 'electron';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { machineIdSync } = require('node-machine-id');
import { verifyLicenseKey } from '../licensing.js';
import { meta } from '../db.js';
import { PRODUCT_CODE } from '../product.config.js';

function daysLeft(expiresAt) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}

function computeStatus() {
  const key = meta.get('license_key');
  const machineId = machineIdSync();

  if (!key) {
    return { activated: false, reason: 'not_activated', machineId, product: PRODUCT_CODE };
  }

  const result = verifyLicenseKey(key, { product: PRODUCT_CODE, machineId });
  const boundId = meta.get('license_bound_machine_id');

  if (result.valid && boundId && boundId !== machineId) {
    return { activated: false, reason: 'machine_mismatch', machineId, product: PRODUCT_CODE };
  }

  if (!result.valid) {
    return { activated: false, reason: result.reason, machineId, product: PRODUCT_CODE };
  }

  return {
    activated: true,
    machineId,
    product: PRODUCT_CODE,
    client: result.payload.client,
    issuedAt: result.payload.issuedAt,
    expiresAt: result.payload.expiresAt,
    daysLeft: daysLeft(result.payload.expiresAt),
  };
}

export function registerLicenseIpc() {
  ipcMain.handle('license:status', () => computeStatus());

  ipcMain.handle('license:machineId', () => machineIdSync());

  ipcMain.handle('license:activate', (_evt, { key }) => {
    const machineId = machineIdSync();
    const result = verifyLicenseKey(key, { product: PRODUCT_CODE, machineId });
    if (!result.valid) {
      return { ok: false, reason: result.reason };
    }
    meta.set('license_key', key);
    meta.set('license_bound_machine_id', machineId);
    return { ok: true, status: computeStatus() };
  });
}
