VISION MEDIA VIP FULL SYSTEM - نسخة مطورة جاهزة للرفع

تمت إضافة:
- صفحة أدمن مستقلة: /admin أو admin.html
- دخول الأدمن بدون إنشاء حساب:
  USERNAME: admin
  PASSWORD: 0543944248
- حماية دخول لوحة الأدمن على مستوى الواجهة.
- Firebase Web Config داخل core.js و firebase-messaging-sw.js.
- Firebase Auth / Firestore / Storage / Messaging compatibility.
- قواعد Firestore آمنة بدل public rules.
- قواعد Storage آمنة.
- Popup احترافي لطلب الإشعارات.
- Firebase Cloud Messaging FCM مع حفظ Token داخل fcmTokens.
- لوحة CMS إضافية للتحكم في الصفحات والأقسام.
- إدارة الشات و AI داخل الأدمن.
- إدارة التقييمات.
- صفحات السياسات: privacy, terms, refund, usage, payment, data protection, copyright, faq.
- إعدادات Netlify + redirects + security headers.

مهم جدًا قبل التشغيل النهائي للإشعارات:
1) من Firebase Console > Project Settings > Cloud Messaging.
2) أنشئ Web Push certificates.
3) انسخ Key وضعه داخل vip-upgrade.js مكان:
   ضع_هنا_Web_Push_certificate_key_pair_من_Firebase_Cloud_Messaging

مهم جدًا لقواعد الأمان:
- افتح Firebase > Firestore > Rules وانسخ محتوى firestore.rules ثم Publish.
- افتح Firebase > Storage > Rules وانسخ محتوى storage.rules ثم Publish.

ملاحظة مهمة:
الإشعارات الجماعية الحقيقية من الأدمن لكل العملاء تحتاج Cloud Function أو سيرفر صغير لأن إرسال FCM لا يتم آمنًا من المتصفح فقط. النسخة الحالية تحفظ توكنات العملاء وتجهز النظام بالكامل، وبعد إضافة Cloud Function يمكن إرسال الإشعارات الحقيقية مباشرة.

رفع Netlify:
- ارفع مجلد httpswwwnabadvcom كاملًا أو اسحب محتويات المجلد داخل Netlify Deploy.
- تأكد أن netlify.toml موجود في نفس جذر الملفات.
