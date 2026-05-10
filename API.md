# API Overview

كل مسارات الإدارة تتطلب Firebase ID Token في الهيدر:

```http
Authorization: Bearer <firebase-id-token>
```

## Auth

- `GET /api/auth/me`: بيانات مستخدم Firebase الحالي.

## OAuth Connections

- `GET /api/oauth/providers`: المنصات والحسابات المربوطة.
- `GET /api/oauth/meta/start`: إنشاء رابط OAuth لـ Facebook Pages وInstagram Business.
- `GET /api/oauth/meta/callback`: callback من Meta.
- `GET /api/oauth/youtube/start`: إنشاء رابط OAuth لـ YouTube.
- `GET /api/oauth/youtube/callback`: callback من Google.

## Media

- `GET /api/media`: مكتبة المحتوى.
- `POST /api/media`: رفع صورة أو فيديو إلى Firebase Storage باستخدام `multipart/form-data` ومفتاح `file`.

## Posts

- `GET /api/posts`: كل المنشورات.
- `POST /api/posts`: إنشاء منشور بحالة `draft` أو `scheduled`.
- `GET /api/posts/calendar?start=&end=`: منشورات فترة زمنية.
- `POST /api/posts/run-due`: تشغيل فحص المنشورات المستحقة يدويًا.

## Reports

- `GET /api/reports`: الإجماليات وقائمة المنشورات المنشورة والفاشلة والمجدولة والمسودات.
