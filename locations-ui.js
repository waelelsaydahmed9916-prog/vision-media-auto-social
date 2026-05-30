
(function(){
'use strict';
function $(id){return document.getElementById(id)}
function data(){return window.getVMLocationsData ? window.getVMLocationsData() : (window.VM_LOCATIONS_FULL||{});}
function keys(o){return Object.keys(o||{});}
function fill(el, arr, ph){if(!el)return; el.innerHTML=''; if(ph){var op=document.createElement('option');op.value='';op.textContent=ph;el.appendChild(op);} (arr||[]).forEach(function(x){var op=document.createElement('option');op.value=x;op.textContent=x;el.appendChild(op);});}
function ensureManual(containerId, id, placeholder){var old=$(id); if(old)return old; var el=document.createElement('input'); el.id=id; el.name=id; el.type='text'; el.placeholder=placeholder||'اكتب يدويًا'; el.style.display='none'; el.className='form-control'; var host=containerId?$(containerId):null; if(host)host.appendChild(el); return el;}
function setLabels(prefix,c){
 var L=data()[c]||{};
 var map={regRegionLabel:L.level1Label, regCityLabel:L.level2Label, regDistrictLabel:L.level3Label};
 Object.keys(map).forEach(function(id){var el=$(id); if(el) el.textContent=map[id]||el.textContent;});
}
function wireRegister(){
 var country=$('regCountry'), region=$('regRegion'), city=$('regCity'), district=$('regDistrict'), code=$('regPhoneCode'), phone=$('regPhone');
 if(!country||!city||!district) return;
 if(!region){
   var cityGroup=$('grpCity');
   region=document.createElement('select'); region.id='regRegion'; region.name='region'; region.required=true;
   var wrap=document.createElement('div'); wrap.className='form-group'; wrap.id='grpRegion';
   var lab=document.createElement('label'); lab.id='regRegionLabel'; lab.textContent='المنطقة / المحافظة';
   wrap.appendChild(lab); wrap.appendChild(region);
   if(cityGroup && cityGroup.parentNode) cityGroup.parentNode.insertBefore(wrap, cityGroup);
 }
 var manual=ensureManual('grpDistrict','regDistrictManual','اكتب الحي / المركز يدويًا');
 var D=data(); var countries=keys(D);
 fill(country,countries,'اختر الدولة'); countries.forEach(function(k){var opt=country.querySelector('option[value="'+k+'"]'); if(opt) opt.textContent=D[k].label;});
 if(code){ code.innerHTML=''; countries.forEach(function(k){var op=document.createElement('option');op.value=D[k].phoneCode;op.textContent=D[k].phoneCode+' — '+D[k].label;op.setAttribute('data-country',k);code.appendChild(op);}); }
 function renderRegions(){var c=country.value||countries[0]; var item=D[c]; if(!item)return; if(code) code.value=item.phoneCode; if(phone) phone.placeholder=item.phonePlaceholder||''; setLabels('',c); fill(region,keys(item.regions),'اختر '+(item.level1Label||'المنطقة')); renderCities();}
 function renderCities(){var c=country.value; var r=region.value; var item=D[c]; var obj=item&&item.regions&&item.regions[r]; fill(city, keys(obj),'اختر '+((item&&item.level2Label)||'المدينة')); renderDistricts();}
 function renderDistricts(){var c=country.value, r=region.value, ct=city.value; var item=D[c]; var arr=item&&item.regions&&item.regions[r]&&item.regions[r][ct]; fill(district, arr||[], 'اختر '+((item&&item.level3Label)||'الحي')); var no=(!arr||!arr.length||arr.indexOf('إدخال يدوي')>-1); manual.style.display=no?'block':'none'; if(no) manual.required=true; else manual.required=false;}
 country.onchange=renderRegions; region.onchange=renderCities; city.onchange=renderDistricts;
 if(code){code.onchange=function(){var opt=code.options[code.selectedIndex]; if(opt&&opt.dataset.country){country.value=opt.dataset.country; renderRegions();}};}
 if(!country.value) country.value='SA'; renderRegions();
}
function wireRequest(){
 var country=$('country'), city=$('city'), code=$('countryCode'), phone=$('phone');
 if(!country||!city) return;
 var D=data(), countries=keys(D);
 var region=$('reqRegion'), district=$('reqDistrict'), manual=$('reqDistrictManual');
 if(!region){ region=document.createElement('select'); region.id='reqRegion'; region.name='region'; region.required=true; var fg=document.createElement('div');fg.className='form-group';fg.innerHTML='<label id="reqRegionLabel">المنطقة / المحافظة <span class="req">*</span></label>'; fg.appendChild(region); var ref=country.closest('.form-group'); if(ref&&ref.parentNode) ref.parentNode.insertBefore(fg, ref.nextSibling); }
 if(city.tagName.toLowerCase()!=='select'){
   var sel=document.createElement('select'); sel.id='city'; sel.name='city'; sel.required=true; city.parentNode.replaceChild(sel,city); city=sel;
 }
 if(!district){ var fg2=document.createElement('div');fg2.className='form-group';fg2.id='reqDistrictGroup';fg2.innerHTML='<label id="reqDistrictLabel">الحي</label><select id="reqDistrict" name="district"></select><input id="reqDistrictManual" class="form-control" placeholder="اكتب الحي يدويًا" style="display:none;margin-top:8px">'; city.closest('.form-group').parentNode.insertBefore(fg2, city.closest('.form-group').nextSibling); district=$('reqDistrict'); manual=$('reqDistrictManual'); }
 fill(country,countries,'اختر الدولة'); countries.forEach(function(k){var opt=country.querySelector('option[value="'+k+'"]'); if(opt) opt.textContent=D[k].label;});
 if(code){ code.innerHTML=''; countries.forEach(function(k){var op=document.createElement('option');op.value=D[k].phoneCode;op.textContent=D[k].phoneCode+' — '+D[k].label;op.dataset.country=k;code.appendChild(op);}); }
 function r1(){var c=country.value||'SA', item=D[c]; if(!item)return; if(code) code.value=item.phoneCode; if(phone) phone.placeholder=item.phonePlaceholder||''; fill(region,keys(item.regions),'اختر '+item.level1Label); r2();}
 function r2(){var item=D[country.value], obj=item&&item.regions&&item.regions[region.value]; fill(city,keys(obj),'اختر '+(item&&item.level2Label||'المدينة')); r3();}
 function r3(){var item=D[country.value], arr=item&&item.regions&&item.regions[region.value]&&item.regions[region.value][city.value]; fill(district,arr||[],'اختر '+(item&&item.level3Label||'الحي')); var no=(!arr||!arr.length||arr.indexOf('إدخال يدوي')>-1); if(manual){manual.style.display=no?'block':'none';}}
 country.onchange=r1; region.onchange=r2; city.onchange=r3; if(code) code.onchange=function(){var opt=code.options[code.selectedIndex]; if(opt&&opt.dataset.country){country.value=opt.dataset.country;r1();}}; country.value='SA'; r1();
}
document.addEventListener('DOMContentLoaded',function(){ setTimeout(function(){wireRegister(); wireRequest();},80); });
})();
