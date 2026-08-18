const C='bg-accounts-v61';
const ASSETS=['./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./index.html'].concat(ASSETS))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  const isPage=e.request.mode==='navigate'||u.pathname.endsWith('/index.html')||u.pathname==='/';
  if(isPage){
    e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put('./index.html',cp));return r;})
      .catch(()=>caches.match('./index.html')));
  }else{
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(rs=>{const cp=rs.clone();caches.open(C).then(c=>c.put(e.request,cp));return rs;}).catch(()=>caches.match('./index.html'))));
  }
});