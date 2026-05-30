// ============================================================
// VISION MEDIA - Core Data & Utilities
// ============================================================

// ============================================================
// Firebase Live Backend Integration (Auth / Firestore / Storage)
// ============================================================
const VM_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBMsHTXOeTIOfb7LtWkQJG_389u9lpNBxQ",
  authDomain: "wael-site-2c2df.firebaseapp.com",
  databaseURL: "https://wael-site-2c2df-default-rtdb.firebaseio.com",
  projectId: "wael-site-2c2df",
  storageBucket: "wael-site-2c2df.firebasestorage.app",
  messagingSenderId: "225390136594",
  appId: "1:225390136594:web:a69f801fc2804d6634f7cb",
  measurementId: "G-RXJ4BWFP5N"
};


// Firebase Cloud Messaging Web Push certificate key
// ضع Web Push VAPID Key من Firebase Console > Cloud Messaging هنا عند الربط النهائي.
window.VISION_MEDIA_VAPID_KEY = window.VISION_MEDIA_VAPID_KEY || '';

const VM_ADMIN_EMAILS = [
  'admin@visionmedia.sa',
  'waelelsaydahmed@gmail.com',
  'waelelsaydahmed9916@gmail.com',
  'myway9916@gmail.com'
];

function vmLoadScript(src){
  return new Promise((resolve,reject)=>{
    if(document.querySelector(`script[src="${src}"]`)) return resolve();
    const sc=document.createElement('script');
    sc.src=src; sc.async=false;
    sc.onload=resolve; sc.onerror=()=>reject(new Error('تعذر تحميل Firebase'));
    document.head.appendChild(sc);
  });
}

window.VMFirebaseReady = (async function(){
  try{
    await vmLoadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
    await vmLoadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js');
    await vmLoadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js');
    await vmLoadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-storage-compat.js');
    await vmLoadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');
    await vmLoadScript('https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics-compat.js');
    if(!firebase.apps.length) firebase.initializeApp(VM_FIREBASE_CONFIG);
    try{ firebase.analytics(); }catch(e){}
    window.VMFB = {
      app: firebase.app(),
      auth: firebase.auth(),
      db: firebase.firestore(),
      storage: firebase.storage(),
      messaging: firebase.messaging ? firebase.messaging() : null,
      online: true
    };
    firebase.auth().onAuthStateChanged(async (fbUser)=>{
      if(!fbUser) return;
      const role = VM_ADMIN_EMAILS.includes((fbUser.email||'').toLowerCase()) ? 'admin' : 'client';
      const profile = {
        uid: fbUser.uid,
        name: fbUser.displayName || (fbUser.email||'').split('@')[0],
        email: fbUser.email,
        role,
        lastLoginAt: new Date().toISOString()
      };
      try{
        await VMFB.db.collection('users').doc(fbUser.uid).set(profile,{merge:true});
      }catch(e){}
      try{ localStorage.setItem('vm_currentUser', JSON.stringify(profile)); }catch(e){}
    });
    return window.VMFB;
  }catch(e){
    console.warn('Firebase disabled/fallback localStorage:', e);
    window.VMFB = { online:false };
    return window.VMFB;
  }
})();


