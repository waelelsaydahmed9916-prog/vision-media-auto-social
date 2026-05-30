// VISION MEDIA - Emergency Fixes v2
// Fixes: admin login, hidden triple-click logo, native browser notification permission, Firebase FCM token save, safe buttons.
(function(){
  'use strict';

  var ADMIN_USER = 'admin';
  var ADMIN_PASS = '0543944248';
  var ADMIN_SESSION_KEY = 'vm_admin_session';
  var CURRENT_USER_KEY = 'vm_currentUser';
  var NOTIFY_KEY = 'vm_notificationDecision';
  // ملاحظة: لازم تضيف Web Push certificate key من Firebase Cloud Messaging هنا حتى يتم حفظ FCM token فعليًا.
  var VAPID_KEY = 'ضع_هنا_Web_Push_certificate_key_pair_من_Firebase_Cloud_Messaging';

  function qs(sel, root){ return (root||document).querySelector(sel); }
  function qsa(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }
  function readJSON(key, fallback){ try{ var v=localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }catch(e){ return fallback; } }
  function writeJSON(key, val){ try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){} }
  function now(){ return Date.now(); }
  function isAdminSession(){
    var s = readJSON(ADMIN_SESSION_KEY, null);
    var u = readJSON(CURRENT_USER_KEY, null);
    if(s && s.role === 'admin') return true;
    if(u && (u.role === 'admin' || String(u.email||'').toLowerCase() === 'admin@visionmedia.local')) return true;
    return false;
  }
  function setAdminSession(){
    writeJSON(ADMIN_SESSION_KEY, { username: ADMIN_USER, role: 'admin', loggedAt: new Date().toISOString(), time: now() });
    writeJSON(CURRENT_USER_KEY, { name: 'المدير العام', username: ADMIN_USER, email: 'admin@visionmedia.local', role: 'admin' });
  }
  function toast(msg, type){
    if(window.VM && typeof VM.notify === 'function') { VM.notify(msg, type || 'info'); return; }
    var t=document.createElement('div');
    t.textContent=msg;
    t.style.cssText='position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:2147483647;background:'+(type==='error'?'#b91c1c':'#07111e')+';color:#fff;padding:13px 18px;border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.25);font-family:Tahoma,Arial;direction:rtl;font-weight:700';
    document.body.appendChild(t); setTimeout(function(){t.remove();},2800);
  }

  function fixAdminLogin(){
    if(!/admin\.html(?:$|\?)/.test(location.pathname) && !/\/admin\/?$/.test(location.pathname)) return;
    var form = qs('#f');
    var u = qs('#u');
    var p = qs('#pw');
    var err = qs('#err');
    if(!form || !u || !p) return;
    form.setAttribute('novalidate','novalidate');
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var user = String(u.value||'').trim();
      var pass = String(p.value||'').trim();
      if(user === ADMIN_USER && pass === ADMIN_PASS){
        setAdminSession();
        location.href = 'admin-dashboard.html';
      } else {
        if(err){ err.style.display='block'; err.textContent='بيانات الأدمن غير صحيحة. اكتب admin و 0543944248'; }
        toast('بيانات الأدمن غير صحيحة', 'error');
      }
    }, true);
  }

  function protectAdminDashboard(){
    if(!/admin-dashboard\.html/.test(location.pathname)) return;
    if(!isAdminSession()) location.replace('admin.html');
  }

  function addTripleClickAdmin(){
    var targets = qsa('.nav-logo, .footer-logo, .logo, [class*="logo"], a[href="index.html"]');
    if(!targets.length) return;
    targets.forEach(function(el){
      var clicks = 0, timer = null;
      el.style.cursor = el.style.cursor || 'pointer';
      el.addEventListener('click', function(ev){
        clicks += 1;
        clearTimeout(timer);
        timer = setTimeout(function(){ clicks = 0; }, 900);
        if(clicks >= 3){
          ev.preventDefault(); ev.stopPropagation();
          clicks = 0;
          location.href = 'admin.html';
        }
      }, true);
    });
  }

  async function firebaseReady(){
    try{
      if(window.VMFirebaseReady) return await window.VMFirebaseReady;
      if(window.firebase && firebase.apps && firebase.apps.length){
        return { online:true, db: firebase.firestore && firebase.firestore(), messaging: firebase.messaging && firebase.messaging() };
      }
    }catch(e){}
    return { online:false };
  }

  async function registerMessagingToken(){
    try{
      if(!('Notification' in window) || Notification.permission !== 'granted') return false;
      if(VAPID_KEY.indexOf('ضع_هنا') !== -1) return false;
      var fb = await firebaseReady();
      if(!fb || !fb.online || !window.firebase || !firebase.messaging) return false;
      if('serviceWorker' in navigator){ await navigator.serviceWorker.register('/firebase-messaging-sw.js'); }
      var messaging = firebase.messaging();
      var token = await messaging.getToken({ vapidKey: VAPID_KEY });
      if(token){
        writeJSON('vm_fcmToken', token);
        if(fb.db){ await fb.db.collection('fcmTokens').doc(token).set({ token:token, userAgent:navigator.userAgent, createdAt:new Date().toISOString(), page:location.pathname }, { merge:true }); }
        return true;
      }
    }catch(e){ console.warn('FCM token not ready:', e); }
    return false;
  }

  async function askNativeNotificationPermission(){
    if(!('Notification' in window)){ toast('المتصفح لا يدعم الإشعارات', 'error'); return; }
    try{
      var result = await Notification.requestPermission(); // هذا هو إشعار المتصفح الأصلي مثل جوجل/كروم
      writeJSON(NOTIFY_KEY, { status: result, at: new Date().toISOString() });
      if(result === 'granted'){
        await registerMessagingToken();
        toast('تم تفعيل الإشعارات بنجاح', 'success');
      } else if(result === 'denied') {
        toast('تم رفض الإشعارات من المتصفح', 'error');
      } else {
        toast('تم تأجيل تفعيل الإشعارات', 'info');
      }
    }catch(e){ toast('اضغط الزر مرة أخرى لتفعيل إشعار المتصفح', 'error'); }
  }

  function notificationBar(){
    if(!('Notification' in window)) return;
    var decided = readJSON(NOTIFY_KEY, null);
    if(decided || Notification.permission === 'granted' || Notification.permission === 'denied') return;
    var box = document.createElement('div');
    box.className = 'vm-native-notification-box';
    box.innerHTML = '<div class="vm-native-notification-icon">🔔</div><div class="vm-native-notification-text"><b>تفعيل إشعارات VISION MEDIA</b><span>اضغط سماح، وبعدها سيظهر طلب المتصفح الأصلي للإشعارات.</span></div><button type="button" class="vm-native-allow">سماح</button><button type="button" class="vm-native-close">×</button>';
    document.body.appendChild(box);
    qs('.vm-native-allow', box).addEventListener('click', askNativeNotificationPermission);
    qs('.vm-native-close', box).addEventListener('click', function(){ writeJSON(NOTIFY_KEY, { status:'later', at:new Date().toISOString() }); box.remove(); });
  }

  function addNotificationButtons(){
    qsa('a,button').forEach(function(el){
      var txt = (el.textContent || '').trim();
      var title = (el.getAttribute('title') || '').trim();
      if(txt.indexOf('إشعار') !== -1 || title.indexOf('إشعار') !== -1 || el.classList.contains('notification-btn')){
        el.addEventListener('click', function(e){ e.preventDefault(); askNativeNotificationPermission(); }, true);
      }
    });
  }

  function fixLoginRequiredButtons(){
    qsa('[data-require-login], .require-login').forEach(function(el){
      if(el.dataset.vmFixedLogin) return; el.dataset.vmFixedLogin='1';
      el.addEventListener('click', function(e){
        var u = readJSON(CURRENT_USER_KEY, null);
        if(!u){ e.preventDefault(); location.href='login.html?next='+encodeURIComponent(location.pathname + location.search); }
      }, true);
    });
  }

  function exposeHelpers(){
    window.VMUpgrade = window.VMUpgrade || {};
    window.VMUpgrade.askNotifications = askNativeNotificationPermission;
    window.VMUpgrade.registerMessagingToken = registerMessagingToken;
    window.VMUpgrade.isAdminSession = isAdminSession;
    window.VMUpgrade.setAdminSession = setAdminSession;
  }

  document.addEventListener('DOMContentLoaded', function(){
    exposeHelpers();
    fixAdminLogin();
    protectAdminDashboard();
    addTripleClickAdmin();
    // تم تعطيل نافذة الإشعارات المخصصة حتى يظهر طلب المتصفح الأصلي فقط مرة واحدة.
    addNotificationButtons();
    fixLoginRequiredButtons();
    registerMessagingToken();
  });
})();
