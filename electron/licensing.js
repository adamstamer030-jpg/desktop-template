import crypto from 'node:crypto';

/**
 * نظام ترخيص أوفلاين بالكامل.
 *
 * المفتاح = base64url(payload JSON) + "." + توقيع HMAC-SHA256
 * التحقق بيتم محليًا تمامًا، مفيش أي اتصال بسيرفر.
 *
 * ⚠️ مهم جدًا قبل ما تبيع أي نظام لعميل:
 * غيّر SECRET ده لكل نظام/منتج (مش نفس السر لكل الأنظمة)،
 * وخزّنه في مكان واحد بس هنا — ده اللي بيمنع أي عميل من تصنيع مفتاح بنفسه.
 */
const SECRET = 'MGDev_2026_OfflineSystems_K7X9P2';

function base64urlEncode(str) {
  return Buffer.from(str, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, 'base64').toString('utf8');
}

function sign(payloadStr) {
  return crypto.createHmac('sha256', SECRET).update(payloadStr).digest('hex').slice(0, 32);
}

/**
 * @param {{client:string, product:string, days:number|null, machineId?:string}} opts
 *   days = null => ترخيص دائم (بدون تاريخ انتهاء)
 * @returns {string} مفتاح الترخيص الكامل
 */
export function generateLicenseKey({ client, product, days, machineId = '' }) {
  const issuedAt = new Date().toISOString();
  const expiresAt = days ? new Date(Date.now() + days * 86400000).toISOString() : null;
  const payload = { client, product, issuedAt, expiresAt, machineId: machineId || '' };
  const payloadStr = JSON.stringify(payload);
  const encoded = base64urlEncode(payloadStr);
  const signature = sign(payloadStr);
  return `${encoded}.${signature}`;
}

/**
 * @param {string} key مفتاح الترخيص
 * @param {{product:string, machineId:string}} ctx بيانات الجهاز/المنتج الحالي للتحقق منها
 * @returns {{valid:boolean, reason?:string, payload?:object}}
 */
export function verifyLicenseKey(key, ctx) {
  if (!key || typeof key !== 'string' || !key.includes('.')) {
    return { valid: false, reason: 'invalid_format' };
  }
  const [encoded, signature] = key.split('.');
  let payloadStr;
  try {
    payloadStr = base64urlDecode(encoded);
  } catch {
    return { valid: false, reason: 'invalid_format' };
  }
  const expectedSig = sign(payloadStr);
  if (signature !== expectedSig) {
    return { valid: false, reason: 'invalid_signature' };
  }
  let payload;
  try {
    payload = JSON.parse(payloadStr);
  } catch {
    return { valid: false, reason: 'invalid_format' };
  }
  if (ctx?.product && payload.product !== ctx.product) {
    return { valid: false, reason: 'wrong_product', payload };
  }
  if (payload.expiresAt && new Date(payload.expiresAt).getTime() < Date.now()) {
    return { valid: false, reason: 'expired', payload };
  }
  if (payload.machineId && ctx?.machineId && payload.machineId !== ctx.machineId) {
    return { valid: false, reason: 'machine_mismatch', payload };
  }
  return { valid: true, payload };
}
