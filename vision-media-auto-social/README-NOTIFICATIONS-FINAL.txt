VISION MEDIA - النسخة النهائية للإشعارات

تم تعديل نظام إشعارات صفحة العميل/الزائر كالتالي:

1) تم إلغاء نافذة الإشعارات المخصصة داخل الصفحة.
2) يظهر طلب المتصفح الأصلي Google/Chrome للسماح بالإشعارات مرة واحدة فقط بعد أول تفاعل من الزائر.
3) بعد السماح، يتم حفظ حالة السماح في localStorage لكل الموقع.
4) يتم تسجيل Service Worker: firebase-messaging-sw.js.
5) عند إضافة VAPID Key من Firebase سيتم حفظ FCM token الحقيقي في Firestore داخل collection باسم notificationTokens.

طريقة الربط النهائي مع Firebase Cloud Messaging:
- افتح Firebase Console.
- Project Settings > Cloud Messaging.
- Web Push certificates.
- انسخ Key pair.
- افتح core.js.
- ضع المفتاح في:
  window.VISION_MEDIA_VAPID_KEY = 'ضع المفتاح هنا';

ملاحظات مهمة:
- يجب رفع الموقع على HTTPS مثل Netlify حتى تعمل إشعارات المتصفح وService Worker.
- المتصفح لا يسمح بطلب الإشعارات إلا بعد تفاعل المستخدم، لذلك الطلب يظهر بعد أول ضغط/لمس/تمرير داخل الموقع.
- السماح يكون للموقع بالكامل وليس لكل صفحة منفصلة.
