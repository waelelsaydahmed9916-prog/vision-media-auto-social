VISION MEDIA - نسخة إصلاح عاجل

تم إصلاح النقاط التالية:
1) دخول الأدمن يعمل من /admin أو admin.html
   username: admin
   password: 0543944248

2) فتح لوحة الأدمن بالضغط 3 مرات على شعار VISION MEDIA في الهيدر أو الفوتر.

3) إصلاح تحويل Netlify: تم وضع /admin قبل /* داخل ملف _redirects.

4) الإشعارات: تم تغييرها لتطلب إذن المتصفح الأصلي Notification.requestPermission بعد الضغط على زر سماح.
   مهم: لكي تعمل إشعارات FCM الحقيقية لازم تدخل Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
   وانسخ Key Pair وضعه داخل ملف vip-upgrade.js بدل:
   ضع_هنا_Web_Push_certificate_key_pair_من_Firebase_Cloud_Messaging

5) تم إضافة core.js و vip-upgrade.js لكل الصفحات حتى لا تتعطل السكربتات.

6) لو صفحة الأدمن كانت لا تفتح بعد الرفع على Netlify، السبب كان ترتيب _redirects وتم إصلاحه.

ملاحظة مهمة:
إشعار المتصفح الأصلي لا يمكن ظهوره تلقائيًا بدون ضغط المستخدم على زر؛ هذه سياسة حماية من Chrome/Safari/المتصفحات. لذلك يظهر شريط صغير ثم عند الضغط على سماح يظهر طلب المتصفح الحقيقي.
