VISION MEDIA — تطوير البصمة والموقع والحضور والأقسام المنفصلة

تمت الإضافات التالية:

1) صفحة المستخدم/الموظف
- ويدجت حضور وانصراف جديد بالبصمة / Face ID عند دعم الجهاز.
- تسجيل حضور وانصراف مع GPS.
- حفظ حالة الدوام، آخر حضور، آخر انصراف، ساعات اليوم.
- حفظ طريقة التحقق: WebAuthn/Passkeys أو PIN احتياطي.
- حفظ الموقع الأساسي أول مرة، وأي تغيير لاحق يتحول إلى طلب موافقة للأدمن.

2) WebAuthn / Passkeys
- لا يتم حفظ صورة البصمة نهائيًا.
- يتم حفظ credentialId فقط داخل biometricCredentials.
- التفعيل الحقيقي يحتاج HTTPS أو localhost، لذلك سيعمل بعد رفع الموقع على Netlify.
- التحقق النهائي الآمن 100% يحتاج Firebase Functions أو Backend لتوليد Challenge والتحقق منه من السيرفر.

3) GPS والموقع
- حفظ موقع الموظف الأساسي.
- منع الحضور خارج نطاق الدوام حسب إعدادات الأدمن.
- طلب تغيير الموقع يظهر داخل طلبات إعادة التفعيل.

4) لوحة الأدمن
تمت إضافة أقسام داخل لوحة الأدمن:
- إدارة البصمة
- إعدادات الموقع الجغرافي
- طلبات إعادة التفعيل
- خريطة الموظفين

5) صفحات إدارية منفصلة
تم إنشاء صفحات مستقلة:
- admin-employees.html
- admin-attendance.html
- admin-locations.html
- admin-permissions.html

6) الخريطة
- تم استخدام Leaflet + OpenStreetMap.
- عرض موقع الشركة والفروع.
- عرض نطاق الحضور.
- عرض مواقع الموظفين ونقاط الحضور.

7) Collections المستخدمة في localStorage / جاهزة للربط مع Firebase
- users
- employees
- attendance
- biometricCredentials
- employeeLocations
- locationChangeRequests / reactivationRequests
- permissions
- notifications
- activityLogs
- branches

مهم جدًا:
هذه النسخة تضيف منطق واجهة متقدم وتخزين محلي يعمل داخل المتصفح. للتحويل إلى إنتاج حقيقي بالكامل يجب ربط نفس المفاتيح والعمليات بـ Firestore وFirebase Functions، خصوصًا WebAuthn وFCM.
