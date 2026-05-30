/* VISION MEDIA Firebase Messaging Service Worker - Netlify/Firebase Ready */
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: "AIzaSyBMsHTXOeTIOfb7LtWkQJG_389u9lpNBxQ",
  authDomain: "wael-site-2c2df.firebaseapp.com",
  databaseURL: "https://wael-site-2c2df-default-rtdb.firebaseio.com",
  projectId: "wael-site-2c2df",
  storageBucket: "wael-site-2c2df.firebasestorage.app",
  messagingSenderId: "225390136594",
  appId: "1:225390136594:web:a69f801fc2804d6634f7cb",
  measurementId: "G-RXJ4BWFP5N"
});
try{
  const messaging=firebase.messaging();
  messaging.onBackgroundMessage((payload)=>{
    const n=payload.notification||{};
    self.registration.showNotification(n.title||'VISION MEDIA',{body:n.body||'لديك إشعار جديد',icon:'/assets/logo.png',badge:'/assets/logo.png',data:{url:(payload.data&&payload.data.url)||'/'}});
  });
}catch(e){}
self.addEventListener('notificationclick',event=>{event.notification.close();const url=(event.notification.data&&event.notification.data.url)||'/';event.waitUntil(clients.matchAll({type:'window'}).then(list=>{for(const c of list){if(c.url.includes(location.origin)){c.focus();c.navigate(url);return;}}return clients.openWindow(url);}));});

// ملاحظة: Web Push VAPID Key يتم وضعه في core.js عبر window.VISION_MEDIA_VAPID_KEY أو localStorage عند الحاجة.
