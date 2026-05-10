# VISION MEDIA Auto Social Publisher

منصة عربية RTL لإدارة وجدولة ونشر محتوى السوشيال ميديا عبر OAuth 2.0 وواجهات APIs الرسمية فقط.

## ماذا يفعل المشروع؟

- تسجيل دخول أدمن عبر Firebase Auth.
- ربط Facebook Pages وInstagram Business عبر Meta OAuth.
- ربط YouTube عبر Google OAuth.
- رفع الصور والفيديوهات إلى Firebase Storage.
- إنشاء وجدولة منشورات يومية.
- Scheduler يفحص كل دقيقة المنشورات المستحقة وينشرها تلقائيًا.
- تقارير نجاح وفشل مع سبب الخطأ.
- حماية Tokens بالتشفير داخل Firestore.
- TikTok و X جاهزين كمرحلة لاحقة بعد موافقات API.

## البنية

- `apps/web`: React + Vite.
- `apps/api`: Node.js + Express.
- `Firebase Auth`: دخول الأدمن.
- `Firestore`: الحسابات، المنشورات، السجلات.
- `Firebase Storage`: مكتبة الصور والفيديوهات.

## التشغيل المحلي

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
npm install
npm run dev
```

## الرفع

راجع ملف:

`DEPLOY-AR.md`

## ملاحظات أمان

- لا يتم حفظ كلمات مرور منصات السوشيال.
- الربط يتم عبر OAuth رسمي.
- استخدم `ADMIN_EMAILS` لتحديد إيميلات الأدمن المسموح لها.
- استخدم `TOKEN_ENCRYPTION_KEY` قوي بطول 32 بايت.
