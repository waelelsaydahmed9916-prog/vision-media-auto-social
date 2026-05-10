# VISION MEDIA Auto Social Publisher

تطبيق إدارة عربي RTL باللون الأسود والذهبي لجدولة ونشر محتوى السوشيال ميديا عبر OAuth 2.0 وواجهات APIs الرسمية فقط.

## البنية

- `apps/web`: واجهة React + Vite + Firebase Auth.
- `apps/api`: خادم Node.js Express.
- Firestore: الحسابات المربوطة، المنشورات، السجلات.
- Firebase Storage: مكتبة الصور والفيديوهات.
- Scheduler: `node-cron` يفحص كل دقيقة المنشورات بحالة `scheduled` المستحقة.

## التشغيل المحلي

1. انسخ ملفات البيئة:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

2. ضع مفاتيح Firebase وOAuth الرسمية.
3. ثبّت الحزم وشغّل المشروع:

```bash
npm install
npm run dev
```

الواجهة تعمل عادة على `http://localhost:5173` والخادم على `http://localhost:4000`.

## ملاحظات مهمة

- لا يتم حفظ كلمات مرور منصات السوشيال.
- الربط يتم عبر OAuth 2.0.
- تسجيل دخول الأدمن يتم عبر Firebase Auth، وExpress يتحقق من Firebase ID Token.
- رموز الوصول والتحديث تحفظ في Firestore بعد تشفيرها بـ `TOKEN_ENCRYPTION_KEY`.
- النشر يتم عبر APIs الرسمية فقط: Meta Graph API وYouTube Data API، وملفات TikTok/X جاهزة كمواضع توسعة لاحقة.

## متغيرات البيئة المطلوبة

الخادم `apps/api/.env`:

```bash
META_APP_ID=
META_APP_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
X_CLIENT_ID=
X_CLIENT_SECRET=
FIREBASE_CONFIG=
FIREBASE_STORAGE_BUCKET=
APP_BASE_URL=http://localhost:5173
TOKEN_ENCRYPTION_KEY=
```

الواجهة `apps/web/.env`:

```bash
VITE_API_BASE_URL=http://localhost:4000/api
VITE_FIREBASE_CONFIG=
```

## نماذج Firestore

- `socialAccounts`: المنصة، معرف الحساب الخارجي، الاسم، حالة الربط، التوكنات المشفرة.
- `media`: اسم الملف، نوعه، رابط القراءة، مسار Storage.
- `posts`: النص، الهاشتاقات، الملف، المنصات، `scheduledAt`، الحالة `draft | scheduled | published | failed`.
- `publishLogs`: نتيجة كل محاولة نشر وسبب الفشل عند وجوده.
