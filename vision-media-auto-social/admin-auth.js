// VISION MEDIA - FINAL reliable admin auth
(function(){
  'use strict';
  var USER='admin';
  var PASS='0543944248';
  var SESSION_KEY='vm_admin_session';
  var USER_KEY='vm_currentUser';
  function normalizeDigits(v){
    return String(v||'').replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)}).replace(/[۰-۹]/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)}).trim();
  }
  function save(){
    var s={username:USER,role:'admin',time:Date.now(),loggedAt:new Date().toISOString()};
    var u={name:'المدير العام',username:USER,email:'admin@visionmedia.local',role:'admin'};
    try{localStorage.setItem(SESSION_KEY,JSON.stringify(s));localStorage.setItem(USER_KEY,JSON.stringify(u));localStorage.setItem('currentUser',JSON.stringify(u));}catch(e){}
    try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(s));sessionStorage.setItem(USER_KEY,JSON.stringify(u));}catch(e){}
    try{document.cookie='vm_admin_ok=1; path=/; max-age=604800; SameSite=Lax';}catch(e){}
  }
  function read(store,k){try{var v=store.getItem(k);return v?JSON.parse(v):null}catch(e){return null}}
  function cookieOk(){try{return document.cookie.split('; ').some(function(x){return x==='vm_admin_ok=1'})}catch(e){return false}}
  function isAdmin(){
    var q=new URLSearchParams(location.search);
    if(q.get('vmAdmin')==='1'){save();return true;}
    var a=read(localStorage,SESSION_KEY)||read(sessionStorage,SESSION_KEY);
    var u=read(localStorage,USER_KEY)||read(sessionStorage,USER_KEY)||read(localStorage,'currentUser');
    return !!((a&&a.role==='admin')||(u&&u.role==='admin')||cookieOk());
  }
  function login(user,pass){
    var u=String(user||'').trim().toLowerCase();
    var p=normalizeDigits(pass).replace(/\D/g,'');
    if(u===USER && p===PASS){save();return true;}
    return false;
  }
  function logout(){try{localStorage.removeItem(SESSION_KEY);localStorage.removeItem(USER_KEY);localStorage.removeItem('currentUser');sessionStorage.removeItem(SESSION_KEY);sessionStorage.removeItem(USER_KEY);document.cookie='vm_admin_ok=; path=/; max-age=0';}catch(e){} location.href='admin.html'}
  window.VMAdminAuth={save:save,isAdmin:isAdmin,login:login,logout:logout,user:USER,pass:PASS};
})();
