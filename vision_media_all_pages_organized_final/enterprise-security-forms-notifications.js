/* VISION MEDIA Enterprise Security, Biometrics, Notifications, Dynamic Forms
   يعمل بدون حذف أي ميزة قديمة، ويستخدم Firebase عند توفره، ومع localStorage كطبقة واجهة مؤقتة. */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const key='vm_';
  const get=(k,d=[])=>{try{return JSON.parse(localStorage.getItem(key+k) ?? localStorage.getItem(k) ?? JSON.stringify(d));}catch(e){return d;}};
  const set=(k,v)=>{localStorage.setItem(key+k,JSON.stringify(v));localStorage.setItem(k,JSON.stringify(v));};
  const id=()=> 'id_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8);
  const now=()=>new Date().toISOString();
  const esc=s=>String(s??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));
  const toast=(msg,type='ok')=>{let t=document.createElement('div');t.textContent=msg;t.style.cssText=`position:fixed;z-index:99999;top:20px;left:20px;background:${type==='err'?'#c62828':'#0d1b2e'};color:#fff;padding:12px 18px;border-radius:12px;box-shadow:0 10px 30px #0003;font-weight:700`;document.body.appendChild(t);setTimeout(()=>t.remove(),3000)};
  const log=(action,section,oldData,newData)=>{let a=get('activityLogs',[]);a.unshift({id:id(),userId:get('currentUser',{}).id||'admin',userName:get('currentUser',{}).fullName||'النظام',action,section,oldData,newData,device:navigator.userAgent,createdAt:now()});set('activityLogs',a.slice(0,800));};
  function addNotif(targetRole,title,body,url,type='system',userId='all'){
    const arr=get('notifications',[]);arr.unshift({id:id(),targetRole,userId,title,body,url,type,read:false,createdAt:now()});set('notifications',arr);
    try{ if(Notification.permission==='granted') new Notification(title,{body,icon:'assets/logo.png'}); }catch(e){}
  }
  window.VMEnterprise={get,set,log,addNotif,toast};

  // ───────────────── Public notification permission - native browser only ─────────────────
  // المطلوب: لا تظهر نافذة تصميم داخل الموقع. يظهر طلب المتصفح الأصلي مرة واحدة فقط لكل الموقع.
  const VM_NATIVE_NOTIFY_KEY = 'vm_native_notification_permission_done_v1';
  const VM_NATIVE_FCM_TOKEN_KEY = 'vm_fcm_token_saved_v1';

  async function saveBrowserNotificationToken(){
    try{
      const uid=(get('currentUser',{})||{}).id || (get('vm_currentUser',{})||{}).id || 'visitor';
      const role=(get('currentUser',{})||{}).role || (get('vm_currentUser',{})||{}).role || 'visitor';
      let token='browser_permission_'+uid+'_'+btoa(navigator.userAgent).slice(0,18);

      // إذا تم ضبط Firebase Messaging و VAPID في core.js يمكن حفظ FCM token الحقيقي.
      try{
        if(window.firebase && firebase.messaging && 'serviceWorker' in navigator){
          await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          const vapid=(window.VISION_MEDIA_VAPID_KEY || localStorage.getItem('VISION_MEDIA_VAPID_KEY') || '').trim();
          if(vapid && !vapid.includes('ضع_هنا')){
            token = await firebase.messaging().getToken({vapidKey:vapid}) || token;
          }
        }
      }catch(e){ console.warn('FCM token optional save failed:', e); }

      let tokens=get('notificationTokens',[]);
      tokens=tokens.filter(x=>!(x.userId===uid && x.device===navigator.userAgent));
      tokens.push({id:id(),userId:uid,role,token,device:navigator.userAgent,permission:'granted',page:location.pathname,createdAt:now(),active:true});
      set('notificationTokens',tokens);

      try{
        if(window.firebase && firebase.firestore){
          await firebase.firestore().collection('notificationTokens').doc(token).set({
            token,userId:uid,role,device:navigator.userAgent,permission:'granted',page:location.pathname,updatedAt:new Date().toISOString(),active:true
          },{merge:true});
        }
      }catch(e){ console.warn('Firestore notification token save failed:', e); }

      addNotif('admin','تم السماح بالإشعارات','مستخدم/زائر فعّل إشعارات المتصفح في VISION MEDIA','#','notification','admin');
    }catch(e){ console.warn('saveBrowserNotificationToken error:', e); }
  }

  async function requestNativeNotificationOnce(){
    if(!('Notification' in window)) return;
    if(localStorage.getItem(VM_NATIVE_NOTIFY_KEY)) return;
    if(Notification.permission==='granted'){
      localStorage.setItem(VM_NATIVE_NOTIFY_KEY, JSON.stringify({status:'granted',at:now()}));
      await saveBrowserNotificationToken();
      return;
    }
    if(Notification.permission==='denied'){
      localStorage.setItem(VM_NATIVE_NOTIFY_KEY, JSON.stringify({status:'denied',at:now()}));
      return;
    }
    try{
      // يظهر طلب المتصفح الأصلي فقط، ولا توجد نافذة مخصصة داخل الصفحة.
      const result = await Notification.requestPermission();
      localStorage.setItem(VM_NATIVE_NOTIFY_KEY, JSON.stringify({status:result,at:now()}));
      localStorage.setItem('vm_notificationDecision', JSON.stringify({status:result,at:now()}));
      localStorage.setItem('vm_notification_permission', JSON.stringify({status:result,at:now()}));
      if(result==='granted') await saveBrowserNotificationToken();
    }catch(e){
      // بعض المتصفحات لا تسمح بالطلب إلا بعد أول تفاعل من المستخدم.
      console.warn('Native notification permission postponed:', e);
    }
  }

  function installNativeNotificationOnce(){
    if(!('Notification' in window)) return;
    if(localStorage.getItem(VM_NATIVE_NOTIFY_KEY) || Notification.permission==='granted' || Notification.permission==='denied'){
      if(Notification.permission==='granted') saveBrowserNotificationToken();
      return;
    }
    const fire=()=>{ requestNativeNotificationOnce(); cleanup(); };
    const cleanup=()=>['click','touchstart','keydown','scroll'].forEach(ev=>document.removeEventListener(ev,fire,true));
    // أول تفاعل فقط حتى يظهر طلب Google/Chrome الأصلي مرة واحدة للموقع بالكامل.
    ['click','touchstart','keydown','scroll'].forEach(ev=>document.addEventListener(ev,fire,true));
  }

  // ───────────────── Forgot password modal ─────────────────
  function installForgot(){
    const link=$('#forgotPassLink'); if(!link || link.dataset.vmInstalled)return; link.dataset.vmInstalled='1';
    link.onclick=e=>{e.preventDefault();showResetModal();};
  }
  function showResetModal(){
    const m=document.createElement('div');m.id='vmResetModal';m.dir='rtl';m.innerHTML=`<div style="position:fixed;inset:0;background:#0008;z-index:99999;display:flex;align-items:center;justify-content:center;padding:18px"><div style="background:#fff;border-radius:18px;padding:24px;max-width:450px;width:100%;font-family:Tahoma,Arial"><button id="vmResetClose" style="float:left;border:0;background:none;font-size:22px;cursor:pointer">×</button><h2 style="margin:0 0 10px;color:#0d1b2e">استرجاع كلمة المرور</h2><p style="font-size:13px;color:#667;line-height:1.7">إذا كان البريد مسجلًا لدينا، سيتم إرسال كود التحقق أو رابط إعادة التعيين.</p><label style="font-weight:700;font-size:13px">البريد الإلكتروني</label><input id="vmResetEmail" type="email" style="width:100%;padding:12px;border:1px solid #dce4ef;border-radius:12px;margin:8px 0 12px"><button id="vmSendReset" style="width:100%;border:0;border-radius:12px;background:#c9a227;color:#0d1b2e;padding:13px;font-weight:900;cursor:pointer">إرسال التحقق</button><div id="vmResetStep2" style="display:none;margin-top:16px"><label style="font-weight:700;font-size:13px">كود التحقق</label><input id="vmResetCode" style="width:100%;padding:12px;border:1px solid #dce4ef;border-radius:12px;margin:8px 0"><label style="font-weight:700;font-size:13px">كلمة المرور الجديدة</label><input id="vmNewPass" type="password" style="width:100%;padding:12px;border:1px solid #dce4ef;border-radius:12px;margin:8px 0"><button id="vmConfirmReset" style="width:100%;border:0;border-radius:12px;background:#0d1b2e;color:#fff;padding:13px;font-weight:900;cursor:pointer">تغيير كلمة المرور</button></div></div></div>`;document.body.appendChild(m);$('#vmResetClose').onclick=()=>m.remove();
    $('#vmSendReset').onclick=async()=>{
      const email=$('#vmResetEmail').value.trim().toLowerCase(); if(!email)return toast('اكتب البريد الإلكتروني','err');
      const cooldown=+localStorage.getItem('vm_reset_cooldown_'+email)||0; if(Date.now()-cooldown<60000)return toast('انتظر دقيقة قبل إرسال كود جديد','err');
      localStorage.setItem('vm_reset_cooldown_'+email,Date.now());
      try{
        if(window.firebase && firebase.auth){await firebase.auth().sendPasswordResetEmail(email); toast('إذا كان البريد مسجلًا لدينا، سيتم إرسال رابط التحقق'); return;}
      }catch(e){}
      const code=String(Math.floor(100000+Math.random()*900000)); let resets=get('passwordResets',[]); resets=resets.filter(r=>r.email!==email); resets.push({id:id(),email,code,expires:Date.now()+600000,tries:0,createdAt:now(),status:'pending'}); set('passwordResets',resets);
      addNotif('admin','طلب استرجاع كلمة مرور','تم إنشاء طلب استرجاع لكلمة المرور من '+email,'#password-resets','security','admin');
      $('#vmResetStep2').style.display='block'; toast('إذا كان البريد مسجلًا لدينا، سيتم إرسال كود التحقق');
    };
    $('#vmConfirmReset').onclick=()=>{
      const email=$('#vmResetEmail').value.trim().toLowerCase(), code=$('#vmResetCode').value.trim(), pass=$('#vmNewPass').value;
      let resets=get('passwordResets',[]), r=resets.find(x=>x.email===email && x.status==='pending');
      if(!r || Date.now()>r.expires)return toast('انتهت صلاحية الكود','err');
      r.tries=(r.tries||0)+1; if(r.tries>5){r.status='blocked';set('passwordResets',resets);return toast('تم إيقاف المحاولات لهذا الكود','err');}
      if(r.code!==code){set('passwordResets',resets);return toast('الكود غير صحيح','err');}
      let users=get('users',[]); let u=users.find(x=>(x.email||'').toLowerCase()===email); if(u){u.passwordHash=pass;u.password=pass;}
      r.status='done'; set('users',users); set('passwordResets',resets); log('تغيير كلمة مرور','الحسابات',null,{email}); toast('تم تغيير كلمة السر بنجاح، يمكنك تسجيل الدخول الآن'); setTimeout(()=>m.remove(),800);
    };
  }

  // ───────────────── WebAuthn / Passkey helper ─────────────────
  async function webauthnAvailable(){return !!(window.PublicKeyCredential && navigator.credentials && location.protocol==='https:');}
  async function enableBiometricForUser(user){
    if(!(await webauthnAvailable())){toast('الجهاز أو المتصفح لا يدعم Passkeys على هذا الرابط. استخدم PIN أو كلمة المرور.','err');return false;}
    const challenge=new Uint8Array(32); crypto.getRandomValues(challenge);
    const uidBytes=new TextEncoder().encode(String(user.id||user.username||user.email).slice(0,60));
    const cred=await navigator.credentials.create({publicKey:{challenge,rp:{name:'VISION MEDIA'},user:{id:uidBytes,name:user.email||user.username||user.fullName,displayName:user.fullName||user.username||'VISION USER'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{userVerification:'preferred'},timeout:60000,attestation:'none'}});
    const creds=get('biometricCredentials',[]).filter(c=>c.userId!==user.id);
    creds.push({id:id(),userId:user.id,credentialId:btoa(String.fromCharCode(...new Uint8Array(cred.rawId))),enabled:true,device:navigator.userAgent,createdAt:now(),lockedByAdmin:false});set('biometricCredentials',creds);log('تفعيل بصمة','البصمة',null,{userId:user.id});toast('تم تفعيل الدخول بالبصمة/Face ID');return true;
  }
  async function verifyBiometric(user){
    const c=get('biometricCredentials',[]).find(x=>x.userId===user.id && x.enabled && !x.lockedByAdmin);
    if(!c){toast('لم يتم تفعيل البصمة لهذا الحساب','err');return false;}
    if(!(await webauthnAvailable())){toast('البصمة غير مدعومة على هذا الجهاز، استخدم PIN','err');return false;}
    const challenge=new Uint8Array(32); crypto.getRandomValues(challenge);
    await navigator.credentials.get({publicKey:{challenge,allowCredentials:[{type:'public-key',id:Uint8Array.from(atob(c.credentialId),ch=>ch.charCodeAt(0))}],userVerification:'preferred',timeout:60000}});
    return true;
  }
  window.VMBio={enable:enableBiometricForUser,verify:verifyBiometric,available:webauthnAvailable};

  // ───────────────── Employee/user portal enhancements ─────────────────
  function installPortalBio(){
    if(!/employee-portal|user-portal|employee\.html/.test(location.pathname))return;
    const wrap=$('.wrap')||document.body;
    if($('#vmBioCard'))return;
    const card=document.createElement('div');card.className='card';card.id='vmBioCard';card.innerHTML=`<h3>الدخول والحضور بالبصمة</h3><p class="small">يستخدم النظام Passkeys/WebAuthn ولا يتم حفظ صورة البصمة نفسها.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn" id="vmEnableBio">تفعيل البصمة/Face ID</button><button class="btn" id="vmBioLogin">دخول بالبصمة</button><button class="btn" id="vmBioResetReq">طلب إعادة تفعيل البصمة</button></div>`; wrap.prepend(card);
    $('#vmEnableBio').onclick=()=>{const u=get('currentUser',null)||get('vm_currentUser',null); if(!u)return toast('سجّل الدخول أولاً','err'); enableBiometricForUser(u);};
    $('#vmBioLogin').onclick=async()=>{const u=get('currentUser',null)||get('vm_currentUser',null); if(!u)return toast('اكتب بياناتك أولاً ثم فعّل البصمة','err'); if(await verifyBiometric(u))toast('تم التحقق بالبصمة');};
    $('#vmBioResetReq').onclick=()=>{const u=get('currentUser',null)||get('vm_currentUser',null); if(!u)return toast('سجّل الدخول أولاً','err');let arr=get('biometricResetRequests',[]);arr.unshift({id:id(),userId:u.id,userName:u.fullName||u.username||u.email,status:'pending',reason:'تغيير جهاز أو إعادة تفعيل البصمة',createdAt:now()});set('biometricResetRequests',arr);addNotif('admin','طلب إعادة تفعيل بصمة','طلب جديد من '+(u.fullName||u.username||u.email),'#biometric','security','admin');toast('تم إرسال طلب إعادة تفعيل البصمة للأدمن');};
    // ربط أزرار الحضور الموجودة بالبصمة إذا وجدت
    $$('button').forEach(b=>{const txt=b.textContent||''; if(/تسجيل حضور|تسجيل انصراف/.test(txt) && !b.dataset.bioWrap){b.dataset.bioWrap='1'; const old=b.onclick; b.onclick=async(ev)=>{const u=get('currentUser',null)||get('vm_currentUser',null); if(u){try{await verifyBiometric(u);}catch(e){return toast('فشل التحقق بالبصمة، استخدم PIN إذا كان مسموحًا','err');}} if(typeof old==='function')return old.call(b,ev);};}});
  }

  // ───────────────── Dynamic form fields renderer ─────────────────
  function renderDynamicFields(target,scope){
    const host=$(target); if(!host)return;
    const fields=get('formFields',[]).filter(f=>f.active!==false && (f.scopes||[]).includes(scope)).sort((a,b)=>(a.order||0)-(b.order||0));
    host.innerHTML=fields.map(f=>`<div class="form-group vm-dyn-field"><label>${esc(f.label)} ${f.required?'*':''}</label>${fieldHtml(f)}</div>`).join('');
  }
  function fieldHtml(f){let req=f.required?'required':''; if(f.type==='select')return `<select name="${esc(f.name)}" ${req}>${(f.options||[]).map(o=>`<option>${esc(o)}</option>`).join('')}</select>`; if(f.type==='file'||f.type==='image')return `<input type="file" name="${esc(f.name)}" ${req}>`; if(f.type==='checkbox')return `<label><input type="checkbox" name="${esc(f.name)}" ${req}> ${esc(f.placeholder||'أوافق')}</label>`; return `<input type="${f.type||'text'}" name="${esc(f.name)}" placeholder="${esc(f.placeholder||'')}" ${req}>`;}
  window.renderVMDynamicFields=renderDynamicFields;
  // Inject in auth/register/request forms if markers absent
  setTimeout(()=>{installNativeNotificationOnce(); installForgot();installPortalBio(); renderDynamicFields('#vmRegisterDynamicFields','clientRegister'); renderDynamicFields('#vmRequestDynamicFields','serviceRequest');},600);

  // ───────────────── Admin full-control panels ─────────────────
  function installAdmin(){
    if(!/admin-dashboard/.test(location.pathname))return;
    const nav=$('.dash-sidebar')||$('.sidebar')||document.body, content=$('.dash-content')||$('.dash-main')||document.body;
    if($('#enterpriseFullPanels'))return;
    const navBox=document.createElement('div');navBox.innerHTML=`<div class="nav-section-title">أنظمة متقدمة</div>
      <a class="dash-nav-link" data-panel="biometricPanel"><i class="fas fa-fingerprint"></i>البصمة وطلبات إعادة التفعيل <span class="badge-count" id="bioReqCount">0</span></a>
      <a class="dash-nav-link" data-panel="notifCenterPanel"><i class="fas fa-bell"></i>مركز الإشعارات</a>
      <a class="dash-nav-link" data-panel="formsAdminPanel"><i class="fas fa-list-check"></i>نماذج التسجيل والطلبات</a>
      <a class="dash-nav-link" data-panel="clientSectionsPanel"><i class="fas fa-user-gear"></i>إدارة كل أقسام العميل</a>
      <a class="dash-nav-link" data-panel="activityLogPanel"><i class="fas fa-clock-rotate-left"></i>سجل النشاط</a>`;nav.appendChild(navBox);
    const panels=document.createElement('div');panels.id='enterpriseFullPanels';panels.innerHTML=`
      <section class="panel" id="biometricPanel"><h2 class="page-title">إدارة البصمة وPasskeys</h2><p class="page-sub">لا يتم حفظ صورة البصمة، فقط مفاتيح WebAuthn الآمنة.</p><div class="card"><h3 class="card-title"><i class="fas fa-fingerprint"></i> طلبات إعادة تفعيل البصمة</h3><div id="bioRequestsList"></div></div><div class="card"><h3 class="card-title">البصمات المسجلة</h3><div id="bioCredsList"></div></div></section>
      <section class="panel" id="notifCenterPanel"><h2 class="page-title">مركز الإشعارات</h2><div class="card"><div class="form-row-3"><input class="form-control" id="adminNotifTitle" placeholder="عنوان الإشعار"><input class="form-control" id="adminNotifBody" placeholder="نص الإشعار"><select class="form-control" id="adminNotifTarget"><option value="client">كل العملاء</option><option value="employee">الموظفون</option><option value="admin">الأدمن</option><option value="all">الكل</option></select></div><button class="btn btn-accent" id="sendAdminNotif">إرسال إشعار</button> <button class="btn btn-outline" id="markAllNotifs">تحديد الكل كمقروء</button></div><div class="card"><h3 class="card-title">الإشعارات</h3><div id="adminNotificationsList"></div></div></section>
      <section class="panel" id="formsAdminPanel"><h2 class="page-title">إدارة نماذج التسجيل وطلب الخدمة</h2><div class="card"><h3 class="card-title">إضافة/تعديل خانة</h3><input type="hidden" id="fieldId"><div class="form-row-3"><input class="form-control" id="fieldLabel" placeholder="اسم الخانة"><input class="form-control" id="fieldName" placeholder="name"><select class="form-control" id="fieldType"><option value="text">نص</option><option value="number">رقم</option><option value="email">بريد إلكتروني</option><option value="tel">رقم جوال</option><option value="select">قائمة اختيار</option><option value="date">تاريخ</option><option value="file">ملف</option><option value="image">صورة</option><option value="checkbox">مربع موافقة</option></select></div><div class="form-row"><input class="form-control" id="fieldOptions" placeholder="خيارات القائمة مفصولة بفاصلة"><input class="form-control" id="fieldOrder" type="number" placeholder="الترتيب"></div><div class="filter-tabs"><label><input type="checkbox" class="fieldScope" value="clientRegister"> إنشاء حساب العميل</label><label><input type="checkbox" class="fieldScope" value="employeeRegister"> الموظف</label><label><input type="checkbox" class="fieldScope" value="serviceRequest"> طلب الخدمة</label><label><input type="checkbox" id="fieldRequired"> إلزامي</label></div><button class="btn btn-accent" id="saveFieldBtn">حفظ الخانة</button></div><div class="card"><h3 class="card-title">الخانات الحالية</h3><div id="fieldsList"></div></div></section>
      <section class="panel" id="clientSectionsPanel"><h2 class="page-title">إدارة كل أقسام صفحة العميل</h2><div class="stats-grid" id="clientSectionsStats"></div><div class="card"><div class="form-row-3"><select class="form-control" id="clientSecType"><option>بيانات العملاء</option><option>حسابات العملاء</option><option>طلبات العملاء</option><option>شات العملاء</option><option>ملفات العملاء</option><option>مدفوعات العملاء</option><option>إشعارات العملاء</option><option>تقييمات العملاء</option><option>عناوين العملاء</option><option>سجل دخول العملاء</option><option>صلاحيات العملاء</option><option>نماذج تسجيل العملاء</option><option>محتوى صفحة العميل</option><option>إعدادات صفحة العميل</option></select><input class="form-control" id="clientSecSearch" placeholder="بحث"><button class="btn btn-primary" id="clientSecRefresh">تحديث</button></div><div id="clientSecList" style="margin-top:18px"></div></div></section>
      <section class="panel" id="activityLogPanel"><h2 class="page-title">سجل النشاط</h2><div class="card"><button class="btn btn-outline" onclick="window.print()">طباعة</button><button class="btn btn-accent" id="exportLogsBtn">تصدير CSV</button></div><div class="card"><div id="activityLogsList"></div></div></section>`;
    content.appendChild(panels);
    $$('.dash-nav-link[data-panel]').forEach(a=>a.addEventListener('click',()=>{const p=a.dataset.panel;$$('.dash-nav-link').forEach(x=>x.classList.remove('active'));a.classList.add('active');$$('.panel').forEach(x=>x.classList.remove('active'));$('#'+p)?.classList.add('active');renderAdminPanels();}));
    $('#sendAdminNotif').onclick=()=>{addNotif($('#adminNotifTarget').value,$('#adminNotifTitle').value||'VISION MEDIA',$('#adminNotifBody').value||'إشعار جديد','#','manual');log('إرسال إشعار','الإشعارات',null,{title:$('#adminNotifTitle').value});renderAdminPanels();toast('تم إرسال الإشعار وحفظه');};
    $('#markAllNotifs').onclick=()=>{let n=get('notifications',[]);n.forEach(x=>x.read=true);set('notifications',n);renderAdminPanels();};
    $('#saveFieldBtn').onclick=saveField; $('#clientSecRefresh').onclick=renderClientSections; $('#exportLogsBtn').onclick=exportLogs;
    renderAdminPanels();
  }
  function renderAdminPanels(){renderBioAdmin();renderNotifsAdmin();renderFields();renderClientSections();renderLogs();}
  function renderBioAdmin(){let req=get('biometricResetRequests',[]), creds=get('biometricCredentials',[]); if($('#bioReqCount'))$('#bioReqCount').textContent=req.filter(r=>r.status==='pending').length; if($('#bioRequestsList'))$('#bioRequestsList').innerHTML=req.map(r=>`<div style="padding:12px;border-bottom:1px solid #eef;display:flex;justify-content:space-between;gap:10px"><div><b>${esc(r.userName)}</b><br><small>${esc(r.reason)} · ${new Date(r.createdAt).toLocaleString('ar-SA')}</small><br><span class="badge ${r.status==='approved'?'badge-progress':r.status==='rejected'?'badge-rejected':'badge-review'}">${r.status}</span></div><div><button class="btn btn-sm btn-success" onclick="VMAdminBio('${r.id}','approved')">قبول</button> <button class="btn btn-sm btn-warning" onclick="VMAdminBio('${r.id}','rejected')">رفض</button> <button class="btn btn-sm btn-danger" onclick="VMDeleteBio('${r.userId}')">حذف البصمة القديمة</button></div></div>`).join('')||'لا توجد طلبات'; if($('#bioCredsList'))$('#bioCredsList').innerHTML=creds.map(c=>`<div style="padding:10px;border-bottom:1px solid #eef"><b>${esc(c.userId)}</b> · ${c.enabled?'مفعلة':'معطلة'} · ${new Date(c.createdAt).toLocaleString('ar-SA')} <button class="btn btn-sm btn-warning" onclick="VMToggleBio('${c.userId}')">تعطيل/تفعيل</button></div>`).join('')||'لا توجد بصمات مسجلة';}
  window.VMAdminBio=(rid,status)=>{let r=get('biometricResetRequests',[]), x=r.find(a=>a.id===rid); if(x){x.status=status;x.approvedBy='admin';x.updatedAt=now();set('biometricResetRequests',r);log(status==='approved'?'قبول طلب بصمة':'رفض طلب بصمة','البصمة',null,x);addNotif('employee','تحديث طلب البصمة',status==='approved'?'تم قبول طلب إعادة تفعيل البصمة':'تم رفض طلب إعادة تفعيل البصمة','#','security',x.userId);renderAdminPanels();}};
  window.VMDeleteBio=(uid)=>{if(!confirm('حذف البصمة القديمة لهذا الحساب؟'))return;let c=get('biometricCredentials',[]).filter(x=>x.userId!==uid);set('biometricCredentials',c);log('حذف بصمة قديمة','البصمة',{userId:uid},null);renderAdminPanels();};
  window.VMToggleBio=(uid)=>{let c=get('biometricCredentials',[]);c.forEach(x=>{if(x.userId===uid)x.lockedByAdmin=!x.lockedByAdmin});set('biometricCredentials',c);log('تفعيل/تعطيل بصمة','البصمة',null,{userId:uid});renderAdminPanels();};
  function renderNotifsAdmin(){let n=get('notifications',[]); if($('#adminNotificationsList'))$('#adminNotificationsList').innerHTML=n.map(x=>`<div style="padding:12px;border-bottom:1px solid #eef;display:flex;justify-content:space-between"><div><b>${esc(x.title)}</b> <span class="badge ${x.read?'badge-done':'badge-new'}">${x.read?'مقروء':'جديد'}</span><p>${esc(x.body)}</p><small>${x.targetRole} · ${new Date(x.createdAt).toLocaleString('ar-SA')}</small></div><button class="btn btn-sm btn-danger" onclick="VMDelNotif('${x.id}')">حذف</button></div>`).join('')||'لا توجد إشعارات';}
  window.VMDelNotif=(nid)=>{set('notifications',get('notifications',[]).filter(x=>x.id!==nid));renderAdminPanels();};
  function saveField(){let f=get('formFields',[]), fid=$('#fieldId').value||id(), old=f.find(x=>x.id===fid); let item={id:fid,label:$('#fieldLabel').value,name:$('#fieldName').value||$('#fieldLabel').value.replace(/\s+/g,'_'),type:$('#fieldType').value,options:$('#fieldOptions').value.split(',').map(x=>x.trim()).filter(Boolean),order:+$('#fieldOrder').value||f.length+1,required:$('#fieldRequired').checked,scopes:$$('.fieldScope:checked').map(x=>x.value),active:true,updatedAt:now()}; if(old)Object.assign(old,item); else f.push(item); set('formFields',f);log(old?'تعديل خانة نموذج':'إضافة خانة نموذج','النماذج',old,item);renderFields();toast('تم حفظ الخانة');}
  function renderFields(){let f=get('formFields',[]); if($('#fieldsList'))$('#fieldsList').innerHTML=f.map(x=>`<div style="padding:12px;border-bottom:1px solid #eef;display:flex;justify-content:space-between"><div><b>${esc(x.label)}</b><br><small>${esc(x.type)} · ${(x.scopes||[]).join('، ')}</small></div><div><button class="btn btn-sm btn-outline" onclick="VMEditField('${x.id}')">تعديل</button> <button class="btn btn-sm btn-danger" onclick="VMDeleteField('${x.id}')">حذف</button></div></div>`).join('')||'لا توجد خانات';}
  window.VMEditField=(fid)=>{let x=get('formFields',[]).find(a=>a.id===fid);if(!x)return;$('#fieldId').value=x.id;$('#fieldLabel').value=x.label;$('#fieldName').value=x.name;$('#fieldType').value=x.type;$('#fieldOptions').value=(x.options||[]).join(',');$('#fieldOrder').value=x.order||0;$('#fieldRequired').checked=!!x.required;$$('.fieldScope').forEach(c=>c.checked=(x.scopes||[]).includes(c.value));};
  window.VMDeleteField=(fid)=>{if(!confirm('تأكيد حذف الخانة؟'))return;let f=get('formFields',[]), old=f.find(x=>x.id===fid);set('formFields',f.filter(x=>x.id!==fid));log('حذف خانة نموذج','النماذج',old,null);renderFields();};
  function renderClientSections(){const map={'بيانات العملاء':'clients','حسابات العملاء':'users','طلبات العملاء':'orders','شات العملاء':'supportChats','ملفات العملاء':'clientFiles','مدفوعات العملاء':'payments','إشعارات العملاء':'notifications','تقييمات العملاء':'reviews','عناوين العملاء':'clientAddresses','سجل دخول العملاء':'loginLogs','صلاحيات العملاء':'permissions','نماذج تسجيل العملاء':'formFields','محتوى صفحة العميل':'clientPageSections','إعدادات صفحة العميل':'clientSettings'}; let type=$('#clientSecType')?.value||'بيانات العملاء', k=map[type], rows=get(k,[]), q=($('#clientSecSearch')?.value||'').toLowerCase(); rows=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(q)); if($('#clientSectionsStats'))$('#clientSectionsStats').innerHTML=Object.entries(map).map(([a,b])=>`<div class="stat-card"><div class="stat-num">${get(b,[]).length}</div><div class="stat-label">${a}</div></div>`).join(''); if($('#clientSecList'))$('#clientSecList').innerHTML=`<h3>${type}</h3><table class="dash-table"><tbody>${rows.map(r=>`<tr><td><pre style="white-space:pre-wrap;max-width:780px">${esc(JSON.stringify(r,null,2))}</pre></td><td><button class="btn btn-sm btn-danger" onclick="VMGenericDelete('${k}','${r.id||''}')">حذف</button></td></tr>`).join('')||'<tr><td>لا توجد بيانات</td></tr>'}</tbody></table>`;}
  window.VMGenericDelete=(k,rid)=>{if(!rid || !confirm('تأكيد الحذف؟'))return;let a=get(k,[]), old=a.find(x=>x.id===rid);set(k,a.filter(x=>x.id!==rid));log('حذف عنصر',k,old,null);renderClientSections();};
  function renderLogs(){let a=get('activityLogs',[]); if($('#activityLogsList'))$('#activityLogsList').innerHTML=`<table class="dash-table"><thead><tr><th>الوقت</th><th>المستخدم</th><th>العملية</th><th>القسم</th><th>الجهاز</th></tr></thead><tbody>${a.map(x=>`<tr><td>${new Date(x.createdAt).toLocaleString('ar-SA')}</td><td>${esc(x.userName||x.userId)}</td><td>${esc(x.action)}</td><td>${esc(x.section)}</td><td>${esc((x.device||'').slice(0,80))}</td></tr>`).join('')||'<tr><td colspan="5">لا يوجد سجل</td></tr>'}</tbody></table>`;}
  function exportLogs(){const a=get('activityLogs',[]), csv=['time,user,action,section'].concat(a.map(x=>`"${x.createdAt}","${(x.userName||x.userId||'').replaceAll('"','')}","${(x.action||'').replaceAll('"','')}","${(x.section||'').replaceAll('"','')}"`)).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),ael=document.createElement('a');ael.href=url;ael.download='vision-media-activity-logs.csv';ael.click();URL.revokeObjectURL(url);}
  setTimeout(installAdmin,700);
})();
