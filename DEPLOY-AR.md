# خطوات تشغيل VISION MEDIA Auto Social Publisher

## 1) Firebase
1. افتح Firebase Console.
2. أنشئ مشروع أو استخدم مشروعك الحالي.
3. فعّل Authentication > Email/Password.
4. أنشئ مستخدم أدمن بنفس الإيميل الموجود في `ADMIN_EMAILS`.
5. فعّل Firestore Database.
6. فعّل Storage.
7. من Project Settings > Service accounts أنشئ Private key.
8. انسخ بيانات ملف JSON في متغير `FIREBASE_CONFIG` داخل Render.

## 2) تشغيل API على Render
ارفع المشروع إلى GitHub ثم اربط Render بالريبو.

إعدادات Render:
- Root Directory: `apps/api`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment: Node 20

ضع متغيرات البيئة من:
`apps/api/.env.production.example`

مهم جدًا: أنشئ مفتاح التشفير:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
وانسخه في `TOKEN_ENCRYPTION_KEY`.

## 3) تشغيل الواجهة على Netlify
إعدادات Netlify:
- Base directory: `apps/web`
- Build command: `npm install && npm run build`
- Publish directory: `apps/web/dist` أو `dist` إذا كان Base directory مضبوط على `apps/web`

ضع متغيرات البيئة من:
`apps/web/.env.production.example`

## 4) Meta Facebook + Instagram
في Meta Developers:
1. أنشئ App.
2. أضف Facebook Login أو Business Login حسب لوحة Meta المتاحة.
3. ضع Redirect URI:
`https://YOUR-RENDER-API.onrender.com/api/oauth/meta/callback`
4. ضع App ID و App Secret في Render.
5. الصلاحيات المطلوبة:
- pages_show_list
- pages_read_engagement
- pages_manage_posts
- instagram_basic
- instagram_content_publish
- business_management

ملاحظة: Instagram لازم يكون Business أو Creator ومربوط بصفحة Facebook.

## 5) YouTube
في Google Cloud:
1. أنشئ Project.
2. فعّل YouTube Data API v3.
3. أنشئ OAuth Client ID من نوع Web Application.
4. ضع Redirect URI:
`https://YOUR-RENDER-API.onrender.com/api/oauth/youtube/callback`
5. ضع Client ID و Client Secret في Render.

## 6) أول تجربة نشر
1. سجل دخول الأدمن في الموقع.
2. افتح ربط المنصات.
3. اربط Meta أولًا.
4. ارفع صورة في مكتبة المحتوى.
5. أنشئ بوست واختر Facebook فقط.
6. اجعل وقت النشر بعد دقيقة.
7. انتظر دقيقة وافتح التقارير.

## ملاحظات مهمة
- TikTok و X موجودين كأزرار لاحقًا، وتم منع اختيارهم في إنشاء البوست حتى لا يفشل النشر قبل تفعيل API.
- النشر التلقائي يعمل من Scheduler كل دقيقة داخل API.
- لا تحفظ كلمات مرور منصات السوشيال داخل الموقع نهائيًا.
