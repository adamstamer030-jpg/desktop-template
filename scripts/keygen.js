#!/usr/bin/env node
import { generateLicenseKey } from '../electron/licensing.js';
import { PRODUCT_CODE } from '../electron/product.config.js';

// مثال استخدام:
//   node scripts/keygen.js --client "عيادة النور" --days 365
//   node scripts/keygen.js --client "جيم الأبطال" --product gym --days 365 --machine AB12CD34
//   node scripts/keygen.js --client "نسخة دائمة" --days 0   (0 أو بدون --days = ترخيص دائم)

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : 'true';
      out[key] = value;
      i += 1;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

if (!args.client) {
  console.log(`
استخدام السكريبت:
  node scripts/keygen.js --client "اسم العميل" [--product ${PRODUCT_CODE}] [--days 365] [--machine <machine-id>]

ملاحظات:
  --days 0 أو بدون --days  => ترخيص دائم (بدون انتهاء)
  --machine                => اختياري، لو عايز تقفل المفتاح على جهاز العميل بعينه
                              (اطلب من العميل كود الجهاز من شاشة "تفعيل الترخيص" في التطبيق)
`);
  process.exit(1);
}

const days = args.days ? Number(args.days) : 0;

const key = generateLicenseKey({
  client: args.client,
  product: args.product || PRODUCT_CODE,
  days: days > 0 ? days : null,
  machineId: args.machine || '',
});

console.log('\n=== مفتاح الترخيص ===\n');
console.log(key);
console.log('\nالعميل      :', args.client);
console.log('المنتج      :', args.product || PRODUCT_CODE);
console.log('المدة       :', days > 0 ? `${days} يوم` : 'دائم');
console.log('مقفول على جهاز:', args.machine || 'لا، أي جهاز (هيتقفل تلقائيًا على أول جهاز يفعّله)');
console.log('');
