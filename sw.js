const C='bg-accounts-v130';
const ASSETS=['./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./index.html'].concat(ASSETS))).then(()=>self.skipWaiting()));});
/* استثناء bg-fonts من المسح: كان بيتمسح مع كل تحديث نسخة فيرجع التطبيق أوفلاين من غير خط Cairo */
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!=='bg-fonts').map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('message',e=>{if(e.data==='skipWaiting')self.skipWaiting();});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.origin!==location.origin){
    /* الخطوط: تخزين دائم بعد أول تحميل — شغل أوفلاين كامل */
    if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
      e.respondWith(caches.open('bg-fonts').then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(rs=>{if(rs&&(rs.ok||rs.type==='opaque'))c.put(e.request,rs.clone());return rs;}))));
    }
    return;
  }
  const isPage=e.request.mode==='navigate'||u.pathname.endsWith('/index.html')||u.pathname==='/'||u.pathname.endsWith('/');
  if(isPage){
    /* الصفحة: الشبكة أولاً مع إعادة تحقق بالـ ETag (بدل ?v= اللي كان بيعيد تنزيل 263KB كل فتحة) */
    e.respondWith(
      fetch(new Request(u.pathname,{cache:'no-cache',credentials:'same-origin'}))
        .then(r=>{if(!r||!r.ok)throw 0;const cp=r.clone();caches.open(C).then(c=>c.put('./index.html',cp));return r;})
        .catch(()=>caches.match('./index.html').then(r=>r||fetch(e.request)))
    );
  }else{
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(rs=>{
      if(rs&&rs.ok){const cp=rs.clone();caches.open(C).then(c=>c.put(e.request,cp));}
      return rs;}).catch(()=>new Response('',{status:504}))));  /* أصل ناقص أوفلاين = خطأ صريح، مش صفحة HTML بنوع غلط */
  }
});