const VM = {
  // ---- Config ----
  config: {
    name: 'VISION MEDIA',
    phone: '0543944248',
    callPhone: '0538862064',
    whatsapp: '966543944248',
    email: 'waelelsaydahmed@gmail.com',
    social: {
      instagram: 'https://www.instagram.com/advertisement_portal.46',
      facebook: 'https://www.facebook.com/share/1DszbP1nTB/',
      snapchat: 'https://www.snapchat.com/add/wael_elsayd2026',
      tiktok: 'https://www.tiktok.com/@waelelsayd3',
      youtube: 'https://youtube.com/channel/UCA0-OJ461Na9MkTZMmgM48A',
      twitter: 'https://x.com/Adverti556'
    }
  },

  // ---- Services Data ----
  services: [
    {
      id: 1, slug: 'digital-marketing', icon: 'fas fa-bullhorn',
      name: 'التسويق الإلكتروني',
      desc: 'استراتيجيات تسويقية متكاملة تحقق أهدافك وتوسّع قاعدة عملائك',
      color: '#1a73e8',
      subServices: ['إعلانات سناب شات','إعلانات تيك توك','إعلانات انستجرام','إعلانات جوجل','إدارة حملة كاملة','خطة تسويقية شهرية']
    },
    {
      id: 2, slug: 'social-media', icon: 'fas fa-share-alt',
      name: 'إدارة حسابات السوشيال ميديا',
      desc: 'إدارة احترافية لحساباتك على جميع منصات التواصل الاجتماعي',
      color: '#e1306c',
      subServices: ['إدارة انستجرام','إدارة تيك توك','إدارة سناب شات','إدارة تويتر/X','إدارة يوتيوب','تقارير شهرية']
    },
    {
      id: 3, slug: 'paid-ads', icon: 'fas fa-ad',
      name: 'الإعلانات الممولة',
      desc: 'إعلانات ممولة بكفاءة عالية لتحقيق أقصى عائد على الاستثمار',
      color: '#fbbc04',
      subServices: ['إعلانات فيسبوك','إعلانات انستجرام','إعلانات جوجل','إعلانات يوتيوب','إعلانات سناب شات','إعلانات تيك توك']
    },
    {
      id: 4, slug: 'graphic-design', icon: 'fas fa-palette',
      name: 'تصميم الجرافيك',
      desc: 'تصاميم إبداعية احترافية تعكس هوية علامتك التجارية',
      color: '#9c27b0',
      subServices: ['تصميم شعار','تصميم بوستات','تصميم بنرات','بروفايل شركة PDF','تصميم منيو','تصميم إعلانات']
    },
    {
      id: 5, slug: 'brand-identity', icon: 'fas fa-trademark',
      name: 'تصميم الهوية التجارية',
      desc: 'هوية بصرية متكاملة تميّز علامتك وتترك انطباعاً لا يُنسى',
      color: '#ff6d00',
      subServices: ['تصميم الشعار','الألوان والخطوط','الكارت الشخصي','الظرف والورق الرسمي','الختم والفاتورة','دليل الهوية البصرية']
    },
    {
      id: 6, slug: 'web-design', icon: 'fas fa-laptop-code',
      name: 'تصميم المواقع',
      desc: 'مواقع ويب احترافية وسريعة ومتجاوبة مع جميع الأجهزة',
      color: '#00897b',
      subServices: ['موقع شركات','موقع خدمات','لاندينج بيج','موقع شخصي','موقع مدونة','موقع أخبار']
    },
    {
      id: 7, slug: 'ecommerce', icon: 'fas fa-shopping-cart',
      name: 'المتاجر الإلكترونية',
      desc: 'متاجر إلكترونية متكاملة لبيع منتجاتك وخدماتك عبر الإنترنت',
      color: '#2e7d32',
      subServices: ['متجر شوبيفاي','متجر ووكومرس','متجر مخصص','لوحة إدارة المنتجات','بوابة الدفع','تطبيق موبايل للمتجر']
    },
    {
      id: 8, slug: 'video-production', icon: 'fas fa-film',
      name: 'إنتاج الفيديو',
      desc: 'إنتاج مقاطع فيديو إعلانية واحترافية عالية الجودة',
      color: '#c62828',
      subServices: ['فيديو إعلاني','فيديو تعريفي للشركة','فيديو منتج','فيديو سوشيال ميديا','فيديو تدريبي','فيديو حفلات وفعاليات']
    },
    {
      id: 9, slug: 'motion-graphics', icon: 'fas fa-magic',
      name: 'الموشن جرافيك',
      desc: 'رسوم متحركة احترافية تجذب الانتباه وتوصل رسالتك بوضوح',
      color: '#6a1b9a',
      subServices: ['انيميشن 2D','انيميشن 3D','إنفوجرافيك متحرك','مقدمة فيديو (Intro)','بوستات متحركة','إعلانات موشن']
    },
    {
      id: 10, slug: 'photography', icon: 'fas fa-camera',
      name: 'التصوير الاحترافي',
      desc: 'تصوير احترافي للمنتجات والفعاليات والبورتريه',
      color: '#1565c0',
      subServices: ['تصوير منتجات','تصوير فعاليات','تصوير بورتريه','تصوير مطاعم','تصوير عقارات','تصوير كتالوج']
    },
    {
      id: 11, slug: 'ai-images', icon: 'fas fa-robot',
      name: 'تصميم صور بالذكاء الاصطناعي',
      desc: 'صور إبداعية مذهلة باستخدام أحدث تقنيات الذكاء الاصطناعي',
      color: '#00695c',
      subServices: ['صور منتجات AI','بوستات إعلانية AI','خلفيات احترافية','شخصيات وكاركترات','صور مفاهيمية','مزج الصور وتحريرها']
    },
    {
      id: 12, slug: 'ai-video', icon: 'fas fa-microchip',
      name: 'تصميم فيديو بالذكاء الاصطناعي',
      desc: 'فيديوهات مذهلة بتقنيات الذكاء الاصطناعي المتطورة',
      color: '#bf360c',
      subServices: ['فيديو نص إلى صوت','فيديو صورة إلى حركة','فيديو AI كامل','تحسين جودة فيديو','أفاتار ناطق','فيديو منتج AI']
    },
    {
      id: 13, slug: 'campaign-management', icon: 'fas fa-chart-line',
      name: 'إدارة الحملات الإعلانية',
      desc: 'إدارة متكاملة لحملاتك الإعلانية لضمان أفضل النتائج',
      color: '#f57f17',
      subServices: ['حملة جوجل','حملة ميتا','حملة سناب شات','حملة تيك توك','حملة متعددة المنصات','تقارير وتحليلات']
    },
    {
      id: 14, slug: 'content-writing', icon: 'fas fa-pen-nib',
      name: 'كتابة المحتوى',
      desc: 'محتوى إبداعي ومقنع يجذب جمهورك ويحقق أهدافك التسويقية',
      color: '#33691e',
      subServices: ['كتابة مقالات','كتابة بوستات سوشيال','سكريبت فيديو','محتوى موقع','كتابة إعلانات','ترجمة احترافية']
    },
    {
      id: 15, slug: 'seo', icon: 'fas fa-search',
      name: 'تحسين محركات البحث SEO',
      desc: 'ارتقِ بموقعك إلى أعلى نتائج البحث واكسب ثقة عملائك',
      color: '#1a237e',
      subServices: ['تحليل الكلمات المفتاحية','تحسين داخلي On-Page','بناء الروابط','SEO محلي','تقارير شهرية','تحسين سرعة الموقع']
    }
  ],

  // ---- Storage Helpers ----
  storage: {
    get(key, def = null) {
      try { const v = localStorage.getItem('vm_' + key); return v ? JSON.parse(v) : def; } catch { return def; }
    },
    set(key, val) {
      try { localStorage.setItem('vm_' + key, JSON.stringify(val)); } catch(e) { console.error('Storage error', e); }
      try { window.VMFirebaseReady && window.VMFirebaseReady.then(fb => { if(fb && fb.online){ fb.db.collection('siteData').doc(key).set({ value: val, updatedAt: new Date().toISOString() }, { merge:true }); } }); } catch(e) {}
    },
    push(key, item) {
      const arr = this.get(key, []);
      item.id = item.id || Date.now() + Math.random().toString(36).substr(2,5);
      item.createdAt = item.createdAt || new Date().toISOString();
      arr.push(item);
      this.set(key, arr);
      try { window.VMFirebaseReady && window.VMFirebaseReady.then(fb => { if(fb && fb.online){ fb.db.collection(key).doc(String(item.id)).set(item, { merge:true }); } }); } catch(e) {}
      return item;
    }
  },

  // ---- Visit Tracker ----
  trackVisit() {
    const visit = {
      page: document.title || location.pathname,
      url: location.href,
      time: new Date().toISOString(),
      device: /Mobi|Android/i.test(navigator.userAgent) ? 'موبايل' : 'كمبيوتر',
      referrer: document.referrer || 'مباشر'
    };
    this.storage.push('visits', visit);
  },

  // ---- User Auth ----
  auth: {
    async login(email, pass) {
      email = (email || '').trim().toLowerCase();
      try {
        const fb = await window.VMFirebaseReady;
        if (fb && fb.online) {
          const cred = await fb.auth.signInWithEmailAndPassword(email, pass);
          const fbUser = cred.user;
          const role = VM_ADMIN_EMAILS.includes(email) ? 'admin' : 'client';
          const user = { uid: fbUser.uid, email, name: fbUser.displayName || email.split('@')[0], role, lastLoginAt: new Date().toISOString() };
          await fb.db.collection('users').doc(fbUser.uid).set(user, { merge: true });
          VM.storage.set('currentUser', user);
          return { success: true, user, role };
        }
      } catch (e) {
        const code = e && e.code ? e.code : '';
        const msg = code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
          : 'تعذر الاتصال بفايربيز، سيتم تجربة الدخول المحلي';
        if(!code.includes('user-not-found') && !code.includes('wrong-password') && !code.includes('invalid-credential')) console.warn(msg, e);
        else throw new Error(msg);
      }
      const users = VM.storage.get('users', []);
      const allUsers = [...users];
      const user = allUsers.find(u => (u.email||'').toLowerCase() === email && u.password === pass);
      if (user) { VM.storage.set('currentUser', user); return { success: true, user, role:user.role }; }
      throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    },
    async register(data) {
      data.email = (data.email || '').trim().toLowerCase();
      data.role = VM_ADMIN_EMAILS.includes(data.email) ? 'admin' : 'client';
      data.createdAt = new Date().toISOString();
      try {
        const fb = await window.VMFirebaseReady;
        if (fb && fb.online) {
          const cred = await fb.auth.createUserWithEmailAndPassword(data.email, data.password);
          if (data.name) await cred.user.updateProfile({ displayName: data.name });
          const profile = { ...data, uid: cred.user.uid };
          delete profile.password;
          await fb.db.collection('users').doc(cred.user.uid).set(profile, { merge: true });
          VM.storage.set('currentUser', profile);
          return { success: true, user: profile };
        }
      } catch(e) {
        if((e.code||'').includes('email-already-in-use')) throw new Error('البريد الإلكتروني مسجل مسبقاً');
        throw new Error(e.message || 'تعذر إنشاء الحساب');
      }
      const users = VM.storage.get('users', []);
      if (users.find(u => (u.email||'').toLowerCase() === data.email)) throw new Error('البريد الإلكتروني مسجل مسبقاً');
      users.push(data); VM.storage.set('users', users); VM.storage.set('currentUser', data);
      return { success: true, user:data };
    },
    async resetPassword(email){ try{ const fb=await window.VMFirebaseReady; if(fb&&fb.online){ await fb.auth.sendPasswordResetEmail(email); return {success:true}; }}catch(e){ throw new Error('تعذر إرسال رابط استعادة كلمة المرور'); } return {success:true}; },
    async loginWithGoogle(){ try{ const fb=await window.VMFirebaseReady; if(fb&&fb.online){ const provider=new firebase.auth.GoogleAuthProvider(); const cred=await fb.auth.signInWithPopup(provider); const u=cred.user; const profile={uid:u.uid,email:u.email,name:u.displayName||'عميل',role:'client',lastLoginAt:new Date().toISOString()}; await fb.db.collection('users').doc(u.uid).set(profile,{merge:true}); VM.storage.set('currentUser',profile); return {success:true,user:profile}; }}catch(e){ throw new Error('تعذر تسجيل الدخول بجوجل'); } },
    async logout() { try{ const fb = await window.VMFirebaseReady; if(fb && fb.online) await fb.auth.signOut(); }catch(e){} VM.storage.set('currentUser', null); location.href = 'index.html'; },
    current() { return VM.storage.get('currentUser'); },
    isAdmin() { const u = this.current(); return !!(u && (u.role === 'admin' || VM_ADMIN_EMAILS.includes((u.email||'').toLowerCase()))); },
    isLoggedIn() { return !!this.current(); }
  },

  // ---- Orders ----
  orders: {
    add(data) {
      data.status = 'new';
      const order = VM.storage.push('orders', data);
      VM.notify('تم إرسال طلبك بنجاح وسيتم التواصل معك قريبًا', 'success');
      return order;
    },
    getAll() { return VM.storage.get('orders', []); },
    updateStatus(id, status) {
      const orders = this.getAll();
      const idx = orders.findIndex(o => o.id === id);
      if (idx > -1) { orders[idx].status = status; VM.storage.set('orders', orders); }
    }
  },

  // ---- Toast Notifications ----
  notify(msg, type = 'success', duration = 4000) {
    let container = document.getElementById('vm-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'vm-toast-container';
      container.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
    toast.style.cssText = `background:${colors[type]||colors.info};color:#fff;padding:14px 28px;border-radius:10px;font-size:15px;font-family:Cairo,sans-serif;direction:rtl;box-shadow:0 4px 20px rgba(0,0,0,0.3);pointer-events:auto;animation:slideDown .3s ease;max-width:420px;text-align:center;`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideUp .3s ease'; setTimeout(() => toast.remove(), 300); }, duration);
  },

  // ---- Nav Scroll Effect ----
  initNav() {
    const header = document.getElementById('header');
    if (!header) return;
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 80);
    });
    // Mobile toggle
    const toggle = document.getElementById('navToggle');
    const menu = document.getElementById('navMenu');
    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        menu.classList.toggle('open');
        toggle.classList.toggle('active');
      });
    }
    // Dropdown
    document.querySelectorAll('.nav-dropdown').forEach(item => {
      item.addEventListener('mouseenter', () => item.classList.add('active'));
      item.addEventListener('mouseleave', () => item.classList.remove('active'));
    });
    // Update auth buttons
    const user = this.auth.current ? VM.auth.current() : null;
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn && user) {
      loginBtn.textContent = user.name || 'لوحتي';
      loginBtn.href = user.role === 'admin' ? 'admin-dashboard.html' : 'client-dashboard.html';
    }
  },

  // ---- Scroll Animations ----
  initAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('animate-in'); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate').forEach(el => observer.observe(el));
  },

  // ---- Init ----
  init() {
    this.trackVisit();
    this.initNav();
    this.initAnimations();
    // Inject toast animation css
    if (!document.getElementById('vm-anim-style')) {
      const s = document.createElement('style');
      s.id = 'vm-anim-style';
      s.textContent = '@keyframes slideDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}@keyframes slideUp{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-20px)}}';
      document.head.appendChild(s);
    }
  }
};

// Auto-init
document.addEventListener('DOMContentLoaded', () => VM.init());
