# Core Template

القالب الأساسي المشترك لكل الأنظمة (عيادة، جيم، صيدلية، سنتر تعليمي، مخازن، HR...)
كل نظام جديد = نسخة من هذا التمبلت + موديولات إضافية فوقه. الهيكل والاتفاقيات ثابتة في كل الأنظمة.

## الـ Stack

| الطبقة | التقنية |
|---|---|
| سطح المكتب | Electron 28+ |
| الواجهة | Vite + React 18 |
| التصميم | TailwindCSS (نظام ألوان وخطوط جاهز RTL) |
| القاعدة | SQLite (better-sqlite3) — محلي بالكامل |
| الخطوط | مستضافة محليًا (@fontsource) — صفر اتصال إنترنت |
| الترخيص | HMAC offline licensing + قفل اختياري على الجهاز |
| المستخدمون | Auth جاهز (bcrypt) + صفحة إدارة مستخدمين كاملة |

التطبيق **أوفلاين بالكامل**: مفيش أي API خارجي، مفيش Google Fonts CDN، كل حاجة جوه الباندل.

---

## التشغيل أول مرة

```bash
npm install
npm run dev
```

هيفتح نافذة Electron على Vite dev server مع Hot Reload.

بيانات الدخول الافتراضية: **admin / admin123** (هيطلب تغييرها أول مرة).

## البناء لتوزيع على عميل

```bash
npm run build:win     # نسخة ويندوز (NSIS installer)
npm run build:linux   # نسخة لينكس (AppImage)
```

الناتج في `dist/`. الـ GitHub Actions في `.github/workflows/build.yml` بيعمل نفس الحاجة تلقائيًا عند كل push على main أو أي تاج بيبدأ بـ `v`.

---

## هيكل المشروع

```
electron/                  ← العملية الرئيسية (Main process) — كل حاجة ليها صلاحية كاملة على النظام
  main.js                  ← إنشاء النافذة + تسجيل كل IPC
  preload.js               ← الجسر الآمن الوحيد بين main والواجهة (contextBridge)
  db.js                    ← تهيئة SQLite + المايجريشن + الـ seed الافتراضي
  licensing.js              ← توليد/تحقق مفاتيح الترخيص (أوفلاين، HMAC)
  product.config.js        ← PRODUCT_CODE — القيمة الوحيدة اللي تتغيّر لكل نظام
  ipc/
    auth.js                ← تسجيل الدخول + تغيير كلمة المرور
    users.js                ← CRUD المستخدمين (نموذج لأي موديول جديد)
    license.js              ← حالة الترخيص + التفعيل

scripts/
  keygen.js                 ← أداتك إنت (البائع) لتوليد مفتاح ترخيص لعميل جديد

src/                        ← الواجهة (Renderer) — React، مفيش أي صلاحية نظام مباشرة
  index.css                 ← التوكنز (ألوان/خطوط) + استيراد الخطوط المحلية
  App.jsx                   ← بوابة الترخيص → بوابة تسجيل الدخول → الراوتس
  store/auth.js              ← Zustand: حالة تسجيل الدخول
  lib/ipc.js                 ← نقطة الاتصال الوحيدة بـ main عبر window.api.invoke
  lib/format.js               ← تنسيق أرقام/تواريخ (أرقام لاتينية دايمًا — توقيع التصميم)
  components/ui/              ← مكوّنات عامة: Button, Input, Card, Badge, Modal, StatCard
  components/layout/           ← Sidebar, Topbar, AppLayout
  pages/                       ← Login, Activation, Dashboard, Users, Settings

build/                      ← أيقونات التطبيق (icon.ico / icon.png / icon.icns)
```

---

## إزاي تبني نظام جديد فوق التمبلت (مثال: الجيم)

1. **اعمل كوبي من المجلد ده** باسم جديد (مش نقل، نسخ — التمبلت لازم يفضل نضيف لأي نظام بعده).
2. **غيّر هوية النظام:**
   - `electron/product.config.js` → غيّر `PRODUCT_CODE` لـ `'gym'`.
   - `index.html` → `<html lang="ar" dir="rtl" data-brand="gym">` (الألوان متعرّفة بالفعل في `index.css`، تقدر تضيف نظام جديد بنفس الطريقة).
   - `package.json` → `name`, `productName`, `build.appId`.
3. **أضف الموديولات المطلوبة** (مثلاً HR + Billing + Members):
   - كل موديول = ملف IPC جديد في `electron/ipc/<module>.js` بنفس نمط `users.js` (التحقق من الصلاحية، الاستعلامات، الرجوع بـ `{ ok, ... }`).
   - سجّل الموديول في `electron/main.js` (`registerXxxIpc()`).
   - أضف جدول/جداول الموديول في `electron/db.js` داخل `migrate()`.
   - أضف صفحاته في `src/pages/` ولينك في `src/components/layout/Sidebar.jsx`.
4. **التصميم:** كل المكوّنات في `components/ui/` جاهزة وعامة، استخدمها زي ما هي عشان الشكل يفضل واحد في كل الأنظمة.

النمط ده هو اللي بيخلي الموديولات (Auth, HR, Billing, Inventory...) قابلة للنقل بسهولة بين أي نظام مبني على التمبلت.

---

## نظام الترخيص — إزاي تبيع نسخة لعميل

الترخيص أوفلاين بالكامل، مفيش سيرفر ومفيش إنترنت مطلوب عند العميل.

1. **مفتاح بدون قفل جهاز** (هيتقفل تلقائيًا على أول جهاز يفعّله):
   ```bash
   node scripts/keygen.js --client "عيادة النور" --days 365
   ```
2. **مفتاح مقفول من الأول على جهاز معيّن** (اطلب من العميل كود الجهاز من شاشة "تفعيل الترخيص"):
   ```bash
   node scripts/keygen.js --client "عيادة النور" --days 365 --machine ABCD1234
   ```
3. **ترخيص دائم** (بدون انتهاء): امسح `--days` أو خليها `0`.

⚠️ **مهم قبل ما تشحن أي نظام لعميل:** غيّر قيمة `SECRET` في `electron/licensing.js` لكل نظام (منتج مختلف = سر مختلف)، عشان مفيش حد يقدر يولّد مفاتيح بنفسه.

---

## ملاحظات أمان

- `contextIsolation: true` و `nodeIntegration: false` و `sandbox: true` — الواجهة معندها صلاحية وصول مباشر للنظام، كل حاجة تعدّي عبر `ipcMain.handle` بس.
- كلمات المرور متخزنة بـ bcrypt، مفيش نص صريح.
- صلاحيات المستخدمين (admin/staff) بتتفحّص في الـ main process نفسه، مش بس في الواجهة.
